import { listWikiEntities } from "../wiki/queries";
import { getWikiEntityHref } from "../wiki/types";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import type { EditorEntity } from "./types";

export async function getEditorEntities(): Promise<EditorEntity[]> {
  if (!isSupabaseConfigured()) return [];
  const client = await createClient();
  const [wiki, events] = await Promise.all([listWikiEntities(), client.from("events").select("id,title").eq("status", "published").order("title")]);
  if (events.error) throw new Error(events.error.message);
  return [...wiki.map((entity) => ({ id: entity.id, type: entity.type, label: entity.name, href: getWikiEntityHref(entity.type, entity.slug) })), ...(events.data ?? []).map((event) => ({ id: event.id, type: "event" as const, label: event.title, href: `/events/${event.id}` }))];
}
