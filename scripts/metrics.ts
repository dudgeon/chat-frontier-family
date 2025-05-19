import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ENABLE_EDGE_LOG_METRICS } = process.env;

if (!ENABLE_EDGE_LOG_METRICS) {
  console.log('Edge log metrics disabled');
  process.exit(0);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error } = await client.from('edge_logs').select('*').limit(5);
  if (error) {
    console.error('Query failed', error);
    return;
  }
  console.log(data);
}

run();
