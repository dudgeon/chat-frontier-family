import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const EMAIL = process.env.TEST_ADULT_EMAIL!;
const PASSWORD = process.env.TEST_ADULT_PASSWORD!;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1️⃣  Sign in as the adult test user
  const { data: { session }, error: signInError } =
    await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });

  if (signInError || !session) {
    console.error('❌ Sign-in failed', signInError);
    process.exit(1);
  }

  const userId = session.user.id;
  console.log('✅ Signed in as', userId);

  // 2️⃣  Attempt to read the child rows
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, user_role, parent_id')
    .eq('parent_id', userId)
    .order('display_name');

  if (error) {
    console.error('❌ Query error:', error);
    process.exit(1);
  }

  console.table(data);
  console.log(`Fetched ${data.length} child row(s)`);
  // Exit 0 if at least one row, 2 if none (indicates RLS block)
  process.exit(data.length === 0 ? 2 : 0);
}

main();
