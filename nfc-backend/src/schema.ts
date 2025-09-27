import { pgTable, uuid, text, timestamp, jsonb, index, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').unique().notNull(),
    // Basic Information
    firstName: text('first_name'),
    lastName: text('last_name'),
    phone: text('phone'),
    location: text('location'),
    // Sports Information
    interests: jsonb('interests'), // array of sports interests
    skillLevel: text('skill_level'),
    availability: text('availability'),
    // Work Information
    company: text('company'),
    position: text('position'),
    experience: text('experience'),
    isHiring: text('is_hiring').default('false'), // boolean as text for simplicity
    isOpenToRelationships: text('is_open_to_relationships').default('false'), // dating/relationship preference
    resumeUrl: text('resume_url'), // URL to uploaded resume file
    resumeBlob: varchar('resume_blob', { length: 256 }),
    // Additional data for future use
    data: jsonb('data'), // additional profile data
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
        isActive: text('is_active').default('true').notNull(), // NFC tag status (true/false)
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
        toUserId: uuid('to_user_id').references(() => users.id, { onDelete: 'cascade' }),
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

export const invitations = pgTable(
    'invitations',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        fromUserId: uuid('from_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        toUserId: uuid('to_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        interest: text('interest').notNull(), // The shared interest (e.g., "Tennis", "JavaScript")
        message: text('message'), // Optional custom message
        status: text('status').default('pending').notNull(), // pending, accepted, rejected
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        respondedAt: timestamp('responded_at', { withTimezone: true }),
    },
    (table) => ({
        indexes: {
            fromUserIdx: index('invitations_from_user_idx').on(table.fromUserId),
            toUserIdx: index('invitations_to_user_idx').on(table.toUserId),
            statusIdx: index('invitations_status_idx').on(table.status),
            interestIdx: index('invitations_interest_idx').on(table.interest),
        },
    })
);

export const acceptedConnections = pgTable(
    'accepted_connections',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId1: uuid('user_id_1').notNull().references(() => users.id, { onDelete: 'cascade' }),
        userId2: uuid('user_id_2').notNull().references(() => users.id, { onDelete: 'cascade' }),
        sharedInterest: text('shared_interest').notNull(), // The interest they connected over
        invitationId: uuid('invitation_id').references(() => invitations.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        indexes: {
            user1Idx: index('accepted_connections_user1_idx').on(table.userId1),
            user2Idx: index('accepted_connections_user2_idx').on(table.userId2),
            interestIdx: index('accepted_connections_interest_idx').on(table.sharedInterest),
        },
    })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    userNfcs: many(userNfcs),
    connectionsFrom: many(connections, { relationName: 'fromUser' }),
    connectionsTo: many(connections, { relationName: 'toUser' }),
    invitationsSent: many(invitations, { relationName: 'fromUser' }),
    invitationsReceived: many(invitations, { relationName: 'toUser' }),
    acceptedConnections1: many(acceptedConnections, { relationName: 'user1' }),
    acceptedConnections2: many(acceptedConnections, { relationName: 'user2' }),
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

export const invitationsRelations = relations(invitations, ({ one }) => ({
    fromUser: one(users, {
        fields: [invitations.fromUserId],
        references: [users.id],
        relationName: 'fromUser',
    }),
    toUser: one(users, {
        fields: [invitations.toUserId],
        references: [users.id],
        relationName: 'toUser',
    }),
}));

export const acceptedConnectionsRelations = relations(acceptedConnections, ({ one }) => ({
    user1: one(users, {
        fields: [acceptedConnections.userId1],
        references: [users.id],
        relationName: 'user1',
    }),
    user2: one(users, {
        fields: [acceptedConnections.userId2],
        references: [users.id],
        relationName: 'user2',
    }),
    invitation: one(invitations, {
        fields: [acceptedConnections.invitationId],
        references: [invitations.id],
    }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserNfc = typeof userNfcs.$inferSelect;
export type InsertUserNfc = typeof userNfcs.$inferInsert;
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = typeof connections.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;
export type AcceptedConnection = typeof acceptedConnections.$inferSelect;
export type InsertAcceptedConnection = typeof acceptedConnections.$inferInsert;



