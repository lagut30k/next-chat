import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle({
  casing: 'snake_case',
  logger: true,
  connection: process.env.DATABASE_URL!,
});
