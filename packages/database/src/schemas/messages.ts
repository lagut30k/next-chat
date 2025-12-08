import { index, integer, pgEnum, pgTable, varchar } from 'drizzle-orm/pg-core';
import { roomsTable, usersTable } from './users.js';
import { timestamps } from './shared.js';

export const messageTypesEnum = pgEnum('message_types', [
  'text',
  'image',
  'markdown',
]);

export const messagesTable = pgTable(
  'messages',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    roomId: integer()
      .notNull()
      .references(() => roomsTable.id),
    authorId: integer().references(() => usersTable.id),
    messageType: messageTypesEnum().notNull(),
    ...timestamps,
  },
  (t) => [index('room_id_created_at_idx').on(t.roomId, t.createdAt)],
);

export const textMessagesTable = pgTable('text_messages', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  messageId: integer()
    .notNull()
    .references(() => messagesTable.id),
  text: varchar({ length: 4096 }).notNull(),
});

export const imageMessageTable = pgTable('image_messages', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  messageId: integer()
    .notNull()
    .references(() => roomsTable.id),
  imageUrl: varchar({ length: 4096 }).notNull(),
});

export const markdownMessageTable = pgTable('markdown_messages', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  messageId: integer()
    .notNull()
    .references(() => roomsTable.id),
  text: varchar({ length: 4096 }).notNull(),
});
