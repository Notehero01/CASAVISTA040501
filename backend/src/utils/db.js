const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { generateId, hashPassword } = require('./crypto');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '../../data');

const DB_FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  annunci: path.join(DATA_DIR, 'annunci.json'),
  conversations: path.join(DATA_DIR, 'conversations.json'),
  messages: path.join(DATA_DIR, 'messages.json'),
  amministrazioni: path.join(DATA_DIR, 'amministrazioni.json')
};

const TABLES = Object.keys(DB_FILES);
const usePostgres = Boolean(process.env.DATABASE_URL);

const pool = usePostgres
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    })
  : null;

function ensureJsonFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  Object.values(DB_FILES).forEach(file => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2));
    }
  });
}

function readJsonData(table) {
  try {
    const data = fs.readFileSync(DB_FILES[table], 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeJsonData(table, data) {
  ensureJsonFiles();
  fs.writeFileSync(DB_FILES[table], JSON.stringify(data, null, 2));
}

function getRecordId(record) {
  return record.id || record.userId || generateId();
}

async function initDatabase() {
  if (!usePostgres) {
    ensureJsonFiles();
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS casavista_records (
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (table_name, record_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS casavista_records_table_idx
    ON casavista_records (table_name);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS casavista_records_data_gin_idx
    ON casavista_records USING GIN (data);
  `);

  // Se ci sono dati JSON locali e il DB e vuoto, li importa una volta.
  ensureJsonFiles();
  for (const table of TABLES) {
    const { rows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM casavista_records WHERE table_name = $1',
      [table]
    );
    if (rows[0].count > 0) continue;

    const localRows = readJsonData(table);
    if (localRows.length === 0) continue;

    for (const record of localRows) {
      await upsertRecord(table, record);
    }
    console.log(`Imported ${localRows.length} ${table} records into Postgres`);
  }
}

async function readData(table) {
  if (!TABLES.includes(table)) return [];

  if (!usePostgres) {
    ensureJsonFiles();
    return readJsonData(table);
  }

  const { rows } = await pool.query(
    `
      SELECT data
      FROM casavista_records
      WHERE table_name = $1
      ORDER BY created_at ASC
    `,
    [table]
  );

  return rows.map(row => row.data);
}

async function writeData(table, data) {
  if (!TABLES.includes(table)) return;

  if (!usePostgres) {
    writeJsonData(table, data);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM casavista_records WHERE table_name = $1', [table]);

    for (const record of data) {
      await client.query(
        `
          INSERT INTO casavista_records (table_name, record_id, data)
          VALUES ($1, $2, $3::jsonb)
          ON CONFLICT (table_name, record_id)
          DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
        `,
        [table, getRecordId(record), JSON.stringify(record)]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function upsertRecord(table, record) {
  if (!TABLES.includes(table)) return record;

  if (!usePostgres) {
    const rows = readJsonData(table);
    const recordId = getRecordId(record);
    const index = rows.findIndex(item => getRecordId(item) === recordId);
    if (index === -1) rows.push(record);
    else rows[index] = record;
    writeJsonData(table, rows);
    return record;
  }

  await pool.query(
    `
      INSERT INTO casavista_records (table_name, record_id, data)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (table_name, record_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `,
    [table, getRecordId(record), JSON.stringify(record)]
  );

  return record;
}

async function initAdmin() {
  const users = await readData('users');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@casavista.it';
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminExists = users.find(u => u.email === adminEmail);

  if (!adminExists && adminPassword) {
    const adminUser = {
      id: generateId(),
      email: adminEmail,
      password: hashPassword(adminPassword),
      nome: 'Amministratore',
      cognome: 'CasaVista',
      tipo: 'admin',
      telefono: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verified: true
    };

    users.push(adminUser);
    await writeData('users', users);
    console.log('Admin creato:', adminEmail);
  }
}

module.exports = {
  readData,
  writeData,
  upsertRecord,
  initDatabase,
  initAdmin,
  generateId,
  usePostgres
};
