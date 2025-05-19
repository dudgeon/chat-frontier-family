import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL as string;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('edge_logs')
    .select('latency_ms')
    .order('timestamp', { ascending: false })
    .limit(1000);

  if (error) throw error;
  const latencies = (data as any[]).map((d) => d.latency_ms).sort((a, b) => a - b);
  const idx = Math.floor(latencies.length * 0.95);
  const p95 = latencies[idx] ?? 0;
  console.log('p95 first-token latency:', p95, 'ms');
}

main();
