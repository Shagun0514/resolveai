require('dotenv').config();
const pool = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'supervisor')),
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Complaints table
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'chat', 'api', 'phone', 'web')),
        status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed', 'escalated')),
        priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        category VARCHAR(100),
        sub_category VARCHAR(100),
        subject VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        customer_account_number VARCHAR(100),
        
        -- AI fields
        ai_sentiment VARCHAR(20) CHECK (ai_sentiment IN ('positive', 'neutral', 'negative', 'very_negative')),
        ai_sentiment_score DECIMAL(4,3),
        ai_category VARCHAR(100),
        ai_summary TEXT,
        ai_suggested_response TEXT,
        ai_entities JSONB DEFAULT '{}',
        ai_embedding_hash VARCHAR(64),
        ai_duplicate_of UUID REFERENCES complaints(id),
        ai_processed_at TIMESTAMPTZ,
        
        -- Assignment
        assigned_to UUID REFERENCES users(id),
        assigned_at TIMESTAMPTZ,
        
        -- SLA
        sla_due_at TIMESTAMPTZ,
        sla_breached BOOLEAN DEFAULT false,
        resolved_at TIMESTAMPTZ,
        first_response_at TIMESTAMPTZ,
        
        -- Meta
        tags TEXT[] DEFAULT '{}',
        source_metadata JSONB DEFAULT '{}',
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Messages / Communication history
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system', 'ai')),
        sender_id UUID REFERENCES users(id),
        sender_name VARCHAR(255),
        content TEXT NOT NULL,
        content_type VARCHAR(50) DEFAULT 'text',
        attachments JSONB DEFAULT '[]',
        is_internal BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // SLA policies
    await client.query(`
      CREATE TABLE IF NOT EXISTS sla_policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        priority VARCHAR(20) NOT NULL,
        first_response_hours INTEGER NOT NULL,
        resolution_hours INTEGER NOT NULL,
        escalation_hours INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Audit log
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id UUID,
        changes JSONB DEFAULT '{}',
        ip_address VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(ai_category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_complaints_assigned ON complaints(assigned_to);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_complaint ON messages(complaint_id);`);

    // Default SLA policies
    await client.query(`
      INSERT INTO sla_policies (name, priority, first_response_hours, resolution_hours, escalation_hours)
      VALUES
        ('Critical SLA', 'critical', 1, 4, 2),
        ('High Priority SLA', 'high', 2, 8, 4),
        ('Medium Priority SLA', 'medium', 4, 24, 12),
        ('Low Priority SLA', 'low', 8, 72, 36)
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

createTables().catch(console.error);
