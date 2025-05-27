import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { pathname } = new URL(req.url);
  const parts = pathname.split('/');
  const idx = parts.indexOf('children');
  const childId = idx >= 0 && parts.length > idx + 1 ? parts[idx + 1] : null;

  if (!childId) return json({ error: 'child_id required' }, 400);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  if (req.method === 'GET') {
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, display_name, system_message')
      .eq('id', childId)
      .maybeSingle();
    if (profErr) return json({ error: profErr.message }, 500);

    const { data: sessions, error: sessErr } = await supabase
      .from('chat_sessions')
      .select('id, name, description, created_at')
      .eq('user_id', childId)
      .order('created_at', { ascending: false });
    if (sessErr) return json({ error: sessErr.message }, 500);

    return json({ profile, sessions });
  }

  if (req.method === 'PATCH') {
    let body: any;
    try { body = await req.json(); } catch { body = {}; }
    const updates: Record<string, string | null> = {};
    if ('display_name' in body) updates.display_name = body.display_name;
    if ('system_message' in body) updates.system_message = body.system_message;

    const { error: updErr } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', childId);
    if (updErr) return json({ error: updErr.message }, 500);

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, display_name, system_message')
      .eq('id', childId)
      .maybeSingle();
    if (profErr) return json({ error: profErr.message }, 500);

    return json({ profile });
  }

  return json({ error: 'Method not allowed' }, 405);
});
