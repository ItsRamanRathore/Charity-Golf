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

  const profile = await client.query(
    'select id, email, role, created_at from public.profiles where email = $1',
    ['admin@example.com']
  );

  console.log('profiles row count for admin@example.com:', profile.rowCount);
  console.table(profile.rows);

  const authUsers = await client.query(
    "select id, email, created_at from auth.users where email = $1",
    ['admin@example.com']
  );

  console.log('auth.users row count for admin@example.com:', authUsers.rowCount);
  console.table(authUsers.rows);

  await client.end();
}

run().catch(async (error) => {
  console.error('Collision check failed:', error.message);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
