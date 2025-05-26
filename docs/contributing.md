# Contributing

## Prerequisites

- Node.js or Bun
- Supabase CLI installed and logged in
- Local Supabase runs Postgres 14—verify migrations against this version

## Development

```bash
bun install
bun run dev
```

Run lint and tests before pushing:

```bash
npm run lint
npm test
```

## Creating a Pull Request

1. Create a feature branch: `git checkout -b my-feature`
2. Commit your changes with a clear message.
3. Push the branch and open a PR targeting `main`.
4. Ensure the checklist passes:
   - [ ] `npm run lint`
   - [ ] `npm test`
   - [ ] Updated docs

### Deploying Edge Functions

Use the Supabase CLI:

```bash
supabase functions deploy chat --project-ref <project-id>
```

## Writing Migrations

- Generate a new migration with `supabase migration new <name>`; the CLI prefixes the file with a timestamp so order is preserved.
- Make migrations re-runnable:
  - `DROP POLICY IF EXISTS ...; CREATE POLICY ...` for policy changes.
  - Wrap `ALTER TABLE ... ADD COLUMN` in an existence check as seen in [`../supabase/migrations/20250521133000_add_hidden.sql`](../supabase/migrations/20250521133000_add_hidden.sql).
- Whenever `package.json` changes, run `bun install` and commit the updated `bun.lockb`.
- CI runs `bun install --frozen-lockfile`; forgetting to commit `bun.lockb` will break builds.
