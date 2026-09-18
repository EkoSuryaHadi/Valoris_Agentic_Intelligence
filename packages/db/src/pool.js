import pg from 'pg';
import { requireDatabaseUrl } from './runtime.js';

export function createPool({ connectionString = process.env.DATABASE_URL, max = 10 } = {}) {
  return new pg.Pool({ connectionString: requireDatabaseUrl(connectionString), max });
}
