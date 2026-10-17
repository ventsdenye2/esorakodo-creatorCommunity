"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "../../lib/supabase/server";

const speakerSchema = z.object({
  topicId: z.uuid(), id: z.uuid().nullable(),
  name: z.string().trim().min(1, "请写一个昵称。").max(60, "昵称不能超过 60 字。"),
  avatarId: z.uuid().nullable(),
});

// Identity data is shared by that Forum Account; draft content still saves through its atomic RPC.
export async function saveDraftSpeaker(input: z.infer<typeof speakerSchema>) {
  const parsed = speakerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "身份信息无效。", account: null };
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { error: "登录已过期，请在新标签页登录后返回重试。当前输入仍保留。", account: null };
  const { data: allowed, error: topicError } = await db.rpc("can_edit_forum", { p_topic_id: parsed.data.topicId });
  if (topicError || !allowed) return { error: "作品不存在或无权编辑。请保留当前输入后检查。", account: null };
  const values = { display_name: parsed.data.name, avatar_asset_id: parsed.data.avatarId };
  const result = parsed.data.id
    ? await db.from("forum_accounts").update(values).eq("id", parsed.data.id).eq("created_by", user.id).select("*").maybeSingle()
    : await db.from("forum_accounts").insert({ ...values, created_by: user.id, handle: `campus_${randomUUID().replaceAll("-", "").slice(0, 12)}`, account_type: "unknown", student_id: null }).select("*").single();
  if (result.error || !result.data) return { error: "身份保存失败。请检查昵称、头像是否可用后重试，当前输入仍保留。", account: null };
  return { error: null, account: result.data };
}
