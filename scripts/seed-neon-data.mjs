import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vak4ZBt2XjYJ@ep-restless-violet-b32zilld-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function run() {
  console.log('Connecting to Neon PostgreSQL database...');
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected successfully to Neon!');

  console.log('Applying database/seed.sql...');
  const seedSql = await readFile(join(rootDir, 'database/seed.sql'), 'utf8');
  await client.query(seedSql);
  console.log('✓ database/seed.sql applied successfully.');

  // Quick verification
  const orgCount = await client.query('SELECT COUNT(*) FROM organizations;');
  const userCount = await client.query('SELECT COUNT(*) FROM users;');
  const projectCount = await client.query('SELECT COUNT(*) FROM projects;');
  const wbsCount = await client.query('SELECT COUNT(*) FROM wbs_nodes;');
  const cbsCount = await client.query('SELECT COUNT(*) FROM cost_codes;');
  const baselineCount = await client.query('SELECT COUNT(*) FROM baselines;');
  const budgetLineCount = await client.query('SELECT COUNT(*) FROM budget_lines;');
  const commitmentCount = await client.query('SELECT COUNT(*) FROM commitments;');
  const actualCount = await client.query('SELECT COUNT(*) FROM actual_costs;');
  const accrualCount = await client.query('SELECT COUNT(*) FROM accruals;');
  const changeCount = await client.query('SELECT COUNT(*) FROM changes;');
  const riskCount = await client.query('SELECT COUNT(*) FROM risks;');
  const findingCount = await client.query('SELECT COUNT(*) FROM agent_findings;');
  const auditCount = await client.query('SELECT COUNT(*) FROM audit_events;');

  console.log('\n=========================================');
  console.log('--- NEON REALISTIC SEED VERIFICATION ---');
  console.log('=========================================');
  console.log(`Organizations:     ${orgCount.rows[0].count}`);
  console.log(`Users:             ${userCount.rows[0].count}`);
  console.log(`Projects:          ${projectCount.rows[0].count}`);
  console.log(`WBS Work Packages: ${wbsCount.rows[0].count}`);
  console.log(`Cost Codes (CBS):  ${cbsCount.rows[0].count}`);
  console.log(`Baselines:         ${baselineCount.rows[0].count}`);
  console.log(`Budget Lines:      ${budgetLineCount.rows[0].count}`);
  console.log(`Commitments (POs): ${commitmentCount.rows[0].count}`);
  console.log(`Actual Invoices:   ${actualCount.rows[0].count}`);
  console.log(`Accruals (GRNs):   ${accrualCount.rows[0].count}`);
  console.log(`Change Orders:     ${changeCount.rows[0].count}`);
  console.log(`Cost Risks:        ${riskCount.rows[0].count}`);
  console.log(`Agent Findings:    ${findingCount.rows[0].count}`);
  console.log(`Audit Events:      ${auditCount.rows[0].count}`);
  console.log('=========================================\n');

  await client.end();
  console.log('All realistic dummy data is live in Neon PostgreSQL!');
}

run().catch((err) => {
  console.error('Seed execution failed:', err);
  process.exit(1);
});
