import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getRuntimeConfig } from "./runtimeConfig";

let client: ReturnType<typeof createClient<Database>> | null = null;

export async function getSupabase() {
  if (client) return client;
  const { supabaseUrl, supabaseAnonKey } = await getRuntimeConfig();
  client = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return client;
}
