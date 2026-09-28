import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database";
import { getSupabasePublicConfig } from "../../lib/supabase/config";

// Only imported by server Route Handlers. Never expose this client to UI modules.
export function createMediaAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("MEDIA_UNAVAILABLE");
  return createSupabaseClient<Database>(getSupabasePublicConfig().url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}
