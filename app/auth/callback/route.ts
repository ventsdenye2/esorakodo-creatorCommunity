import { NextResponse } from "next/server";
import { createClient } from "../../../src/lib/supabase/server";
import { isSupabaseConfigured } from "../../../src/lib/supabase/config";
import { safeNextPath } from "../../../src/features/auth/safe-next.mjs";
import { callbackFailureNotice } from "../../../src/features/auth/callback-notice.mjs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"), url.origin);

  if (!isSupabaseConfigured() || !code) {
    const target = new URL("/login", url.origin);
    target.searchParams.set("error", "确认链接无效或不完整，请重新打开邮件中的链接，或使用邮箱和密码登录。");
    return NextResponse.redirect(target);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  } catch (error) {
    const notice = callbackFailureNotice(error);
    const target = new URL("/login", url.origin);
    target.searchParams.set(notice.key, notice.text);
    return NextResponse.redirect(target);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
