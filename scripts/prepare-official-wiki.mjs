// Generates reviewable SQL; never connects to or writes a database.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function prepareEntries(manifest) {
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries) || !manifest.entries.length) throw new Error('Invalid official manifest');
  return manifest.entries.map(entry => {
    const content = { title: entry.title, summary: entry.summary, sections: entry.sections };
    if (createHash('sha256').update(JSON.stringify(content)).digest('hex') !== entry.hash) throw new Error(`Hash mismatch: ${entry.id}`);
    const text = html => html
      .replace(/<p>/g, '').replace(/<\/p>/g, '\n\n')
      .replace(/<ul>/g, '\n').replace(/<\/ul>/g, '\n')
      .replace(/<li>/g, '- ').replace(/<\/li>/g, '\n')
      .replace(/<code>/g, '`').replace(/<\/code>/g, '`')
      .replace(/^[ \t]+/gm, '').trim();
    // Refuse new HTML structures rather than silently losing content.
    const body = entry.sections.map(s => `## ${s.title}\n\n${text(s.html)}`).join('\n\n');
    if (/<\/?[a-z][^>]*>/i.test(body)) throw new Error(`Review HTML conversion for ${entry.id}`);
    return { official_id: entry.id, entity_type: entry.type, slug: entry.slug, source_hash: entry.hash, name: entry.title, summary: entry.summary, body };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [manifestPath, actor, outputPath] = process.argv.slice(2);
  if (!manifestPath || !/^[0-9a-f-]{36}$/i.test(actor ?? '') || !outputPath) throw new Error('Usage: node scripts/prepare-official-wiki.mjs <wiki-canon.json> <creator-uuid> <output.sql>');
  const entries = prepareEntries(JSON.parse(fs.readFileSync(manifestPath, 'utf8')));
  const payload = JSON.stringify(entries).replaceAll("'", "''");
  fs.writeFileSync(outputPath, `-- Review official-wins reconciliation before applying. Run on trusted DB operator connection.\nBEGIN;\nSELECT set_config('request.jwt.claim.sub', '${actor}', true);\nSELECT public.reconcile_official_wiki('${payload}'::jsonb);\nCOMMIT;\n`);
  console.log(`Prepared ${entries.length} entries. No database writes performed.`);
}
