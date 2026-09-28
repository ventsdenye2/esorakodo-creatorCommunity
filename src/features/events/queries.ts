import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import type { Database } from "../../types/database";

export type EventRecord = Database["public"]["Tables"]["events"]["Row"];
export type EventNode = Database["public"]["Tables"]["event_timeline_nodes"]["Row"];
export type EventSupplement = Database["public"]["Tables"]["event_supplements"]["Row"];
export type EventFilters = { q?: string; student?: string; college?: string; place?: string; from?: string; to?: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listPublishedEvents(filters: EventFilters = {}): Promise<EventRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const db = await createClient();
  let ids: string[] | null = null;
  for (const type of ["student", "college", "place"] as const) {
    const id = filters[type];
    if (!id) continue;
    if (!uuid.test(id)) return [];
    const result = await db.from("event_entity_links").select("event_id").eq(`${type}_id`, id);
    if (result.error) throw new Error(result.error.message);
    const matches = (result.data ?? []).map((row) => row.event_id);
    ids = ids ? ids.filter((id) => matches.includes(id)) : matches;
    if (!ids.length) return [];
  }
  let query = db.from("events").select("*").eq("status", "published").order("starts_on", { ascending: false, nullsFirst: false }).order("published_at", { ascending: false }).limit(100);
  if (ids) query = query.in("id", ids);
  if (filters.q?.trim()) query = query.ilike("title", `%${filters.q.trim().slice(0, 120).replace(/[%_]/g, "\\$&")}%`);
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) query = query.or(`ends_on.gte.${filters.from},and(ends_on.is.null,starts_on.gte.${filters.from})`);
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) query = query.lte("starts_on", filters.to);
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

export async function listOwnEvents() {
  if (!isSupabaseConfigured()) return [];
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];
  const result = await db.from("events").select("*").eq("creator_id", user.id).order("updated_at", { ascending: false });
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

export async function listOwnSupplements() {
  if (!isSupabaseConfigured()) return [];
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];
  const result = await db.from("event_supplements").select("*").eq("creator_id", user.id).order("updated_at", { ascending: false });
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

export async function getEvent(id: string, includeDraft = false) {
  if (!isSupabaseConfigured() || !uuid.test(id)) return null;
  const db = await createClient();
  let query = db.from("events").select("*").eq("id", id);
  if (!includeDraft) query = query.eq("status", "published");
  const result = await query.maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) return null;
  const [nodes, supplements, links, creator] = await Promise.all([
    db.from("event_timeline_nodes").select("*").eq("event_id", id).order("sort_order"),
    db.from("event_supplements").select("*").eq("event_id", id).eq("status", "published").order("published_at"),
    db.from("event_entity_links").select("*").eq("event_id", id),
    db.from("profiles").select("id,handle,display_name").eq("id", result.data.creator_id).maybeSingle(),
  ]);
  const error = nodes.error ?? supplements.error ?? links.error ?? creator.error;
  if (error) throw new Error(error.message);
  const normalizedLinks = (links.data ?? []).flatMap((link) => (["student", "college", "place"] as const).flatMap((type) => link[`${type}_id`] ? [{ entity_type: type, entity_id: link[`${type}_id`]! }] : []));
  return { event: result.data, nodes: nodes.data ?? [], supplements: supplements.data ?? [], links: normalizedLinks, creator: creator.data };
}

export async function getEventSupplement(id: string, includeDraft = false) {
  if (!isSupabaseConfigured() || !uuid.test(id)) return null;
  const db = await createClient();
  let query = db.from("event_supplements").select("*").eq("id", id);
  if (!includeDraft) query = query.eq("status", "published");
  const result = await query.maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) return null;
  if (!includeDraft) {
    const parent = await db.from("events").select("id").eq("id", result.data.event_id).eq("status", "published").maybeSingle();
    if (parent.error) throw new Error(parent.error.message);
    if (!parent.data) return null;
  }
  const creator = await db.from("profiles").select("id,handle,display_name").eq("id", result.data.creator_id).maybeSingle();
  if (creator.error) throw new Error(creator.error.message);
  return { supplement: result.data, creator: creator.data };
}
