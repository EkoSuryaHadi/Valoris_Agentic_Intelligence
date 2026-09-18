export function requireDatabaseUrl(value) { if (!value?.startsWith('postgresql://')) throw new Error('DATABASE_URL must be a PostgreSQL URL'); return value; }
export async function withTransaction(client, work) {
  await client.query('BEGIN');
  try { const result = await work(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
}
