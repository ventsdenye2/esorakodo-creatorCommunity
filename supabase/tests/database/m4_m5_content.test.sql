begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,email,raw_user_meta_data) values
('00000000-0000-4000-8000-000000000041','content-a@example.test','{"handle":"content_author_a"}'),
('00000000-0000-4000-8000-000000000042','content-b@example.test','{"handle":"content_author_b"}');
insert into public.articles(id,creator_id,title,body) values('00000000-0000-4000-8000-000000000401','00000000-0000-4000-8000-000000000041','Draft','{"schema_version":1,"blocks":[]}');
insert into public.events(id,creator_id,title,status,published_at) values
('00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000041','Archive','published',now()),
('00000000-0000-4000-8000-000000000502','00000000-0000-4000-8000-000000000041','Draft archive','draft',null);
insert into public.event_timeline_nodes(id,event_id,sort_order,label,title) values
('00000000-0000-4000-8000-000000000511','00000000-0000-4000-8000-000000000501',1,'Day 1','Opening'),
('00000000-0000-4000-8000-000000000512','00000000-0000-4000-8000-000000000502',1,'Day 1','Private');
select ok(not has_table_privilege('authenticated','public.articles','UPDATE'),'articles have no direct write grant');
select ok(not has_table_privilege('authenticated','public.events','INSERT'),'archives have no direct insert grant');
select ok(not has_table_privilege('authenticated','public.event_timeline_nodes','DELETE'),'timeline cannot bypass RPC');
select ok(not has_function_privilege('anon','public.save_article(uuid,bigint,text,text,jsonb,text[],boolean)','EXECUTE'),'anonymous cannot save');
select ok(not has_function_privilege('authenticated','public.sync_content_links(text,uuid,jsonb)','EXECUTE'),'internal helper is private');
set local role anon;
select is((select count(*) from public.articles),0::bigint,'anonymous cannot read draft');
select is((select count(*) from public.events where id in ('00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000502')),1::bigint,'anonymous only sees published archive');
select is((select count(*) from public.event_timeline_nodes where event_id='00000000-0000-4000-8000-000000000502'),0::bigint,'draft timeline private');
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000041';
select lives_ok($$select public.save_article(null,null,'New article','','{"schema_version":1,"blocks":[{"type":"paragraph","text":"Read me"}]}',array['科幻','校园生活'],false)$$,'create article and tags atomically');
select is((select count(*) from public.tags where name in ('科幻','校园生活')),2::bigint,'controlled tags attached');
select throws_ok($$select public.save_article(null,null,'Unknown category','','{"schema_version":1,"blocks":[]}',array['arbitrary-tag'],false)$$,'23514','CONTENT_INVALID_TAGS','uncontrolled tag rejected');
select throws_ok($$select public.save_event(null,null,'Incomplete','','','','','[{"title":"Opening","label":"Day 1"}]',true)$$,'23514','CONTENT_INVALID_EVENT_DETAILS','publication requires summary and time range');
select lives_ok($$select public.save_event(null,null,'Complete','Event summary','2026','','','[{"title":"Opening","label":"Day 1"}]',true)$$,'complete archive publishes');
select throws_ok($$select public.save_article(null,null,'Invalid','','{"schema_version":2,"blocks":[]}',array[]::text[],false)$$,'23514','CONTENT_INVALID_BODY','unknown body version rejected');
select throws_ok($$select public.save_article(null,null,'Invalid','','{"schema_version":1,"blocks":[{"type":"script","text":"x"}]}',array[]::text[],false)$$,'23514','CONTENT_INVALID_BODY','unknown block rejected');
select throws_ok($$select public.save_article(null,null,'Invalid','','{"schema_version":1,"blocks":[]}',array['a','b','c','d'],false)$$,'23514','CONTENT_INVALID_TAGS','max three tags');
select throws_ok($$select public.save_article(null,null,'Empty','','{"schema_version":1,"blocks":[]}',array[]::text[],true)$$,'23514','CONTENT_INVALID_BODY','cannot publish empty body');
select throws_ok($$select public.save_article('00000000-0000-4000-8000-000000000401',0,'Stale','','{"schema_version":1,"blocks":[]}',array[]::text[],false)$$,'40001','CONTENT_VERSION_CONFLICT','stale write rejected');
select lives_ok($$select public.save_article('00000000-0000-4000-8000-000000000401',1,'Published','','{"schema_version":1,"blocks":[{"type":"entity","entity_type":"event","entity_id":"00000000-0000-4000-8000-000000000501","label":"Archive"}]}',array['历史'],true)$$,'publication synchronizes real event reference');
select is((select version from public.articles where id='00000000-0000-4000-8000-000000000401'),2::bigint,'version advances');
select is((select count(*) from public.article_entity_links where article_id='00000000-0000-4000-8000-000000000401'),1::bigint,'explicit reference stored');
select throws_ok($$select public.save_article('00000000-0000-4000-8000-000000000401',2,'Bad update','','{"schema_version":1,"blocks":[{"type":"entity","entity_type":"event","entity_id":"00000000-0000-4000-8000-000000000502","label":"Private"}]}',array['随笔'],false)$$,'23514','CONTENT_INVALID_ENTITY','cannot link private archive');
select is((select title from public.articles where id='00000000-0000-4000-8000-000000000401'),'Published','failed reference rolls back whole save');
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000042';
select throws_ok($$select public.save_article('00000000-0000-4000-8000-000000000401',2,'Hijack','','{"schema_version":1,"blocks":[]}',array[]::text[],false)$$,'42501','CONTENT_FORBIDDEN','other creator cannot change article');
select throws_ok($$select public.save_event('00000000-0000-4000-8000-000000000501',1,'Hijack','Summary','2026','','','[]',false)$$,'42501','CONTENT_FORBIDDEN','other creator cannot change main archive');
select lives_ok($$select public.save_event_supplement(null,null,'00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000511','Witness','testimony','{"schema_version":1,"blocks":[{"type":"paragraph","text":"I was there"}]}',true)$$,'another creator can publish own supplement');
select throws_ok($$select public.save_event_supplement(null,null,'00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000512','Wrong node','testimony','{"schema_version":1,"blocks":[]}',false)$$,'23503',null,'cross-archive node prevented by composite FK');
select throws_ok($$select public.save_event_supplement(null,null,'00000000-0000-4000-8000-000000000502',null,'Private','testimony','{"schema_version":1,"blocks":[]}',false)$$,'23514','CONTENT_INVALID_EVENT','cannot supplement draft archive');
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000041';
select throws_ok($$select public.save_event_supplement((select id from public.event_supplements where event_id='00000000-0000-4000-8000-000000000501'),1,'00000000-0000-4000-8000-000000000501',null,'Hijack','testimony','{"schema_version":1,"blocks":[]}',false)$$,'42501','CONTENT_FORBIDDEN','archive maintainer cannot change someone else supplement');
select throws_ok($$select public.save_event('00000000-0000-4000-8000-000000000501',1,'Archive','Summary','2026','','','[]',false)$$,'23514','CONTENT_INVALID_NODES','published archive requires timeline nodes');
select lives_ok($$select public.save_event('00000000-0000-4000-8000-000000000501',1,'Updated archive','Summary','2026','','','[{"id":"00000000-0000-4000-8000-000000000511","label":"Day 1","title":"Updated opening","description":"Confirmed"}]',false)$$,'published archive remains maintainable with stable node ID');
select throws_ok($$select public.save_event('00000000-0000-4000-8000-000000000501',2,'Archive','Summary','2026','','','[{"title":"Replacement node","label":"Day 2"}]',false)$$,'23514','CONTENT_NODE_HAS_SUPPLEMENTS','cannot replace a node carrying another creator supplement');
select is((select status from public.events where id='00000000-0000-4000-8000-000000000501'),'published','save does not unpublish archive');
select is((select version from public.events where id='00000000-0000-4000-8000-000000000501'),2::bigint,'archive version advanced');
reset role;
update public.events set status='hidden' where id='00000000-0000-4000-8000-000000000501';
set local role anon;
select is((select count(*) from public.event_supplements where event_id='00000000-0000-4000-8000-000000000501'),0::bigint,'hidden archive hides published supplements');
select * from finish();
rollback;


