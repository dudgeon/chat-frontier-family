import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const childId = segments[segments.length - 1] || '';
  if (!childId) {
    return jsonResponse({ error: 'child_id required' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const jwt = req.headers.get('authorization')?.replace('Bearer ', '') ?? '';

  const supabase = createClient(supabaseUrl, anon, {
    global: { headers: { authorization: `Bearer ${jwt}` } }
  });

  if (req.method === 'GET') {
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, display_name, system_message')
      .eq('id', childId)
      .maybeSingle();
    if (profErr) return jsonResponse({ error: profErr.message }, 500);

    const { data: sessions, error: sessErr } = await supabase
      .from('chat_sessions')
      .select('id, name, description, last_updated')
      .eq('user_id', childId)
      .order('last_updated', { ascending: false });
    if (sessErr) return jsonResponse({ error: sessErr.message }, 500);

    return jsonResponse({ profile, sessions });
  }

  if (req.method === 'PATCH') {
    let body: any = {};
    try { body = await req.json(); } catch {}
    const updates: Record<string, unknown> = {};
    if (typeof body.display_name === 'string') updates.display_name = body.display_name;
    if (typeof body.system_message === 'string') updates.system_message = body.system_message;
    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: 'No valid fields' }, 400);
    }
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', childId);
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
});
