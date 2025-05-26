# CI Workflows

This repository uses GitHub Actions to deploy and verify the database.

## Workflows overview

- **run-migrations.yml** – pushes Supabase migrations using the CLI.
- **parent-child-access-test.yml** – logs in as the demo adult user and fails if that user cannot read child rows.

## Adding new secrets

1. Open the repository on GitHub.
2. Navigate to **Settings → Secrets → Actions**.
3. Click **New repository secret** and provide the name and value.

## Exit codes

- `0` – workflow step succeeded.
- `1` – general failure (e.g. migration error or login failure).
- `2` – parent-child access test ran but found no rows (RLS blocked the parent).
