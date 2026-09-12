import 'dotenv/config';
import pg from 'pg';
import { entityIdSchema } from '@ba/contracts';

if (process.env.NODE_ENV !== 'development') throw new Error('Development only');
const id = entityIdSchema.parse(process.env.DEV_USER_ID);
const databaseUrl = new URL(process.env.DATABASE_URL);
if (!['127.0.0.1', 'localhost'].includes(databaseUrl.hostname) || databaseUrl.pathname !== '/ba_agent') {
  throw new Error('Seed is restricted to the local ba_agent database');
}
const client = new pg.Client({ connectionString: databaseUrl.toString() });
await client.connect();
try {
  await client.query('INSERT INTO "User" (id, "displayName") VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [id, 'Local BA']);
  console.log('Local development user is ready.');
} finally { await client.end(); }
