CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.edge_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb,
  created_at timestamptz DEFAULT now()
);
