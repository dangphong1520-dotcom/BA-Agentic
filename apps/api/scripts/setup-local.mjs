import { randomBytes, randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const password = randomBytes(24).toString('hex');
const values = [
  'NODE_ENV=development',
  `POSTGRES_PASSWORD=${password}`,
  `DATABASE_URL=postgresql://ba_dev:${password}@127.0.0.1:55432/ba_agent`,
  `TEST_DATABASE_URL=postgresql://ba_dev:${password}@127.0.0.1:55432/ba_agent_test`,
  'DEV_AUTH_ENABLED=true',
  `DEV_AUTH_TOKEN=${randomBytes(32).toString('hex')}`,
  `DEV_USER_ID=${randomUUID()}`,
];
try {
  await writeFile(new URL('../.env', import.meta.url), `${values.join('\n')}\n`, { flag: 'wx', mode: 0o600 });
  console.log('Created local API configuration with generated credentials. Values are not printed.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Existing .env preserved.');
}
