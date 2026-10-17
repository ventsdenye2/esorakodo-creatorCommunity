"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { characterSchema, type CharacterInput } from "./model";

export async function createCharacter(input: CharacterInput): Promise<{ error?: string; href?: string }> {
  const parsed = characterSchema.safeParse(input);
  if (!parsed.success) return { error: "信息格式有误，请检查后重试；所有问题都可以留空。" };
  if (!isSupabaseConfigured()) return { error: "档案服务暂不可用，输入仍然保留。" };
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { error: "登录已过期，请登录后返回重试，输入仍然保留。" };
  const value = parsed.data;
  const { data, error } = await db.rpc("create_student_character", {
    p_request_id: value.requestId, p_name: value.name, p_college_id: value.collegeId,
    p_ability: value.ability, p_traits: value.traits,
    p_portrait_asset_id: value.portraitAssetId, p_card_asset_id: value.cardAssetId,
    p_appearance: value.appearance ?? {},
  });
  if (error) return { error: error.message.includes("CREATOR_PROFILE_REQUIRED") ? "请先完成创作者档案，再返回建立角色。" : error.message.includes("CHARACTER_COLLEGE_INVALID") ? "学院信息已变化，请返回第一题重新选择或跳过。" : "建立档案失败，请稍后重试，当前学生证与输入仍然保留。" };
  const result = data as { slug?: string } | null;
  if (!result?.slug) return { error: "暂时无法确认创建结果，请重试；不会重复建立档案。" };
  const href = `/wiki/student/${result.slug}`;
  revalidatePath("/wiki"); revalidatePath(href); revalidatePath("/");
  return { href };
}
