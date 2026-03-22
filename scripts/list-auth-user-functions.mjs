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
    select n.nspname as schema_name, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('auth', 'public')
      and p.proname ilike '%user%'
    order by n.nspname, p.proname;
  `);
  console.table(result.rows);
  await client.end();
}

run().catch(async (error) => {
  console.error('Function listing failed:', error.message);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
