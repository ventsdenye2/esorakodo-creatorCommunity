import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import type { Database } from "../../types/database";
import { articleTags } from "./schemas";

export type Article = Database["public"]["Tables"]["articles"]["Row"];
export type ArticleView = Article & { tags: string[]; authorName: string };

async function enrich(articles: Article[]): Promise<ArticleView[]> {
  if (!articles.length) return [];
  const client = await createClient();
  const [links, profiles] = await Promise.all([
    client.from("article_tags").select("article_id,tags(name)").in("article_id", articles.map((item) => item.id)),
    client.from("profiles").select("id,display_name").in("id", [...new Set(articles.map((item) => item.creator_id))]),
  ]);
  if (links.error || profiles.error) throw new Error(links.error?.message ?? profiles.error?.message);
  return articles.map((article) => ({ ...article, authorName: profiles.data?.find((profile) => profile.id === article.creator_id)?.display_name ?? "作者", tags: (links.data ?? []).filter((link) => link.article_id === article.id).flatMap((link) => link.tags ? [link.tags.name] : []) }));
}
export async function listArticles(tag?: string): Promise<ArticleView[]> {
  if (!isSupabaseConfigured()) return [];
  const client = await createClient();
  let ids: string[] | null = null;
  if (tag) {
    const { data: selected, error } = await client.from("tags").select("id").eq("name", tag).maybeSingle();
    if (error) throw new Error(error.message);
    if (!selected) return [];
    const { data: links, error: linkError } = await client.from("article_tags").select("article_id").eq("tag_id", selected.id);
    if (linkError) throw new Error(linkError.message);
    ids = links?.map((link) => link.article_id) ?? [];
    if (!ids.length) return [];
  }
  let query = client.from("articles").select("*").eq("status", "published").order("published_at", { ascending: false }).order("id", { ascending: false }).limit(60);
  if (ids) query = query.in("id", ids);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return enrich(data ?? []);
}
export async function listOwnArticles(): Promise<ArticleView[]> {
  if (!isSupabaseConfigured()) return [];
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return [];
  const { data, error } = await client.from("articles").select("*").eq("creator_id", user.id).order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return enrich(data ?? []);
}
export async function getArticle(id: string, own = false): Promise<ArticleView | null> {
  if (!isSupabaseConfigured()) return null;
  const client = await createClient();
  let query = client.from("articles").select("*").eq("id", id);
  if (own) { const { data: { user } } = await client.auth.getUser(); if (!user) return null; query = query.eq("creator_id", user.id).neq("status", "hidden"); }
  else query = query.eq("status", "published");
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (await enrich([data]))[0] : null;
}
export async function listArticleTags(): Promise<string[]> {
  return [...articleTags];
}
