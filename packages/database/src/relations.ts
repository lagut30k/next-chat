import { defineRelations } from 'drizzle-orm';
import * as schema from './schema.js';

export const relations = defineRelations(schema, (r) => ({
  messagesTable: {
    room: r.one.roomsTable({
      from: r.messagesTable.roomId,
      to: r.roomsTable.id,
    }),
    author: r.one.usersTable({
      from: r.messagesTable.authorId,
      to: r.usersTable.id,
    }),
    textContent: r.one.textMessagesTable(),
    markDownContent: r.one.markdownMessageTable(),
    imageContent: r.one.imageMessageTable(),
  },
  roomsTable: {
    messages: r.many.messagesTable(),
  },
  usersTable: {
    messages: r.many.messagesTable(),
  },
  textMessagesTable: {
    message: r.one.messagesTable({
      from: r.textMessagesTable.messageId,
      to: r.messagesTable.id,
      where: {
        messageType: 'text',
      },
    }),
  },
  markdownMessageTable: {
    message: r.one.messagesTable({
      from: r.markdownMessageTable.messageId,
      to: r.messagesTable.id,
      where: {
        messageType: 'markdown',
      },
    }),
  },
  imageMessageTable: {
    message: r.one.messagesTable({
      from: r.imageMessageTable.messageId,
      to: r.messagesTable.id,
      where: {
        messageType: 'image',
      },
    }),
  },
}));
