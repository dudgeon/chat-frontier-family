CREATE TABLE IF NOT EXISTS public.edge_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payload jsonb,
  created_at timestamptz DEFAULT now()
);
