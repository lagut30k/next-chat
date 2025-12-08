import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './shared.js';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  ...timestamps,
});

export const roomsTable = pgTable('rooms', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  ...timestamps,
});

export const createRoomSchema = createInsertSchema(roomsTable, {
  slug: z
    .string()
    .nonempty()
    .max(255)
    .regex(/^[a-z0-9-]*$/),
  name: z.string().max(255).nonempty(),
}).pick({
  slug: true,
  name: true,
});

export const selectRoomSchema = createSelectSchema(roomsTable);
