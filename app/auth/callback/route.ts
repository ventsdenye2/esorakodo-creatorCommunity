import { NextResponse } from "next/server";
import { createClient } from "../../../src/lib/supabase/server";
import { isSupabaseConfigured } from "../../../src/lib/supabase/config";
import { safeNextPath } from "../../../src/features/auth/safe-next.mjs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"), url.origin);

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/login?error=Invalid%20confirmation%20link", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
