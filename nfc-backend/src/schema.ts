import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').unique().notNull(),
    data: jsonb('data'), // profile data like name, bio, etc.
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userNfcs = pgTable(
    'user_nfcs',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        nfcId: text('nfc_id').notNull(), // the actual NFC tag ID
        name: text('name'), // user's name for this NFC
        data: jsonb('data'), // additional NFC data
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        indexes: {
            userIdx: index('user_nfc_user_idx').on(table.userId),
            nfcIdx: index('user_nfc_nfc_idx').on(table.nfcId),
        },
    })
);

export const connections = pgTable(
    'connections',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        fromUserId: uuid('from_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        toUserId: uuid('to_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        fromNfcId: text('from_nfc_id').notNull(), // NFC that was tapped
        toNfcId: text('to_nfc_id').notNull(), // NFC that was scanned
        data: jsonb('data'), // connection metadata
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        indexes: {
            fromUserIdx: index('connections_from_user_idx').on(table.fromUserId),
            toUserIdx: index('connections_to_user_idx').on(table.toUserId),
            fromNfcIdx: index('connections_from_nfc_idx').on(table.fromNfcId),
            toNfcIdx: index('connections_to_nfc_idx').on(table.toNfcId),
        },
    })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    userNfcs: many(userNfcs),
    connectionsFrom: many(connections, { relationName: 'fromUser' }),
    connectionsTo: many(connections, { relationName: 'toUser' }),
}));

export const userNfcsRelations = relations(userNfcs, ({ one }) => ({
    user: one(users, {
        fields: [userNfcs.userId],
        references: [users.id],
    }),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
    fromUser: one(users, {
        fields: [connections.fromUserId],
        references: [users.id],
        relationName: 'fromUser',
    }),
    toUser: one(users, {
        fields: [connections.toUserId],
        references: [users.id],
        relationName: 'toUser',
    }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserNfc = typeof userNfcs.$inferSelect;
export type InsertUserNfc = typeof userNfcs.$inferInsert;
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = typeof connections.$inferInsert;



