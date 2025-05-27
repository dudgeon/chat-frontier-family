import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supa';

interface ChildProfile {
  id: string;
  display_name: string | null;
  system_message: string | null;
}

interface ChildSession {
  id: string;
  name: string | null;
  description: string | null;
  created_at: string;
}

export async function fetchChild(childId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const resp = await fetch(`${supabaseUrl}/functions/v1/children/${childId}`, {
    headers: {
      apikey: anon,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
    }
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<{ profile: ChildProfile; sessions: ChildSession[] }>;
}

async function patchChild(childId: string, updates: Partial<ChildProfile>) {
  const { data: { session } } = await supabase.auth.getSession();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const resp = await fetch(`${supabaseUrl}/functions/v1/children/${childId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
    },
    body: JSON.stringify(updates)
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<{ profile: ChildProfile }>;
}

export function useChildView(childId: string) {
  const queryClient = useQueryClient();
  const query = useQuery(['child', childId], () => fetchChild(childId), { enabled: !!childId });
  const mutation = useMutation((u: Partial<ChildProfile>) => patchChild(childId, u), {
    onSuccess: (data) => {
      queryClient.setQueryData(['child', childId], (old: any) => ({ ...(old || {}), profile: data.profile }));
    }
  });
  return { ...query, updateChild: mutation.mutateAsync, updating: mutation.isLoading };
}
