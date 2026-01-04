/**
 * Syntxbattle - Database Connection (Drizzle ORM)
 *
 * @description
 * Initializes and exports the Drizzle database client for server-side operations.
 * Connects to PostgreSQL using the DATABASE_URL environment variable.
 *
 * Usage:
 * import { db } from '$lib/server/db';
 * const users = await db.select().from(profiles);
 *
 * Note: This should only be imported in server-side code (+page.server.ts,
 * +server.ts, hooks.server.ts).
 *
 * @author Chamal Mallawaarachchi
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });
