"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { signInSchema, signUpSchema } from "./schemas";
import { safeNextPath } from "./safe-next.mjs";
import { authErrorMessage } from "./error-message.mjs";

function authRedirect(path: string, key: "error" | "message", value: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`);
}

export async function signIn(formData: FormData) {
  const next = safeNextPath(String(formData.get("next") ?? ""), "https://campus.kongtian.university");
  const loginPath = `/login?next=${encodeURIComponent(next)}`;
  if (!isSupabaseConfigured()) {
    authRedirect(loginPath, "error", "登录服务暂不可用，请稍后重试。");
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    authRedirect(loginPath, "error", parsed.error.issues[0]?.message ?? "登录信息无效。");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) authRedirect(loginPath, "error", authErrorMessage(error));
  redirect(next);
}

export async function signUp(formData: FormData) {
  if (process.env.KTU_REGISTRATION_ENABLED === "false") {
    authRedirect("/register", "error", "当前处于受限测试阶段，暂未开放注册。已有账户仍可登录。");
  }
  if (!isSupabaseConfigured()) {
    authRedirect("/register", "error", "Supabase 尚未配置，请先设置本地环境变量。");
  }

  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    handle: formData.get("handle"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    authRedirect("/register", "error", parsed.error.issues[0]?.message ?? "注册信息无效。");
  }

  const requestHeaders = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ??
    requestHeaders.get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: new URL("/auth/callback", origin).toString(),
      data: {
        handle: parsed.data.handle,
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) authRedirect("/register", "error", authErrorMessage(error));
  if (data.session) redirect("/creator");
  authRedirect("/login", "message", "注册成功，请检查邮箱并完成验证。");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
