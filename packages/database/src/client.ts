import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';
import { relations } from './relations.js';

export const db = drizzle(process.env.DATABASE_URL!, {
  casing: 'snake_case',
  logger: true,
  schema,
  relations,
});

db.select()
  .from(schema.roomsTable)
  .where(({ id }) => eq(id, 1));

db.query.usersTable.findMany({
  where: {
    id: 10,
  },
});
db.query.messagesTable.findFirst({
  where: {
    id: 10,
  },
  with: {
    author: true,
    room: true,
  },
});
