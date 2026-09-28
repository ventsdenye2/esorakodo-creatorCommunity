begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,email,raw_user_meta_data) values
('00000000-0000-4000-8000-000000000081','preview-author@example.test','{"handle":"preview_author","display_name":"Preview Author"}'),
('00000000-0000-4000-8000-000000000082','preview-reader@example.test','{"handle":"preview_reader"}'),
('00000000-0000-4000-8000-000000000083','preview-moderator@example.test','{"handle":"preview_moderator"}');
insert into public.moderators(creator_id) values('00000000-0000-4000-8000-000000000083');
insert into public.articles(id,creator_id,title,summary,body,status) values
('00000000-0000-4000-8000-000000000801','00000000-0000-4000-8000-000000000081','Hidden article','Article summary',jsonb_build_object('schema_version',1,'blocks',(select jsonb_agg(jsonb_build_object('type','paragraph','text',repeat('Text ',500))) from generate_series(1,10))),'hidden'),
('00000000-0000-4000-8000-000000000802','00000000-0000-4000-8000-000000000081','Private draft','','{"schema_version":1,"blocks":[{"type":"paragraph","text":"Private draft text"}]}','draft');
insert into public.events(id,creator_id,title,summary,time_range,causes,status) values
('00000000-0000-4000-8000-000000000803','00000000-0000-4000-8000-000000000081','Hidden event','Event summary','Autumn','Event background','hidden');
insert into public.event_supplements(id,event_id,creator_id,title,kind,body,status) values
('00000000-0000-4000-8000-000000000804','00000000-0000-4000-8000-000000000803','00000000-0000-4000-8000-000000000081','Parent hidden supplement','rumor','{"schema_version":1,"blocks":[{"type":"heading","text":"Supplement heading"},{"type":"paragraph","text":"Supplement excerpt"},{"type":"quote","text":"Quoted testimony"}]}','published');
insert into public.forum_accounts(id,created_by,handle,display_name) values('00000000-0000-4000-8000-000000000805','00000000-0000-4000-8000-000000000081','preview_forum','Forum identity');
insert into public.forum_topics(id,creator_id,title,board,status) values('00000000-0000-4000-8000-000000000806','00000000-0000-4000-8000-000000000081','Hidden forum','campus','draft');
insert into public.forum_messages(topic_id,forum_account_id,floor_no,body) values
('00000000-0000-4000-8000-000000000806','00000000-0000-4000-8000-000000000805',1,'First floor text'),
('00000000-0000-4000-8000-000000000806','00000000-0000-4000-8000-000000000805',2,'Second floor text');
update public.forum_topics set status='hidden',published_at=now() where id='00000000-0000-4000-8000-000000000806';
insert into public.reports(id,reporter_id,article_id,event_id,supplement_id,forum_topic_id,reason) values
('00000000-0000-4000-8000-000000000811','00000000-0000-4000-8000-000000000082','00000000-0000-4000-8000-000000000801',null,null,null,'Review hidden article'),
('00000000-0000-4000-8000-000000000812','00000000-0000-4000-8000-000000000082','00000000-0000-4000-8000-000000000802',null,null,null,'Review private draft'),
('00000000-0000-4000-8000-000000000813','00000000-0000-4000-8000-000000000082',null,'00000000-0000-4000-8000-000000000803',null,null,'Review hidden event'),
('00000000-0000-4000-8000-000000000814','00000000-0000-4000-8000-000000000082',null,null,'00000000-0000-4000-8000-000000000804',null,'Review supplement'),
('00000000-0000-4000-8000-000000000815','00000000-0000-4000-8000-000000000082',null,null,null,'00000000-0000-4000-8000-000000000806','Review hidden forum');
select ok(not has_function_privilege('anon','public.get_report_preview(uuid)','EXECUTE'),'anonymous cannot execute report preview');
select ok(not has_table_privilege('authenticated','public.moderators','INSERT'),'preview does not grant moderator assignment');
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000082';
select throws_ok($$select public.get_report_preview('00000000-0000-4000-8000-000000000811')$$,'42501','MODERATION_FORBIDDEN','reporter cannot preview hidden work');
select throws_ok($$select public.get_report_preview('00000000-0000-4000-8000-000000000812')$$,'42501','MODERATION_FORBIDDEN','reporter cannot preview draft work');
select is((select count(*) from public.articles where id in ('00000000-0000-4000-8000-000000000801','00000000-0000-4000-8000-000000000802')),0::bigint,'ordinary reader still cannot directly read hidden or draft work');
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000081';
select throws_ok($$select public.get_report_preview('00000000-0000-4000-8000-000000000811')$$,'42501','MODERATION_FORBIDDEN','work owner without moderator role cannot use preview RPC');
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000083';
select is(public.get_report_preview('00000000-0000-4000-8000-000000000811')->>'title','Hidden article','moderator reads exact report target');
select is(public.get_report_preview('00000000-0000-4000-8000-000000000811')->>'creator_name','Preview Author','preview returns public creator display name');
select is(char_length(public.get_report_preview('00000000-0000-4000-8000-000000000811')->>'excerpt'),12000,'excerpt has hard length bound');
select is(public.get_report_preview('00000000-0000-4000-8000-000000000811')->>'public_path',null,'hidden target has no public link');
select is(public.get_report_preview('00000000-0000-4000-8000-000000000812')->>'excerpt','Private draft text','moderator can review report-linked draft without public RLS');
select alike(public.get_report_preview('00000000-0000-4000-8000-000000000813')->>'excerpt','%Event summary%Event background%','event excerpt includes summary and background');
select alike(public.get_report_preview('00000000-0000-4000-8000-000000000814')->>'excerpt','%Supplement heading%Supplement excerpt%Quoted testimony%','supplement preview includes plain text blocks in order');
select is(public.get_report_preview('00000000-0000-4000-8000-000000000814')->>'public_path',null,'published supplement with hidden parent has no public link');
select alike(public.get_report_preview('00000000-0000-4000-8000-000000000815')->>'excerpt','%First floor text%Second floor text%','forum floors included in stable floor order');
select is((select count(*) from jsonb_object_keys(public.get_report_preview('00000000-0000-4000-8000-000000000811'))),8::bigint,'preview exposes only eight allowlisted fields');
select throws_ok($$select public.get_report_preview('00000000-0000-4000-8000-000000000801')$$,'P0002','REPORT_NOT_FOUND','work UUID cannot substitute for report UUID');
select is((select count(*) from public.articles where id='00000000-0000-4000-8000-000000000801'),0::bigint,'moderator direct table RLS is not widened');
reset role;
delete from public.moderators where creator_id='00000000-0000-4000-8000-000000000083';
set local role authenticated;
select throws_ok($$select public.get_report_preview('00000000-0000-4000-8000-000000000811')$$,'42501','MODERATION_FORBIDDEN','revoking membership immediately blocks preview');
select * from finish();
rollback;
