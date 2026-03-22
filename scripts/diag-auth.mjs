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

  const triggers = await client.query(`
    select
      t.tgname,
      n.nspname as schema_name,
      c.relname as table_name,
      p.proname as function_name
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid
    where not t.tgisinternal
      and n.nspname = 'auth'
      and c.relname = 'users'
    order by t.tgname;
  `);

  console.log('AUTH USERS TRIGGERS:');
  console.table(triggers.rows);

  const fn = await client.query(`
    select
      p.proname,
      pg_get_functiondef(p.oid) as def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'handle_new_user';
  `);

  console.log('handle_new_user exists:', fn.rowCount > 0);
  if (fn.rowCount > 0) {
    console.log(fn.rows[0].def);
  }

  await client.end();
}

run().catch(async (error) => {
  console.error('Diagnostic failed:', error.message);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
