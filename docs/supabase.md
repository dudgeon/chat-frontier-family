# Supabase

The database uses PostgreSQL with Row Level Security to separate adults and children. Policies live in [`supabase/migrations`](../supabase/migrations). Use the pattern `DROP POLICY IF EXISTS` then `CREATE POLICY` to keep migrations idempotent.

Columns are added with existence checks against `information_schema.columns`. Storage buckets (e.g. `chat-images`) are created via scripts under `scripts/` and referenced in migrations.

Edge functions handle chat streaming and image generation. Deploy them with:

```bash
supabase functions deploy <name> --project-ref <id>
```
The `chat_sessions` table now includes a `session_summary` column used to store a model-generated recap of each conversation. A nullable `description` column mirrors this summary for display in lists.

