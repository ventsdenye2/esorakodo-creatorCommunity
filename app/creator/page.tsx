import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "../../src/features/auth/actions";
import { isSupabaseConfigured } from "../../src/lib/supabase/config";
import { createClient } from "../../src/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Creator 档案" };

export default async function CreatorPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="creator-page">
        <Link className="text-link" href="/">← 返回校园</Link>
        <h1>Creator 档案</h1>
        <p>Auth 结构已经就绪。复制 <code>.env.example</code> 为 <code>.env.local</code> 并连接 Supabase 后即可启用会话。</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, display_name, bio, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="creator-page">
      <div className="creator-toolbar">
        <Link className="text-link" href="/">← 返回校园</Link>
        <form action={signOut}><button className="button" type="submit">退出登录</button></form>
      </div>
      <span className="archive-label">CREATOR PROFILE</span>
      <h1>{profile?.display_name ?? user.email ?? "Creator"}</h1>
      <p className="creator-handle">@{profile?.handle ?? "pending-profile"}</p>
      <p>{profile?.bio ?? "Creator 档案已建立。你可以从校园档案或论坛主题开始创作。"}</p>
      <nav className="creator-toolbar" aria-label="创作入口">
        <Link className="button button-primary" href="/create/wiki">建立校园档案</Link>
        <Link className="button button-secondary" href="/create/forum">创作论坛主题</Link>
      </nav>
    </main>
  );
}
