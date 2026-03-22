import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

async function createOrUpdateAdminViaSql({ databaseUrl, email, password, fullName }) {
  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL for SQL fallback user creation.');
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const existingAuthUser = await client.query(
      'select id from auth.users where email = $1 limit 1',
      [email]
    );

    let userId;

    if (existingAuthUser.rowCount > 0) {
      userId = existingAuthUser.rows[0].id;

      await client.query(
        `
          update auth.users
          set
            encrypted_password = crypt($2, gen_salt('bf')),
            email_confirmed_at = coalesce(email_confirmed_at, now()),
            raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', $3),
            updated_at = now()
          where id = $1
        `,
        [userId, password, fullName]
      );

      console.log(`Updated auth user password via SQL fallback: ${email}`);
    } else {
      const inserted = await client.query(
        `
          insert into auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
          )
          values (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            $1,
            crypt($2, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', $3),
            now(),
            now(),
            '',
            '',
            '',
            ''
          )
          returning id
        `,
        [email, password, fullName]
      );

      userId = inserted.rows[0].id;

      await client.query(
        `
          insert into auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
          )
          values (
            gen_random_uuid(),
            $1,
            jsonb_build_object('sub', $1::text, 'email', $2),
            'email',
            $1::text,
            now(),
            now(),
            now()
          )
          on conflict do nothing
        `,
        [userId, email]
      );

      console.log(`Created auth user via SQL fallback: ${email}`);
    }

    await client.query(
      `
        insert into public.profiles (id, email, full_name, role)
        values ($1, $2, $3, 'admin')
        on conflict (id) do update
        set
          email = excluded.email,
          full_name = excluded.full_name,
          role = 'admin'
      `,
      [userId, email, fullName]
    );

    return userId;
  } finally {
    await client.end();
  }
}

async function run() {
  loadLocalEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  const email = getArg('--email') || process.env.ADMIN_EMAIL;
  const password = getArg('--password') || process.env.ADMIN_PASSWORD;
  const fullName = getArg('--name') || process.env.ADMIN_NAME || 'Platform Admin';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    process.exit(1);
  }

  if (!email || !password) {
    console.error('Usage: node scripts/upsert-admin.mjs --email <email> --password <password> [--name <full name>]');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersError) {
    console.error('Failed to list users:', usersError.message);
    process.exit(1);
  }

  const existingUser = usersData.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());

  let userId;

  if (!existingUser) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError || !created.user) {
      console.warn('Supabase admin API createUser failed, attempting SQL fallback:', createError?.message || 'Unknown error');
      try {
        userId = await createOrUpdateAdminViaSql({
          databaseUrl,
          email,
          password,
          fullName,
        });
      } catch (fallbackError) {
        console.error('Failed to create admin user:', createError?.message || 'Unknown error');
        console.error('SQL fallback also failed:', fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
        process.exit(1);
      }
    } else {
      userId = created.user.id;
      console.log(`Created auth user: ${email}`);
    }
  } else {
    userId = existingUser.id;

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata || {}),
        full_name: fullName,
      },
    });

    if (updateError) {
      console.error('Failed to update existing admin user password/profile:', updateError.message);
      process.exit(1);
    }

    console.log(`Updated auth user password: ${email}`);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        role: 'admin',
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    console.error('Failed to upsert admin profile:', profileError.message);
    process.exit(1);
  }

  console.log('Admin profile upserted with role=admin.');
  console.log('You can now sign in at /auth/login with the provided email/password.');
}

run().catch((error) => {
  console.error('Unexpected error while upserting admin:', error);
  process.exit(1);
});
