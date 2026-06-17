import { Pool } from 'pg';

// Fallback in-memory database storage if PostgreSQL is not configured
class InMemoryDatabase {
  public trials: any[] = [];
  public documents: any[] = [];
  public evidenceBriefs: any[] = [];
  public protocols: any[] = [];
  public saps: any[] = [];
  public conflicts: any[] = [];
  public decisionLogs: any[] = [];
  public auditTrail: any[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // Optional seed data if needed
  }
}

const mockDb = new InMemoryDatabase();

// Configure the connection pool for PostgreSQL
const isPgConfigured = !!process.env.DATABASE_URL;
let pool: Pool | null = null;

if (isPgConfigured) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
}

export const isFallback = !isPgConfigured;

// 21 CFR Part 11 compliant audit trail helper
export async function logAuditTrail(
  trialId: string | null,
  action: string,
  userEmail: string,
  role: string,
  recordType: string,
  changeDescription: string,
  reason: string,
  ipAddress: string = '127.0.0.1'
) {
  const timestamp = new Date().toISOString();
  if (isFallback) {
    mockDb.auditTrail.unshift({
      id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      trial_id: trialId,
      action,
      user_email: userEmail,
      role,
      record_type: recordType,
      change_description: changeDescription,
      reason,
      ip_address: ipAddress,
      created_at: timestamp,
    });
    return;
  }

  try {
    await pool!.query(
      `INSERT INTO audit_trail 
      (trial_id, action, user_email, role, record_type, change_description, reason, ip_address, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [trialId, action, userEmail, role, recordType, changeDescription, reason, ipAddress, timestamp]
    );
  } catch (err) {
    console.error('Audit trail logging failed:', err);
  }
}

export async function initDb() {
  if (isFallback) {
    console.log('⚠️ Database URL not set. Running in-memory database fallback mode.');
    return;
  }

  console.log('📡 Initializing PostgreSQL database...');
  try {
    // 1. Trials table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS trials (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        indication VARCHAR(255) NOT NULL,
        status VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Documents table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Evidence Briefs table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS evidence_briefs (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        content_json JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Protocols table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS protocols (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        document_id VARCHAR(100) REFERENCES documents(id) ON DELETE SET NULL,
        sections_json JSONB NOT NULL,
        version VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. SAPs table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS saps (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        document_id VARCHAR(100) REFERENCES documents(id) ON DELETE SET NULL,
        content_json JSONB NOT NULL,
        version VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Conflicts table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS conflicts (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        position_a TEXT NOT NULL,
        position_b TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        status VARCHAR(100) NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Decision Logs table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS decision_logs (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        decision TEXT NOT NULL,
        rationale TEXT NOT NULL,
        implications TEXT NOT NULL,
        made_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Audit Trail table (21 CFR Part 11 compliant)
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS audit_trail (
        id SERIAL PRIMARY KEY,
        trial_id VARCHAR(100),
        action VARCHAR(100) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        record_type VARCHAR(100) NOT NULL,
        change_description TEXT NOT NULL,
        reason TEXT NOT NULL,
        ip_address VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ Database tables initialized successfully.');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
  }
}

// Global DB helper APIs
export const db = {
  // Get all trials
  getTrials: async () => {
    if (isFallback) return mockDb.trials;
    const res = await pool!.query('SELECT * FROM trials ORDER BY created_at DESC');
    return res.rows;
  },

  // Get single trial
  getTrial: async (id: string) => {
    if (isFallback) return mockDb.trials.find((t) => t.id === id) || null;
    const res = await pool!.query('SELECT * FROM trials WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  // Create trial
  createTrial: async (id: string, name: string, indication: string, status: string) => {
    if (isFallback) {
      const newTrial = { id, name, indication, status, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mockDb.trials.push(newTrial);
      return newTrial;
    }
    const res = await pool!.query(
      'INSERT INTO trials (id, name, indication, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, name, indication, status]
    );
    return res.rows[0];
  },

  // Update trial status
  updateTrialStatus: async (id: string, status: string) => {
    if (isFallback) {
      const trial = mockDb.trials.find((t) => t.id === id);
      if (trial) {
        trial.status = status;
        trial.updated_at = new Date().toISOString();
      }
      return trial;
    }
    const res = await pool!.query(
      'UPDATE trials SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return res.rows[0];
  },

  // Get trial documents
  getDocuments: async (trialId: string) => {
    if (isFallback) return mockDb.documents.filter((d) => d.trial_id === trialId);
    const res = await pool!.query('SELECT * FROM documents WHERE trial_id = $1 ORDER BY created_at DESC', [trialId]);
    return res.rows;
  },

  // Save document
  createDocument: async (id: string, trialId: string, name: string, content: string, type: string, hash: string) => {
    if (isFallback) {
      const newDoc = { id, trial_id: trialId, name, content, type, hash, created_at: new Date().toISOString() };
      mockDb.documents.push(newDoc);
      return newDoc;
    }
    const res = await pool!.query(
      'INSERT INTO documents (id, trial_id, name, content, type, hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, trialId, name, content, type, hash]
    );
    return res.rows[0];
  },

  // Get evidence brief
  getEvidenceBrief: async (trialId: string) => {
    if (isFallback) return mockDb.evidenceBriefs.find((e) => e.trial_id === trialId) || null;
    const res = await pool!.query('SELECT * FROM evidence_briefs WHERE trial_id = $1', [trialId]);
    return res.rows[0] || null;
  },

  // Save/Update evidence brief
  saveEvidenceBrief: async (id: string, trialId: string, contentJson: any) => {
    if (isFallback) {
      let brief = mockDb.evidenceBriefs.find((e) => e.trial_id === trialId);
      if (brief) {
        brief.content_json = contentJson;
      } else {
        brief = { id, trial_id: trialId, content_json: contentJson, created_at: new Date().toISOString() };
        mockDb.evidenceBriefs.push(brief);
      }
      return brief;
    }
    await pool!.query('DELETE FROM evidence_briefs WHERE trial_id = $1', [trialId]);
    const res = await pool!.query(
      'INSERT INTO evidence_briefs (id, trial_id, content_json) VALUES ($1, $2, $3) RETURNING *',
      [id, trialId, JSON.stringify(contentJson)]
    );
    return res.rows[0];
  },

  // Get protocol
  getProtocol: async (trialId: string) => {
    if (isFallback) return mockDb.protocols.find((p) => p.trial_id === trialId) || null;
    const res = await pool!.query('SELECT * FROM protocols WHERE trial_id = $1 ORDER BY created_at DESC LIMIT 1', [trialId]);
    return res.rows[0] || null;
  },

  // Save/Update protocol
  saveProtocol: async (id: string, trialId: string, docId: string | null, sectionsJson: any, version: string) => {
    if (isFallback) {
      const newProtocol = { id, trial_id: trialId, document_id: docId, sections_json: sectionsJson, version, created_at: new Date().toISOString() };
      mockDb.protocols.push(newProtocol);
      return newProtocol;
    }
    const res = await pool!.query(
      'INSERT INTO protocols (id, trial_id, document_id, sections_json, version) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, trialId, docId, JSON.stringify(sectionsJson), version]
    );
    return res.rows[0];
  },

  // Get SAP
  getSap: async (trialId: string) => {
    if (isFallback) return mockDb.saps.find((s) => s.trial_id === trialId) || null;
    const res = await pool!.query('SELECT * FROM saps WHERE trial_id = $1 ORDER BY created_at DESC LIMIT 1', [trialId]);
    return res.rows[0] || null;
  },

  // Save/Update SAP
  saveSap: async (id: string, trialId: string, docId: string | null, contentJson: any, version: string) => {
    if (isFallback) {
      const newSap = { id, trial_id: trialId, document_id: docId, content_json: contentJson, version, created_at: new Date().toISOString() };
      mockDb.saps.push(newSap);
      return newSap;
    }
    const res = await pool!.query(
      'INSERT INTO saps (id, trial_id, document_id, content_json, version) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, trialId, docId, JSON.stringify(contentJson), version]
    );
    return res.rows[0];
  },

  // Get conflicts
  getConflicts: async (trialId: string) => {
    if (isFallback) return mockDb.conflicts.filter((c) => c.trial_id === trialId);
    const res = await pool!.query('SELECT * FROM conflicts WHERE trial_id = $1 ORDER BY created_at DESC', [trialId]);
    return res.rows;
  },

  // Create conflict
  createConflict: async (
    id: string,
    trialId: string,
    type: string,
    severity: string,
    positionA: string,
    positionB: string,
    recommendation: string,
    status: string
  ) => {
    if (isFallback) {
      const newConflict = {
        id,
        trial_id: trialId,
        type,
        severity,
        position_a: positionA,
        position_b: positionB,
        recommendation,
        status,
        resolved_at: null,
        resolved_by: null,
        created_at: new Date().toISOString(),
      };
      mockDb.conflicts.push(newConflict);
      return newConflict;
    }
    const res = await pool!.query(
      `INSERT INTO conflicts (id, trial_id, type, severity, position_a, position_b, recommendation, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, trialId, type, severity, positionA, positionB, recommendation, status]
    );
    return res.rows[0];
  },

  // Resolve conflict
  resolveConflict: async (id: string, resolvedBy: string) => {
    if (isFallback) {
      const conflict = mockDb.conflicts.find((c) => c.id === id);
      if (conflict) {
        conflict.status = 'RESOLVED';
        conflict.resolved_at = new Date().toISOString();
        conflict.resolved_by = resolvedBy;
      }
      return conflict;
    }
    const res = await pool!.query(
      `UPDATE conflicts 
      SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP, resolved_by = $1 
      WHERE id = $2 RETURNING *`,
      [resolvedBy, id]
    );
    return res.rows[0];
  },

  // Delete all open conflicts for a trial (to regenerate them)
  clearOpenConflicts: async (trialId: string) => {
    if (isFallback) {
      mockDb.conflicts = mockDb.conflicts.filter((c) => !(c.trial_id === trialId && c.status === 'OPEN'));
      return;
    }
    await pool!.query("DELETE FROM conflicts WHERE trial_id = $1 AND status = 'OPEN'", [trialId]);
  },

  // Get decision logs
  getDecisionLogs: async (trialId: string) => {
    if (isFallback) return mockDb.decisionLogs.filter((d) => d.trial_id === trialId);
    const res = await pool!.query('SELECT * FROM decision_logs WHERE trial_id = $1 ORDER BY created_at DESC', [trialId]);
    return res.rows;
  },

  // Create decision log
  createDecisionLog: async (
    id: string,
    trialId: string,
    title: string,
    decision: string,
    rationale: string,
    implications: string,
    madeBy: string
  ) => {
    if (isFallback) {
      const newLog = {
        id,
        trial_id: trialId,
        title,
        decision,
        rationale,
        implications,
        made_by: madeBy,
        created_at: new Date().toISOString(),
      };
      mockDb.decisionLogs.push(newLog);
      return newLog;
    }
    const res = await pool!.query(
      `INSERT INTO decision_logs (id, trial_id, title, decision, rationale, implications, made_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, trialId, title, decision, rationale, implications, madeBy]
    );
    return res.rows[0];
  },

  // Get audit trail
  getAuditTrail: async (trialId: string) => {
    if (isFallback) return mockDb.auditTrail.filter((a) => a.trial_id === trialId);
    const res = await pool!.query(
      'SELECT * FROM audit_trail WHERE trial_id = $1 ORDER BY created_at DESC',
      [trialId]
    );
    return res.rows;
  },
};
