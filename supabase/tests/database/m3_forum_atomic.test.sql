begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(20);
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000007001','forum-atomic-a@example.test','{"handle":"forum_atomic_a"}'),
 ('00000000-0000-4000-8000-000000007002','forum-atomic-b@example.test','{"handle":"forum_atomic_b"}');
insert into public.forum_accounts(id,handle,display_name,created_by) values('00000000-0000-4000-8000-000000007010','AtomicAccount','测试身份','00000000-0000-4000-8000-000000007001');
insert into public.students(id,slug,name,created_by) values('00000000-0000-4000-8000-000000007020','atomic-student','人物','00000000-0000-4000-8000-000000007001');
insert into public.places(id,slug,name,created_by) values('00000000-0000-4000-8000-000000007030','atomic-place','地点','00000000-0000-4000-8000-000000007001');
insert into public.forum_topics(id,creator_id,title,board) values('00000000-0000-4000-8000-000000007040','00000000-0000-4000-8000-000000007001','原始标题','campus');
create function pg_temp.save_forum(p_title text,p_links jsonb,p_publish boolean default false,p_version bigint default null,p_tags text[] default array['原标签']) returns bigint language sql as $$
 select public.save_forum_draft('00000000-0000-4000-8000-000000007040',coalesce(p_version,(select version from public.forum_topics where id='00000000-0000-4000-8000-000000007040')),p_title,'campus','[{"forum_account_id":"00000000-0000-4000-8000-000000007010","body":"保存正文"}]',p_tags,p_links,p_publish)
$$;
select ok(not has_table_privilege('authenticated','public.forum_topic_entity_links','INSERT'),'links only mutate through atomic RPC');
select ok(not has_function_privilege('anon','public.save_forum_draft(uuid,bigint,text,text,jsonb,text[],jsonb,boolean)','EXECUTE'),'anonymous cannot save');
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000007001';
select lives_ok($$select pg_temp.save_forum('完整草稿','[{"entity_type":"student","entity_id":"00000000-0000-4000-8000-000000007020"},{"entity_type":"place","entity_id":"00000000-0000-4000-8000-000000007030"}]')$$,'saves title floors tags and links together');
select is((select title from public.forum_topics where id='00000000-0000-4000-8000-000000007040'),'完整草稿','title saved');
select is((select count(*)::int from public.forum_topic_entity_links where topic_id='00000000-0000-4000-8000-000000007040'),2,'two real FK entity links saved');
select ok((select version>1 from public.forum_topics where id='00000000-0000-4000-8000-000000007040'),'revision advances');
select throws_ok($$select pg_temp.save_forum('过期覆盖','[]',false,1)$$,'P0001','FORUM_VERSION_CONFLICT','stale save rejected');
select throws_ok($$select pg_temp.save_forum('不应保存','[{"entity_type":"place","entity_id":"00000000-0000-4000-8000-000000007099"}]')$$,'23514','FORUM_LINKS_INVALID','missing reference rejected after prior operations');
select is((select title from public.forum_topics where id='00000000-0000-4000-8000-000000007040'),'完整草稿','invalid reference rolls back title');
select is((select count(*)::int from public.forum_topic_entity_links where topic_id='00000000-0000-4000-8000-000000007040'),2,'invalid reference restores old links');
select throws_ok($$select pg_temp.save_forum('无效标签','[]',false,null,array['#无效'])$$,'23514','FORUM_HASHTAG_INVALID','invalid tag rejected');
select is((select count(*)::int from public.forum_messages where topic_id='00000000-0000-4000-8000-000000007040'),1,'late tag error preserves complete floors');
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000007002';
select is((select count(*)::int from public.forum_topic_entity_links where topic_id='00000000-0000-4000-8000-000000007040'),0,'other author cannot read draft links');
select throws_ok($$select pg_temp.save_forum('越权','[]')$$,'42501','FORUM_TOPIC_NOT_OWNED','other author cannot save');
set local role anon;
select is((select count(*)::int from public.forum_topic_entity_links where topic_id='00000000-0000-4000-8000-000000007040'),0,'anonymous cannot read draft links');
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000007001';
select lives_ok($$select pg_temp.save_forum('完整发布','[{"entity_type":"place","entity_id":"00000000-0000-4000-8000-000000007030"}]',true)$$,'publish commits only complete aggregate within rollback fixture');
select is((select status from public.forum_topics where id='00000000-0000-4000-8000-000000007040'),'published','published after atomic save');
select throws_ok($$select pg_temp.save_forum('修改历史','[]')$$,'23514','FORUM_TOPIC_NOT_DRAFT','published aggregate frozen');
set local role anon;
select is((select count(*)::int from public.forum_topic_entity_links where topic_id='00000000-0000-4000-8000-000000007040'),1,'published references public');
reset role;
update public.forum_topics set status='hidden' where id='00000000-0000-4000-8000-000000007040';
set local role anon;
select is((select count(*)::int from public.forum_topic_entity_links where topic_id='00000000-0000-4000-8000-000000007040'),0,'hidden parent closes references');
reset role;
select * from finish();
rollback;
