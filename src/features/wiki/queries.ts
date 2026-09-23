import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import type { College, Place, Student } from "../../types/database";
import type { WikiEntityDetail, WikiEntitySummary, WikiEntityType, WikiRevisionView } from "./types";

function toSummary(type: WikiEntityType, row: Student | College | Place): WikiEntitySummary {
  return {
    id: row.id,
    type,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    version: row.version,
    updatedAt: row.updated_at,
  };
}

function toDetail(type: WikiEntityType, row: Student | College | Place): WikiEntityDetail {
  return {
    ...toSummary(type, row),
    collegeId: "college_id" in row ? row.college_id : null,
    signature: "signature" in row ? row.signature : null,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function listWikiEntities(): Promise<WikiEntitySummary[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const [students, colleges, places] = await Promise.all([
    supabase.from("students").select("*").order("updated_at", { ascending: false }),
    supabase.from("colleges").select("*").order("updated_at", { ascending: false }),
    supabase.from("places").select("*").order("updated_at", { ascending: false }),
  ]);

  const firstError = students.error ?? colleges.error ?? places.error;
  if (firstError) throw new Error(firstError.message);

  return [
    ...(students.data ?? []).map((row) => toSummary("student", row)),
    ...(colleges.data ?? []).map((row) => toSummary("college", row)),
    ...(places.data ?? []).map((row) => toSummary("place", row)),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function listColleges(): Promise<College[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("colleges").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getWikiEntityBySlug(
  type: WikiEntityType,
  slug: string,
): Promise<WikiEntityDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  if (type === "student") {
    const { data, error } = await supabase.from("students").select("*").eq("slug", slug).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDetail(type, data) : null;
  }
  if (type === "college") {
    const { data, error } = await supabase.from("colleges").select("*").eq("slug", slug).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDetail(type, data) : null;
  }

  const { data, error } = await supabase.from("places").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toDetail(type, data) : null;
}

export async function getWikiRevisions(
  type: WikiEntityType,
  entityId: string,
): Promise<WikiRevisionView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wiki_revisions")
    .select("*")
    .eq("entity_type", type)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAuthenticatedCreatorId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
