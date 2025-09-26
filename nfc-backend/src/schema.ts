import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const nfcTags = pgTable(
    'nfc_tags',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        tagId: text('tag_id').notNull(),
        data: jsonb('data'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        indexes: {
            userIdx: index('nfc_user_idx').on(table.userId),
            tagIdx: index('nfc_tag_idx').on(table.tagId),
        },
    })
);

export const usersRelations = relations(users, ({ many }) => ({
    nfcTags: many(nfcTags),
}));

export const nfcTagsRelations = relations(nfcTags, ({ one }) => ({
    user: one(users, {
        fields: [nfcTags.userId],
        references: [users.id],
    }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type NfcTag = typeof nfcTags.$inferSelect;
export type InsertNfcTag = typeof nfcTags.$inferInsert;


