import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.IMAGE_BUCKET || 'chat-images';

if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars are required');
  process.exit(1);
}

async function main() {
  const supabase = createClient(url, key);
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error && !error.message.includes('already exists')) {
    console.error('Bucket creation failed:', error.message);
    process.exit(1);
  }
  console.log(`Bucket "${BUCKET}" ready`);
}

main();
