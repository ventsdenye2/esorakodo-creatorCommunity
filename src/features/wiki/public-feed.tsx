import { createClient } from '@supabase/supabase-js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import type { Database } from '../../types/database';
import { getSupabasePublicConfig } from '../../lib/supabase/config';
import { wikiEntityTypes } from './types';

const tables = { article: 'wiki_articles', student: 'students', college: 'colleges', place: 'places' } as const;
// Raw HTML is dropped by remark-rehype; the static reader also sanitizes the HTML
// and resolves relative links/media to the campus origin before inserting it.
const markdown = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify);

// This client always uses the public key and never receives visitor cookies.
export async function buildPublicWikiFeed() {
  const { url, anonKey } = getSupabasePublicConfig();
  const db = createClient<Database>(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  async function readSources() {
    const rows = [];
    for (let from = 0; from < 10000; from += 200) {
      const { data, error } = await db.from('wiki_official_sources').select('*').order('official_id').range(from, from + 199);
      if (error) throw new Error('WIKI_FEED_UNAVAILABLE');
      rows.push(...data);
      if (data.length < 200) return rows;
    }
    throw new Error('WIKI_FEED_CAPACITY');
  }
  const sources = await readSources();
  const groups = await Promise.all(wikiEntityTypes.map(async type => {
    const rows = [];
    for (let from = 0; from < 10000; from += 200) {
      const { data, error } = await db.from(tables[type]).select('*').order('id').range(from, from + 199);
      if (error) throw new Error('WIKI_FEED_UNAVAILABLE');
      rows.push(...data);
      if (data.length < 200) return rows.map(row => {
        const source = sources.find(s => s.entity_type === type && s.entity_id === row.id);
        return {
          id: source?.official_id ?? `${type}:${row.slug}`, type, slug: row.slug,
          title: row.name, summary: row.summary ?? '', version: row.version, updatedAt: row.updated_at,
          officialHash: source?.source_hash ?? null,
          sections: [{ id: 'content', title: '正文', html: String(markdown.processSync(row.body)) }],
        };
      });
    }
    throw new Error('WIKI_FEED_CAPACITY');
  }));
  return { schemaVersion: 1, entries: groups.flat() };
}
