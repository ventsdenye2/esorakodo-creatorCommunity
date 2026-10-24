// Prepare reviewable operator SQL. This script never opens a DB connection.
import fs from 'node:fs';
import { prepareEntries } from './prepare-official-wiki.mjs';

const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath) throw new Error('Usage: node scripts/update-canon-20261024.mjs <wiki-canon.json> <output.sql>');
const entries = prepareEntries(JSON.parse(fs.readFileSync(manifestPath, 'utf8')));
if (entries.length !== 21 || entries.some(e => e.official_id === 'mark') || !entries.some(e => e.official_id === 'zhouyan' && e.entity_type === 'student')) throw new Error('Unexpected canon manifest');
const literal = text => `'${text.replaceAll("'", "''")}'`;
const sql = `BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT pg_advisory_xact_lock(hashtext('ktu-official-wiki'));
CREATE TEMP TABLE old_revisions ON COMMIT DROP AS SELECT id, md5(row_to_json(r)::text) hash FROM public.wiki_revisions r;
CREATE TEMP TABLE unrelated_rows(table_name text, fingerprint text) ON COMMIT DROP;
DO $$ DECLARE t record; fingerprint text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('wiki_articles','students','wiki_official_sources','wiki_revisions') LOOP
    EXECUTE format('SELECT md5(coalesce(string_agg(j, chr(10) ORDER BY j), %L)) FROM (SELECT row_to_json(r)::text j FROM public.%I r) q', '', t.tablename) INTO fingerprint;
    INSERT INTO unrelated_rows VALUES(t.tablename, fingerprint);
  END LOOP;
END $$;
SELECT set_config('request.jwt.claim.sub', (SELECT created_by::text FROM public.wiki_articles WHERE slug='mark'), true);
SELECT public.reconcile_official_wiki(${literal(JSON.stringify(entries))}::jsonb);
DO $$
DECLARE r record; new_body text; new_summary text; art uuid; z public.students;
BEGIN
  -- Remove only the reviewed fragments, preserving all other campus edits.
  FOR r IN SELECT * FROM public.students WHERE concat_ws('',name,summary,body) LIKE '%印记%' FOR UPDATE LOOP
    new_body := regexp_replace(r.body, E'[|] 印记[^\\n]*\\n', '', 'g');
    new_body := replace(new_body, '能力与印记', '能力');
    new_body := replace(new_body, '，印记位于手心。', '。');
    new_body := replace(new_body, '，印记位于腹肌上。', '。');
    new_body := replace(new_body, '印记以眼影的形式呈现。', '');
    new_body := replace(new_body, '印记位于肱二头肌。', '');
    new_body := replace(new_body, '齿轮形的印记位于手腕。', '');
    new_summary := replace(r.summary, '，印记位于手心。', '。');
    new_summary := replace(new_summary, '，印记位于腹肌上。', '。');
    new_summary := replace(new_summary, '，印记以眼影形式呈现。', '。');
    new_summary := replace(new_summary, '，印记位于肱二头肌。', '。');
    IF concat_ws('',r.name,new_summary,new_body) LIKE '%印记%' THEN RAISE EXCEPTION 'Unreviewed fragment in student %', r.slug; END IF;
    PERFORM public.apply_wiki_revision('student',r.id,r.version,jsonb_build_object('summary',new_summary,'body',new_body),'取消旧设定，保留其余人物资料与历史修订');
  END LOOP;
  SELECT id INTO STRICT art FROM public.colleges WHERE slug='arts' AND name='艺术学院';
  SELECT * INTO STRICT z FROM public.students WHERE slug='zhouyan' FOR UPDATE;
  IF z.college_id IS DISTINCT FROM art THEN
    PERFORM public.apply_wiki_revision('student',z.id,z.version,jsonb_build_object('college_id',art),'登记艺术学院关联');
  END IF;
  FOR r IN SELECT * FROM public.wiki_articles WHERE slug='mark' AND retired_at IS NULL FOR UPDATE LOOP
    PERFORM public.apply_wiki_revision('article',r.id,r.version,jsonb_build_object('name','已撤下的设定','summary',null,'body',''),'依用户要求撤下旧设定；保留历史修订');
    UPDATE public.wiki_articles SET retired_at=now() WHERE id=r.id;
  END LOOP;
  IF EXISTS (SELECT 1 FROM (
    SELECT name,summary,body FROM public.wiki_articles WHERE retired_at IS NULL
    UNION ALL SELECT name,summary,body FROM public.students
    UNION ALL SELECT name,summary,body FROM public.colleges
    UNION ALL SELECT name,summary,body FROM public.places
  ) q WHERE concat_ws('',name,summary,body) LIKE '%印记%') THEN RAISE EXCEPTION 'Obsolete canon remains'; END IF;
  IF EXISTS(SELECT 1 FROM old_revisions o LEFT JOIN public.wiki_revisions rev USING(id) WHERE rev.id IS NULL OR md5(row_to_json(rev)::text) <> o.hash) THEN RAISE EXCEPTION 'Existing revisions changed'; END IF;
END $$;
DO $$ DECLARE t record; fingerprint text; BEGIN
  FOR t IN SELECT * FROM unrelated_rows LOOP
    EXECUTE format('SELECT md5(coalesce(string_agg(j, chr(10) ORDER BY j), %L)) FROM (SELECT row_to_json(r)::text j FROM public.%I r) q', '', t.table_name) INTO fingerprint;
    IF fingerprint <> t.fingerprint THEN RAISE EXCEPTION 'Unrelated table changed: %', t.table_name; END IF;
  END LOOP;
END $$;
SELECT jsonb_build_object('students',(SELECT count(*) FROM public.students),'revisions',(SELECT count(*) FROM public.wiki_revisions),'withdrawn',(SELECT count(*) FROM public.wiki_articles WHERE retired_at IS NOT NULL),'unrelatedTablesVerified',(SELECT count(*) FROM unrelated_rows)) AS result;
COMMIT;
`;
fs.writeFileSync(outputPath, sql);
console.log('Prepared canon update with revision and unrelated-table assertions; no database writes.');
