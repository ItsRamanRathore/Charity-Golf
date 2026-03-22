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
    select t.tgname, pg_get_triggerdef(t.oid, true) as definition
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal and n.nspname = 'auth' and c.relname = 'users'
    order by t.tgname;
  `);

  console.table(result.rows);
  await client.end();
}

run().catch(async (error) => {
  console.error('Inspect failed:', error.message);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
