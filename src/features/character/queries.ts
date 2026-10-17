import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { extractAbility, type AbilityExample } from "./model";

export async function listCharacterColleges() {
  if (!isSupabaseConfigured()) return [];
  const db = await createClient();
  const { data, error } = await db.from("colleges").select("id,name,summary").order("name").abortSignal(AbortSignal.timeout(6000));
  if (error) throw new Error(error.message);
  return data ?? [];
}
export async function listAbilityExamples(): Promise<AbilityExample[]> {
  if (!isSupabaseConfigured()) return [];
  const db = await createClient();
  const { data, error } = await db.from("students").select("name,slug,body").order("updated_at", { ascending: false }).limit(60).abortSignal(AbortSignal.timeout(6000));
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap(row => { const text = extractAbility(row.body); return text ? [{ name: row.name, slug: row.slug, text }] : []; }).slice(0, 12);
}
export async function getStudentCard(studentId: string) {
  if (!isSupabaseConfigured()) return null;
  const db = await createClient();
  const { data } = await db.from("student_character_cards").select("card_asset_id,student_number,created_at").eq("student_id", studentId).maybeSingle();
  return data;
}
