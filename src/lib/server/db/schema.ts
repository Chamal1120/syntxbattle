/**
 * Syntxbattle - Database Schema
 *
 * @description
 * TypeScript schema definitions for the PostgreSQL database using Drizzle ORM.
 * Provides type-safe database access and migrations.
 *
 * Tables:
 * - profiles: User profiles linked to Supabase Auth
 * - leaderboard: Global rankings and scores
 * - problems: Coding challenge definitions
 * - matches: Battle instances with status tracking
 * - match_participants: Junction table for match membership
 *
 * Note: This schema is used for type-safety. Drizzle migration has a bug
 * that prevents some declerations from migrating to supabase.
 *
 * @author Chamal Mallawaarachchi
 */
import {
    pgTable,
    pgSchema,
    uuid,
    text,
    integer,
    timestamp,
    boolean,
    primaryKey,
    jsonb,
} from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');
export const users = authSchema.table('users', {
    id: uuid('id').primaryKey().notNull(),
});

/**
 * Player Profiles
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
    updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Leaderboard
 */
export const leaderboard = pgTable('leaderboard', {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
        .notNull()
        .references(() => profiles.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(),
    language: text('language').notNull(),
    solvedAt: timestamp('solved_at').defaultNow(),
});

/**
 * Problems
 * Contains coding challenges/problems
 */
export const problems = pgTable('problems', {
    id: text('id').primaryKey().notNull(),
    title: text('title').notNull(),
    difficulty: text('difficulty'),
    description: text('description').notNull(),
    starterCode: text('starter_code'),
    testCases: jsonb('test_cases').notNull(),
});

/**
 * Matches
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
 * Match Participants
 * Junction table for users in matches
 */
export const matchParticipants = pgTable(
    'match_participants',
    {
        matchId: uuid('match_id')
            .notNull()
            .references(() => matches.id),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id),
        joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
    },
    (table) => {
        return {
            pk: primaryKey({ columns: [table.matchId, table.userId] }),
        };
    }
);
