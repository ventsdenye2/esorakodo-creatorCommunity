"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { signInSchema, signUpSchema } from "./schemas";

function authRedirect(path: string, key: "error" | "message", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured()) {
    authRedirect("/login", "error", "Supabase 尚未配置，请先设置本地环境变量。");
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    authRedirect("/login", "error", parsed.error.issues[0]?.message ?? "登录信息无效。");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) authRedirect("/login", "error", error.message);
  redirect("/creator");
}

export async function signUp(formData: FormData) {
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
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        handle: parsed.data.handle,
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) authRedirect("/register", "error", error.message);
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
