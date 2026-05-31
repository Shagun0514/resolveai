const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { analyzeComplaint } = require('../services/aiService');

const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `TKT-${year}-${rand}`;
};

const getSLADueDate = (priority) => {
  const hours = { critical: 4, high: 8, medium: 24, low: 72 };
  const ms = (hours[priority] || 24) * 3600000;
  return new Date(Date.now() + ms);
};

// GET /api/complaints
const getComplaints = async (req, res, next) => {
  try {
    const {
      status, priority, category, channel, sentiment,
      assigned_to, search, page = 1, limit = 20,
      sort = 'created_at', order = 'DESC'
    } = req.query;

    const conditions = [];
    const params = [];

    if (status) { conditions.push(`c.status = $${params.length + 1}`); params.push(status); }
    if (priority) { conditions.push(`c.priority = $${params.length + 1}`); params.push(priority); }
    if (category) { conditions.push(`c.ai_category = $${params.length + 1}`); params.push(category); }
    if (channel) { conditions.push(`c.channel = $${params.length + 1}`); params.push(channel); }
    if (sentiment) { conditions.push(`c.ai_sentiment = $${params.length + 1}`); params.push(sentiment); }
    if (assigned_to === 'me') { /* skip 'me' filter without auth */ }
    else if (assigned_to === 'unassigned') { conditions.push(`c.assigned_to IS NULL`); }
    else if (assigned_to) { conditions.push(`c.assigned_to = $${params.length + 1}`); params.push(assigned_to); }

    if (search) {
      conditions.push(`(c.subject ILIKE $${params.length + 1} OR c.customer_name ILIKE $${params.length + 1} OR c.ticket_number ILIKE $${params.length + 1} OR c.customer_email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const validSort = ['created_at', 'priority', 'status', 'sla_due_at'].includes(sort) ? sort : 'created_at';
    const validOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await pool.query(`SELECT COUNT(*) FROM complaints c ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), offset);
    const result = await pool.query(`
      SELECT
        c.*,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        (SELECT COUNT(*) FROM messages m WHERE m.complaint_id = c.id) as message_count,
        CASE WHEN c.sla_due_at < NOW() AND c.status NOT IN ('resolved', 'closed') THEN true ELSE false END as is_overdue
      FROM complaints c
      LEFT JOIN users u ON c.assigned_to = u.id
      ${where}
      ORDER BY
        CASE WHEN c.priority = 'critical' THEN 1 WHEN c.priority = 'high' THEN 2 WHEN c.priority = 'medium' THEN 3 ELSE 4 END ASC,
        c.${validSort} ${validOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({
      complaints: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
};

// GET /api/complaints/:id
const getComplaint = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.name as assigned_to_name, u.email as assigned_to_email,
        CASE WHEN c.sla_due_at < NOW() AND c.status NOT IN ('resolved', 'closed') THEN true ELSE false END as is_overdue
      FROM complaints c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.id = $1
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Complaint not found' });

    const messages = await pool.query(`
      SELECT m.*, u.name as sender_user_name FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.complaint_id = $1 ORDER BY m.created_at ASC
    `, [req.params.id]);

    res.json({ complaint: result.rows[0], messages: messages.rows });
  } catch (err) { next(err); }
};

// POST /api/complaints
const createComplaint = async (req, res, next) => {
  try {
    const {
      channel = 'api', priority = 'medium',
      subject, description, customer_name, customer_email,
      customer_phone, customer_account_number
    } = req.body;

    if (!subject || !description || !customer_name || !customer_email) {
      return res.status(400).json({ error: 'subject, description, customer_name, customer_email are required' });
    }

    const id = uuidv4();
    const ticket_number = generateTicketNumber();
    const sla_due_at = getSLADueDate(priority);

    // Run AI analysis asynchronously
    let aiData = {};
    try {
      aiData = await analyzeComplaint(subject, description, customer_name);
    } catch (e) { console.error('AI analysis failed:', e.message); }

    const result = await pool.query(`
      INSERT INTO complaints (
        id, ticket_number, channel, priority, subject, description,
        customer_name, customer_email, customer_phone, customer_account_number,
        ai_category, ai_sentiment, ai_sentiment_score, ai_summary,
        ai_suggested_response, ai_entities, ai_processed_at, sla_due_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),$17)
      RETURNING *
    `, [
      id, ticket_number, channel, aiData.priority_suggestion || priority,
      subject, description, customer_name, customer_email,
      customer_phone, customer_account_number,
      aiData.category, aiData.sentiment, aiData.sentiment_score,
      aiData.summary, aiData.suggested_response,
      JSON.stringify(aiData.entities || {}), sla_due_at
    ]);

    // Insert initial message
    await pool.query(
      'INSERT INTO messages (complaint_id, sender_type, sender_name, content) VALUES ($1, $2, $3, $4)',
      [id, 'customer', customer_name, description]
    );

    res.status(201).json({ complaint: result.rows[0] });
  } catch (err) { next(err); }
};

// PATCH /api/complaints/:id
const updateComplaint = async (req, res, next) => {
  try {
    const { status, priority, assigned_to, tags, category } = req.body;
    const updates = [];
    const params = [req.params.id];

    if (status) {
      updates.push(`status = $${params.length + 1}`);
      params.push(status);
      if (status === 'resolved') {
        updates.push(`resolved_at = NOW()`);
      }
    }
    if (priority) { updates.push(`priority = $${params.length + 1}`); params.push(priority); }
    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${params.length + 1}`);
      params.push(assigned_to || null);
      if (assigned_to) updates.push(`assigned_at = NOW()`);
    }
    if (tags) { updates.push(`tags = $${params.length + 1}`); params.push(tags); }
    if (category) { updates.push(`ai_category = $${params.length + 1}`); params.push(category); }

    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    updates.push(`updated_at = NOW()`);

    const result = await pool.query(
      `UPDATE complaints SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Complaint not found' });

    // Log status change
    if (status) {
      await pool.query(
        'INSERT INTO messages (complaint_id, sender_type, sender_name, content, is_internal) VALUES ($1, $2, $3, $4, $5)',
        [req.params.id, 'system', 'System', `Status changed to: ${status}`, true]
      );
    }

    res.json({ complaint: result.rows[0] });
  } catch (err) { next(err); }
};

// POST /api/complaints/:id/messages
const addMessage = async (req, res, next) => {
  try {
    const { content, is_internal = false } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const result = await pool.query(`
      INSERT INTO messages (complaint_id, sender_type, sender_name, content, is_internal)
      VALUES ($1, 'agent', 'Agent', $2, $3) RETURNING *
    `, [req.params.id, content, is_internal]);

    // Update first response time if not set
    await pool.query(`
      UPDATE complaints SET first_response_at = COALESCE(first_response_at, NOW()), updated_at = NOW()
      WHERE id = $1
    `, [req.params.id]);

    res.status(201).json({ message: result.rows[0] });
  } catch (err) { next(err); }
};

// POST /api/complaints/:id/reanalyze
const reanalyze = async (req, res, next) => {
  try {
    const complaint = await pool.query('SELECT * FROM complaints WHERE id = $1', [req.params.id]);
    if (!complaint.rows[0]) return res.status(404).json({ error: 'Complaint not found' });
    const c = complaint.rows[0];

    const aiData = await analyzeComplaint(c.subject, c.description, c.customer_name);

    const result = await pool.query(`
      UPDATE complaints SET
        ai_category = $2, ai_sentiment = $3, ai_sentiment_score = $4,
        ai_summary = $5, ai_suggested_response = $6, ai_entities = $7,
        ai_processed_at = NOW(), updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [
      req.params.id, aiData.category, aiData.sentiment, aiData.sentiment_score,
      aiData.summary, aiData.suggested_response, JSON.stringify(aiData.entities || {})
    ]);

    res.json({ complaint: result.rows[0], ai_analysis: aiData });
  } catch (err) { next(err); }
};

module.exports = { getComplaints, getComplaint, createComplaint, updateComplaint, addMessage, reanalyze };
