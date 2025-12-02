import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './shared.js';

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  ...timestamps,
});

export const roomsTable = pgTable('rooms', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar({ length: 255 }).notNull().unique(),
  ...timestamps,
});
