import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const migrationsDir = path.join(rootDir, 'database', 'migrations');

function fail(message) {
  console.error(`Migration check failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(migrationsDir)) {
  fail('database/migrations directory does not exist');
}

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'));

if (migrationFiles.length === 0) {
  fail('no .sql files found in database/migrations');
}

const namePattern = /^\d{8}_[a-z0-9_]+\.sql$/;
for (const file of migrationFiles) {
  if (!namePattern.test(file)) {
    fail(`invalid migration filename format: ${file}`);
  }
}

const uniqueNames = new Set(migrationFiles);
if (uniqueNames.size !== migrationFiles.length) {
  fail('duplicate migration filenames detected');
}

const forbiddenPatterns = [/\bDROP\s+TABLE\b/i, /\bTRUNCATE\b/i, /\bALTER\s+TABLE\b.+\bDROP\s+COLUMN\b/i];

for (const file of migrationFiles) {
  const fullPath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(fullPath, 'utf-8');

  if (!sql.trim()) {
    fail(`migration file is empty: ${file}`);
  }

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(sql)) {
      fail(`forbidden destructive statement in ${file}: ${pattern}`);
    }
  }
}

console.log(`Migration check passed for ${migrationFiles.length} file(s).`);
