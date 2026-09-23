begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(51);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000f1', 'm3-a@example.test', '{"handle":"forum_author_a"}'::jsonb),
  ('00000000-0000-4000-8000-0000000000f2', 'm3-b@example.test', '{"handle":"forum_author_b"}'::jsonb);
insert into public.forum_accounts (id, handle, display_name, created_by) values
  ('00000000-0000-4000-8000-000000000a01', 'M3AuthorA', 'A 一号', '00000000-0000-4000-8000-0000000000f1'),
  ('00000000-0000-4000-8000-000000000a02', 'M3AuthorA2', 'A 二号', '00000000-0000-4000-8000-0000000000f1'),
  ('00000000-0000-4000-8000-000000000b01', 'M3AuthorB', 'B 一号', '00000000-0000-4000-8000-0000000000f2');

select ok(has_table_privilege('anon', 'public.forum_topics', 'SELECT'),
  'anonymous role has SELECT grant for published topics');
select ok(not has_table_privilege('anon', 'public.forum_topics', 'INSERT'),
  'anonymous role cannot create topics');
select ok(not has_table_privilege('anon', 'public.forum_messages', 'INSERT'),
  'anonymous role cannot add in-world messages');
select ok(not has_table_privilege('authenticated', 'public.forum_topics', 'DELETE'),
  'Creator cannot remove published work by direct DELETE');
select ok(not has_table_privilege('authenticated', 'public.hashtags', 'UPDATE'),
  'free tags cannot be renamed through direct UPDATE');
select ok(not has_function_privilege('anon', 'public.replace_forum_draft_hashtags(uuid,text[])', 'EXECUTE'),
  'anonymous role cannot invoke tag replacement RPC');
select ok(not has_function_privilege('anon', 'public.publish_forum_topic(uuid)', 'EXECUTE'),
  'anonymous role cannot invoke publish RPC');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000f1';

insert into public.forum_topics (id, creator_id, title, board) values
  ('00000000-0000-4000-8000-000000000c01', '00000000-0000-4000-8000-0000000000f1', '北区夜话', 'campus'),
  ('00000000-0000-4000-8000-000000000c02', '00000000-0000-4000-8000-0000000000f1', '空话题', 'campus'),
  ('00000000-0000-4000-8000-000000000c03', '00000000-0000-4000-8000-0000000000f1', '缺楼', 'campus'),
  ('00000000-0000-4000-8000-000000000c05', '00000000-0000-4000-8000-0000000000f1', '引用源', 'campus');

select throws_ok(
  $$insert into public.forum_topics (creator_id, title, board, status, published_at)
    values ('00000000-0000-4000-8000-0000000000f1', '绕过发布', 'campus', 'published', now())$$,
  '42501', null, 'Creator cannot insert a published topic directly'
);
select throws_ok(
  $$insert into public.forum_topics (creator_id, title, board)
    values ('00000000-0000-4000-8000-0000000000f2', '冒名', 'campus')$$,
  '42501', null, 'Creator cannot claim another Creator identity'
);

select lives_ok(
  $$insert into public.forum_messages (id, topic_id, forum_account_id, floor_no, body)
    values ('00000000-0000-4000-8000-000000000d01',
    '00000000-0000-4000-8000-000000000c01',
    '00000000-0000-4000-8000-000000000a01', 1, '听说北区停电了。')$$,
  'Creator may add a first floor with their own Forum Account'
);
select throws_ok(
  $$insert into public.forum_messages (topic_id, forum_account_id, floor_no, body)
    values ('00000000-0000-4000-8000-000000000c01',
    '00000000-0000-4000-8000-000000000b01', 2, '借用别人账号')$$,
  '23514', 'FORUM_ACCOUNT_NOT_OWNED', 'a Topic cannot speak through another Creator Forum Account'
);
select throws_ok(
  $$insert into public.forum_messages (topic_id, forum_account_id, floor_no, body)
    values ('00000000-0000-4000-8000-000000000c01',
    '00000000-0000-4000-8000-000000000a02', 1, '重复一楼')$$,
  '23505', null, 'floor numbers are unique inside one Topic'
);
select lives_ok(
  $$insert into public.forum_messages (id, topic_id, forum_account_id, floor_no, body)
    values ('00000000-0000-4000-8000-000000000d05',
    '00000000-0000-4000-8000-000000000c05',
    '00000000-0000-4000-8000-000000000a01', 1, '别的话题')$$,
  'another Topic may also have a first floor'
);
select throws_ok(
  $$insert into public.forum_messages (topic_id, forum_account_id, floor_no, body, reply_to_message_id)
    values ('00000000-0000-4000-8000-000000000c01',
    '00000000-0000-4000-8000-000000000a02', 2, '跨话题引用',
    '00000000-0000-4000-8000-000000000d05')$$,
  '23514', 'FORUM_REPLY_INVALID', 'a floor cannot reply to another Topic'
);
select lives_ok(
  $$insert into public.forum_messages (id, topic_id, forum_account_id, floor_no, body, reply_to_message_id)
    values ('00000000-0000-4000-8000-000000000d02',
    '00000000-0000-4000-8000-000000000c01',
    '00000000-0000-4000-8000-000000000a02', 2, '看见维修队了。',
    '00000000-0000-4000-8000-000000000d01')$$,
  'Creator may write a later floor replying to an earlier floor'
);

select throws_ok(
  $$select public.publish_forum_topic('00000000-0000-4000-8000-000000000c02')$$,
  '23514', 'FORUM_TOPIC_EMPTY', 'empty Topic cannot publish'
);
insert into public.forum_messages (topic_id, forum_account_id, floor_no, body)
values ('00000000-0000-4000-8000-000000000c03',
  '00000000-0000-4000-8000-000000000a01', 2, '只有二楼');
select throws_ok(
  $$select public.publish_forum_topic('00000000-0000-4000-8000-000000000c03')$$,
  '23514', 'FORUM_FLOOR_SEQUENCE_INVALID', 'Topic with a floor gap cannot publish'
);

insert into public.hashtags (name) values ('校园 怪谈');
select is((select normalized_name from public.hashtags where name = '校园 怪谈'),
  '校园 怪谈', 'hashtag stores a normalized lookup key');
select throws_ok(
  $$insert into public.hashtags (name) values (' 校园   怪谈 ')$$,
  '23505', null, 'spacing variants of a hashtag are unique'
);
insert into public.forum_topic_hashtags (topic_id, hashtag_id)
select '00000000-0000-4000-8000-000000000c01', id
from public.hashtags where normalized_name = '校园 怪谈';

-- Complete draft replacement is atomic, and array order defines floor numbers.
select lives_ok(
  $$select public.replace_forum_draft_messages(
    '00000000-0000-4000-8000-000000000c01',
    '[{"forum_account_id":"00000000-0000-4000-8000-000000000a02","body":"替换后的一楼"},
      {"forum_account_id":"00000000-0000-4000-8000-000000000a01","body":"替换后的二楼","reply_to_floor_no":1}]'::jsonb)$$,
  'owner atomically replaces all draft floors'
);
select is((select string_agg(floor_no::text, ',' order by floor_no)
  from public.forum_messages where topic_id = '00000000-0000-4000-8000-000000000c01'),
  '1,2', 'array order defines contiguous floor numbers');
select ok((select second.reply_to_message_id = first.id
  from public.forum_messages first join public.forum_messages second
    on second.topic_id = first.topic_id
  where first.topic_id = '00000000-0000-4000-8000-000000000c01'
    and first.floor_no = 1 and second.floor_no = 2),
  'reply_to_floor_no points to the new earlier floor');
select throws_ok(
  $$select public.replace_forum_draft_messages(
    '00000000-0000-4000-8000-000000000c01',
    '[{"forum_account_id":"00000000-0000-4000-8000-000000000b01","body":"越权账号"}]'::jsonb)$$,
  '23514', 'FORUM_ACCOUNT_NOT_OWNED', 'replacement rejects another Creator account'
);
select throws_ok(
  $$select public.replace_forum_draft_messages(
    '00000000-0000-4000-8000-000000000c01',
    '[{"forum_account_id":"00000000-0000-4000-8000-000000000a01","body":"引用未来","reply_to_floor_no":2},
      {"forum_account_id":"00000000-0000-4000-8000-000000000a02","body":"未来楼层"}]'::jsonb)$$,
  '23514', 'FORUM_REPLY_INVALID', 'replacement rejects forward floor references'
);
select is((select body from public.forum_messages
  where topic_id = '00000000-0000-4000-8000-000000000c01' and floor_no = 1),
  '替换后的一楼', 'invalid replacement rolls back the delete');
select lives_ok(
  $$select public.replace_forum_draft_hashtags(
    '00000000-0000-4000-8000-000000000c01',
    array['校园 怪谈', ' 校园   怪谈 ', '停电'])$$,
  'Creator replaces draft Topic tags and deduplicates normalized names'
);
select is((select count(*) from public.forum_topic_hashtags
  where topic_id = '00000000-0000-4000-8000-000000000c01'),
  2::bigint, 'Topic now has two unique tags');
select throws_ok(
  $$select public.replace_forum_draft_hashtags(
    '00000000-0000-4000-8000-000000000c01',
    array['合法', '#无效'])$$,
  '23514', 'FORUM_HASHTAG_INVALID', 'invalid tag rejects the entire replacement'
);
select is((select count(*) from public.forum_topic_hashtags
  where topic_id = '00000000-0000-4000-8000-000000000c01'),
  2::bigint, 'failed tag replacement leaves associations intact');
set local role anon;
select is((select count(*) from public.forum_topics), 0::bigint,
  'anonymous readers see no draft Topic');
select is((select count(*) from public.forum_messages), 0::bigint,
  'anonymous readers see no draft floors');
select is((select count(*) from public.forum_topic_hashtags), 0::bigint,
  'anonymous readers see no draft-tag association');
select is((select count(*) from public.hashtags), 2::bigint,
  'hashtag vocabulary itself is publicly readable');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000f2';
insert into public.forum_topics (id, creator_id, title, board)
values ('00000000-0000-4000-8000-000000000c04',
  '00000000-0000-4000-8000-0000000000f2', 'B 的草稿', 'campus');
select is((select count(*) from public.forum_topics), 1::bigint,
  'Creator B sees only their own draft before publication');
select is((select count(*) from public.forum_messages), 0::bigint,
  'Creator B cannot see A draft floors');
select throws_ok(
  $$select public.replace_forum_draft_hashtags(
    '00000000-0000-4000-8000-000000000c01', array['越权'])$$,
  '42501', 'FORUM_TOPIC_NOT_OWNED', 'Creator B cannot replace A draft tags'
);select throws_ok(
  $$select public.replace_forum_draft_messages(
    '00000000-0000-4000-8000-000000000c01', '[]'::jsonb)$$,
  '42501', 'FORUM_TOPIC_NOT_OWNED', 'Creator B cannot replace A draft'
);select throws_ok(
  $$select public.publish_forum_topic('00000000-0000-4000-8000-000000000c01')$$,
  '42501', 'FORUM_TOPIC_NOT_OWNED', 'Creator B cannot publish A Topic'
);
select throws_ok(
  $$insert into public.forum_messages (topic_id, forum_account_id, floor_no, body)
    values ('00000000-0000-4000-8000-000000000c01',
    '00000000-0000-4000-8000-000000000b01', 3, '混入楼层')$$,
  '23514', 'FORUM_TOPIC_NOT_DRAFT', 'Creator B cannot insert into A draft'
);

set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000f1';
select lives_ok(
  $$select public.publish_forum_topic('00000000-0000-4000-8000-000000000c01')$$,
  'owner can publish a complete Topic transactionally'
);
select ok((select published_at is not null from public.forum_topics
  where id = '00000000-0000-4000-8000-000000000c01'),
  'publication records its timestamp');
select throws_ok(
  $$select public.publish_forum_topic('00000000-0000-4000-8000-000000000c01')$$,
  '23514', 'FORUM_TOPIC_NOT_DRAFT', 'published Topic cannot publish twice'
);
select throws_ok(
  $$insert into public.forum_messages (topic_id, forum_account_id, floor_no, body)
    values ('00000000-0000-4000-8000-000000000c01',
    '00000000-0000-4000-8000-000000000a01', 3, '发布后插楼')$$,
  '23514', 'FORUM_TOPIC_NOT_DRAFT', 'published Topic cannot gain another floor'
);
update public.forum_topics set title = '静默篡改' where id = '00000000-0000-4000-8000-000000000c01';
select is((select title from public.forum_topics
  where id = '00000000-0000-4000-8000-000000000c01'),
  '北区夜话', 'published Topic cannot be silently rewritten');
update public.forum_messages set body = '静默篡改'
where topic_id = '00000000-0000-4000-8000-000000000c01' and floor_no = 1;
select is((select body from public.forum_messages
  where topic_id = '00000000-0000-4000-8000-000000000c01' and floor_no = 1),
  '替换后的一楼', 'published floor cannot be silently rewritten');

select throws_ok(
  $$select public.replace_forum_draft_hashtags(
    '00000000-0000-4000-8000-000000000c01', array['发布后修改'])$$,
  '23514', 'FORUM_TOPIC_NOT_DRAFT', 'published Topic tags are frozen'
);set local role anon;
select is((select count(*) from public.forum_topics), 1::bigint,
  'anonymous readers see only the published Topic');
select is((select count(*) from public.forum_messages), 2::bigint,
  'anonymous readers see exactly its two published floors');
select is((select count(*) from public.forum_topic_hashtags), 2::bigint,
  'published Topic hashtags are visible to readers');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000f2';
select is((select count(*) from public.forum_topics), 2::bigint,
  'Creator B sees their draft and A published Topic');
select is((select count(*) from public.forum_messages), 2::bigint,
  'Creator B sees A published floors but still no A drafts');

select * from finish();
rollback;
