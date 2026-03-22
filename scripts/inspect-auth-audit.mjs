import fs from 'node:fs';
import { Client } from 'pg';

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.trim().startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const client = new Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();

  const exists = await client.query(`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'auth' and table_name = 'audit_log_entries'
    ) as has_table;
  `);

  if (!exists.rows[0]?.has_table) {
    console.log('auth.audit_log_entries not available in this project.');
    await client.end();
    return;
  }

  const logs = await client.query(`
    select id, created_at, ip_address, payload
    from auth.audit_log_entries
    order by created_at desc
    limit 20;
  `);

  console.log('Recent auth audit logs:', logs.rowCount);
  for (const row of logs.rows) {
    console.log('---');
    console.log('id:', row.id);
    console.log('created_at:', row.created_at);
    console.log('ip_address:', row.ip_address);
    console.log('payload:', JSON.stringify(row.payload));
  }

  await client.end();
}

run().catch(async (error) => {
  console.error('Audit inspection failed:', error.message);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
