import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
    schema: './src/lib/server/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: { url: process.env.DATABASE_URL },
    verbose: true,
    tablesFilter: ["profiles", "leaderboard", "problems", "matches", "match_participants"],
    schemaFilter: ["public"], 
    strict: true,
});
