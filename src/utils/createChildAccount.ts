import { getSupabase } from '@/lib/supa';

export const createChildAccount = async (email: string, password: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke('create-child-account', {
    body: { email, password }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data && data.error) {
    throw new Error(data.error);
  }

  return data;
};
