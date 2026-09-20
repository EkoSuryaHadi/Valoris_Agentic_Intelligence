import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vak4ZBt2XjYJ@ep-restless-violet-b32zilld-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

const sqlFiles = [
  'docs/database/schema.sql',
  'database/migrations/004_phase2_transactions.sql',
  'database/migrations/005_phase3_forecast.sql',
  'database/migrations/006_phase4_release_readiness.sql',
  'database/migrations/007_phase24_audit_trail.sql',
  'database/seed.sql'
];

async function run() {
  console.log('Connecting to Neon PostgreSQL database...');
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected successfully to Neon!');

  for (const file of sqlFiles) {
    console.log(`Applying ${file}...`);
    const content = await readFile(join(rootDir, file), 'utf8');
    await client.query(content);
    console.log(`✓ ${file} applied successfully.`);
  }

  // Quick verification
  const projectCount = await client.query('SELECT COUNT(*) FROM projects;');
  const userCount = await client.query('SELECT COUNT(*) FROM users;');
  const baselineCount = await client.query('SELECT COUNT(*) FROM baselines;');
  const commitmentCount = await client.query('SELECT COUNT(*) FROM commitments;');
  const actualCount = await client.query('SELECT COUNT(*) FROM actual_costs;');

  console.log('\n--- Neon Database Verification ---');
  console.log(`Projects: ${projectCount.rows[0].count}`);
  console.log(`Users: ${userCount.rows[0].count}`);
  console.log(`Baselines: ${baselineCount.rows[0].count}`);
  console.log(`Commitments: ${commitmentCount.rows[0].count}`);
  console.log(`Actual Costs: ${actualCount.rows[0].count}`);
  console.log('----------------------------------\n');

  await client.end();
  console.log('All migrations and seeds successfully applied to Neon PostgreSQL!');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
