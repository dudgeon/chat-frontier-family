import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEFAULT_CHILD_SYSTEM_MESSAGE =
  'You are a friendly assistant for children. Keep responses safe and age-appropriate.';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl       = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey   = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey= Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Missing Supabase env vars' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  /* 1: Validate the JWT with an anon-key client (RLS enforced) */
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: userErr } = await supabaseAnon.auth.getUser(token);
  if (userErr || !userData?.user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const parentId = userData.user.id;

  /* 2: Use a service-role client for all privileged operations (bypass RLS) */
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('user_role')
    .eq('id', parentId)
    .maybeSingle();

  if (profErr) {
    console.error('Profile query error:', profErr);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve profile' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (!profile) {
    return new Response(
      JSON.stringify({ error: 'Profile not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (profile.user_role !== 'adult') {
    return new Response(
      JSON.stringify({ error: 'Permission denied' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  /* 3: Parse body */
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { body = {}; }
  const { email, password } = body;
  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: 'Email and password required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  /* 4: Create the child auth user */
  const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (createErr) {
    const msg   = (createErr.message || '').toLowerCase();
    const isDup =
      msg.includes('already registered') ||
      msg.includes('user already')      ||
      msg.includes('duplicate')         ||
      msg.includes('23505');
    if (isDup) {
      // duplicate email → conflict
      return new Response(
        JSON.stringify({ error: 'Email already in use' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    // all other auth failures
    console.error('Create user error:', createErr);
    return new Response(
      JSON.stringify({ error: 'Failed to create child user' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (!newUser?.user) {
    return new Response(
      JSON.stringify({ error: 'Failed to create child user' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  /* 5: Insert/update the child profile with the correct role */
  const { error: updateErr } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: newUser.user.id,
        parent_id: parentId,
        user_role: 'child',
        system_message: DEFAULT_CHILD_SYSTEM_MESSAGE
      },
      { onConflict: 'id' }
    );
  if (updateErr) {
    console.error('Upsert profile error:', updateErr);
    return new Response(
      JSON.stringify({ error: 'Failed to update child profile' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  /* Success */
  return new Response(
    JSON.stringify({ success: true, user_id: newUser.user.id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
