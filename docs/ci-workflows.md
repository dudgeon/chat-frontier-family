# CI Workflows

This repository uses GitHub Actions to deploy and verify the database.

## Workflows overview

- **run-migrations.yml** – pushes Supabase migrations using the CLI.
- **parent-child-access-test.yml** – logs in as the demo adult user and fails if that user cannot read child rows.
- **component-map.yml** – auto-generates a Mermaid diagram of React components.

## Adding new secrets

1. Open the repository on GitHub.
2. Navigate to **Settings → Secrets → Actions**.
3. Click **New repository secret** and provide the name and value.

Workflows that commit back to the branch require the default `GITHUB_TOKEN` to have **Read and write** permissions. Enable this in the repository settings under **Actions → General**.

## Exit codes

- `0` – workflow step succeeded.
- `1` – general failure (e.g. migration error or login failure).
- `2` – parent-child access test ran but found no rows (RLS blocked the parent).
