<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:database-migration-rules -->
# Database Schema & Migration Protocol

- **NEVER use `drizzle-kit push` (`npm run db:push`) against the live production database.**
- Schema drift must never recur. All database schema changes MUST follow the versioned migration protocol:
  1. Modify `src/db/schema.ts`
  2. Generate a migration: `npm run db:generate` (creates a numbered SQL migration in `./drizzle` and updates snapshot in `./drizzle/meta`)
  3. Apply migration: `npm run db:migrate` (runs migration safely through Drizzle's `__drizzle_migrations` tracking engine)
- Always check that new tables, foreign keys, and indexes are cleanly reflected in the generated `.sql` file before applying.
- **Do not delete or rewrite historical migration files (`0000`, `0001`, `0002`, etc.)** — migrations represent immutable linear history recorded in `drizzle/meta/_journal.json` and tracked in `drizzle.__drizzle_migrations`.
<!-- END:database-migration-rules -->

