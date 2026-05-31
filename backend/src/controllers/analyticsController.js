const pool = require('../config/database');

const getAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = `NOW() - INTERVAL '${parseInt(days)} days'`;

    const [statusCounts, categoryCounts, sentimentCounts, channelCounts, priorityCounts, slaSummary, recentTrend] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) as count FROM complaints WHERE created_at > ${since} GROUP BY status`),
      pool.query(`SELECT ai_category as category, COUNT(*) as count FROM complaints WHERE created_at > ${since} AND ai_category IS NOT NULL GROUP BY ai_category ORDER BY count DESC LIMIT 10`),
      pool.query(`SELECT ai_sentiment as sentiment, COUNT(*) as count FROM complaints WHERE created_at > ${since} AND ai_sentiment IS NOT NULL GROUP BY ai_sentiment`),
      pool.query(`SELECT channel, COUNT(*) as count FROM complaints WHERE created_at > ${since} GROUP BY channel ORDER BY count DESC`),
      pool.query(`SELECT priority, COUNT(*) as count FROM complaints WHERE created_at > ${since} GROUP BY priority`),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE sla_breached = true) as breached,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
          COUNT(*) FILTER (WHERE status NOT IN ('resolved','closed') AND sla_due_at < NOW()) as overdue,
          ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric, 1) as avg_resolution_hours
        FROM complaints WHERE created_at > ${since}
      `),
      pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM complaints WHERE created_at > ${since}
        GROUP BY DATE(created_at) ORDER BY date ASC
      `)
    ]);

    const total = await pool.query('SELECT COUNT(*) FROM complaints');
    const open = await pool.query(`SELECT COUNT(*) FROM complaints WHERE status IN ('open', 'in_progress', 'escalated')`);

    res.json({
      totals: {
        all: parseInt(total.rows[0].count),
        open: parseInt(open.rows[0].count)
      },
      by_status: statusCounts.rows,
      by_category: categoryCounts.rows,
      by_sentiment: sentimentCounts.rows,
      by_channel: channelCounts.rows,
      by_priority: priorityCounts.rows,
      sla: slaSummary.rows[0],
      trend: recentTrend.rows
    });
  } catch (err) { next(err); }
};

module.exports = { getAnalytics };
