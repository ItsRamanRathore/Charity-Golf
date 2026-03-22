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
    select
      p.proname,
      n.nspname,
      pg_get_functiondef(p.oid) as definition
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname in ('confirm_new_user_email', 'handle_new_user')
    order by n.nspname, p.proname;
  `);

  for (const row of result.rows) {
    console.log(`\n--- ${row.nspname}.${row.proname} ---`);
    console.log(row.definition);
  }

  await client.end();
}

run().catch(async (error) => {
  console.error('Inspect failed:', error.message);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
