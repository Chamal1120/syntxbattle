import { pgTable, pgSchema, uuid, text, integer, timestamp, boolean, primaryKey, jsonb } from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');
export const users = authSchema.table('users', {
    id: uuid('id').primaryKey().notNull()
});

/**
 * Player Profiles Table
 * Links 1:1 with Supabase Auth Users
 */
export const profiles = pgTable('profiles', {
    // The id matches the auth.users uuid exactly
    id: uuid('id')
        .primaryKey()
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    username: text('username').notNull().unique(),
    avatarUrl: text('avatar_url'),
    isOnline: boolean('is_online').default(false),
    updatedAt: timestamp('updated_at').defaultNow()
});

/**
 * Leaderboard Table
 */
export const leaderboard = pgTable('leaderboard', {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
        .notNull()
        .references(() => profiles.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(), // e.g., time in seconds to solve
    language: text('language').notNull(),
    solvedAt: timestamp('solved_at').defaultNow()
});

/**
 * Problems Table
 * Contains coding challenges/problems
 */
export const problems = pgTable('problems', {
    id: text('id').primaryKey().notNull(),
    title: text('title').notNull(),
    difficulty: text('difficulty'),
    description: text('description').notNull(),
    starterCode: text('starter_code'),
    testCases: jsonb('test_cases').notNull()
});

/**
 * Matches Table
 * Tracks coding battle matches
 */
export const matches = pgTable('matches', {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    problemId: text('problem_id')
        .notNull()
        .references(() => problems.id),
    status: text('status').default('waiting'),
    maxPlayers: integer('max_players').default(2),
    creatorId: uuid('creator_id')
        .notNull()
        .references(() => users.id),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
});

/**
 * Match Participants Table
 * Junction table for users in matches
 */
export const matchParticipants = pgTable('match_participants', {
    matchId: uuid('match_id')
        .notNull()
        .references(() => matches.id),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow()
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.matchId, table.userId] })
    };
});
