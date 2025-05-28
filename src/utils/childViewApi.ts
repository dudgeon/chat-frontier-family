import { fetchWithAuth } from '@/lib/fetchWithAuth';

export interface ChildSession {
  id: string;
  name: string | null;
  session_summary: string;
  created_at: string;
}

export interface ChildProfileResponse {
  profile: { id: string; display_name: string | null; system_message: string | null };
  sessions: ChildSession[];
}

export async function fetchChildProfile(childId: string): Promise<ChildProfileResponse> {
  const res = await fetchWithAuth(`/functions/v1/child-view?id=${childId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed');
  return data;
}

export async function updateChildProfile(childId: string, updates: { display_name?: string; system_message?: string }) {
  const res = await fetchWithAuth(`/functions/v1/child-view?id=${childId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed');
  return data;
}
