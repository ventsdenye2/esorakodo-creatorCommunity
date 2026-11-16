import { z } from "zod";
import { createClient } from "../../../../src/lib/supabase/server";
import { isSameMediaOrigin } from "../../../../src/features/media/same-origin.mjs";
export async function POST(request: Request) {
  if (!isSameMediaOrigin(request, { production: process.env.NODE_ENV === "production", siteUrl: process.env.NEXT_PUBLIC_SITE_URL })) return Response.json({ error: "请求来源无效。" }, { status: 403 });
  const raw = await request.text(); if (raw.length > 200) return Response.json({ error: "邀请地址无效。" }, { status: 400 });
  let token: unknown; try { token = JSON.parse(raw).token; } catch { /* handled by validation */ }
  const parsed = z.string().regex(/^[a-f0-9]{64}$/).safeParse(token);
  if (!parsed.success) return Response.json({ error: "邀请地址不完整，请向作者获取新链接。" }, { status: 400 });
  const db = await createClient(); const { data: { user } } = await db.auth.getUser();
  if (!user) return Response.json({ error: "请先登录，再返回这个邀请链接。" }, { status: 401 });
  const { data, error } = await db.rpc("accept_forum_invite", { p_token: parsed.data });
  if (error) return Response.json({ error: error.message.includes("DISABLED") ? "作者目前设置为仅自己编辑，请联系作者开启协作。" : "邀请已失效或被撤销，请向作者获取新链接。" }, { status: 400 });
  return Response.json({ topicId: data }, { headers: { "Cache-Control": "private, no-store" } });
}
