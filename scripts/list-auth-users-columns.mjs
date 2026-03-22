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
  const result = await client.query(`
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'users'
    order by ordinal_position;
  `);
  console.table(result.rows);
  await client.end();
}

run().catch(async (error) => {
  console.error('Column inspection failed:', error.message);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
