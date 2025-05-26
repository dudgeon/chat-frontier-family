import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.IMAGE_BUCKET || 'chat-images';
const STORAGE_PUBLIC = (process.env.STORAGE_PUBLIC ?? 'true') === 'true';

if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars are required');
  process.exit(1);
}

async function main() {
  const supabase = createClient(url, key);

  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (error && error.status !== 404) {
    console.error('Error checking bucket:', error.message);
    process.exit(1);
  }

  if (!data) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: STORAGE_PUBLIC,
    });
    if (createErr) {
      console.error('Bucket creation failed:', createErr.message);
      process.exit(1);
    }
    console.log(`Bucket "${BUCKET}" created`);
  } else {
    console.log(`Bucket "${BUCKET}" already exists`);
  }
}

main();
