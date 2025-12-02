import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
const db = drizzle({
  casing: 'snake_case',
  connection: process.env.DATABASE_URL!,
});

export default {
  db,
  drizzle,
};
