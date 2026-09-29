import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database";
import { getSupabasePublicConfig } from "../../lib/supabase/config";
import { isSameMediaOrigin } from "./same-origin.mjs";

// Only imported by server Route Handlers. Never expose this client to UI modules.
export function createMediaAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("MEDIA_UNAVAILABLE");
  return createSupabaseClient<Database>(getSupabasePublicConfig().url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function sameOrigin(request: Request) {
  return isSameMediaOrigin(request, {
    production: process.env.NODE_ENV === "production",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  });
}
