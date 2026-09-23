begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(19);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000c3', 'm2-a@example.test', '{"handle":"wiki_author_a"}'::jsonb),
  ('00000000-0000-4000-8000-0000000000d4', 'm2-b@example.test', '{"handle":"wiki_author_b"}'::jsonb);

select ok(not has_table_privilege('authenticated', 'public.students', 'INSERT'),
  'authenticated role has no direct Student insert grant');
select ok(not has_table_privilege('anon', 'public.students', 'INSERT'),
  'anonymous role has no direct Student insert grant');
select ok(not has_table_privilege('authenticated', 'public.wiki_revisions', 'INSERT'),
  'authenticated role has no direct Revision insert grant');
select ok(not has_function_privilege('anon',
  'public.create_wiki_entity(text,text,text,text,uuid,text)', 'EXECUTE'),
  'anonymous role cannot execute Wiki creation RPC');

set local role anon;
select throws_ok(
  $$select public.create_wiki_entity('college', 'm2-denied', 'Denied')$$,
  '42501', null, 'anonymous Wiki creation is denied'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000c3';

select lives_ok(
  $$select public.create_wiki_entity('college', 'm2-college', '学院甲')$$,
  'Creator can create a College through the RPC'
);
select lives_ok(
  $$select public.create_wiki_entity('student', 'm2-student', '学生甲', '初始简介',
    (select id from public.colleges where slug = 'm2-college'), '初始签名')$$,
  'Creator can create a Student linked to a College'
);
select lives_ok(
  $$select public.create_wiki_entity('place', 'm2-place', '地点甲', null,
    (select id from public.colleges where slug = 'm2-college'))$$,
  'Creator can create a Place linked to a College'
);

select is((select count(*) from public.wiki_revisions where entity_id in (
  select id from public.students where slug = 'm2-student'
  union all select id from public.colleges where slug = 'm2-college'
  union all select id from public.places where slug = 'm2-place'
)), 3::bigint, 'each Wiki creation wrote an initial Revision');

select throws_ok(
  $$insert into public.students (slug, name, created_by)
    values ('m2-direct', 'Direct', '00000000-0000-4000-8000-0000000000c3')$$,
  '42501', null, 'Creator cannot bypass the revision RPC with a direct insert'
);

select lives_ok(
  $$select public.apply_wiki_revision('student',
    (select id from public.students where slug = 'm2-student'), 1,
    '{"name":"学生甲修订"}'::jsonb, '更正名称')$$,
  'first edit advances the Student revision chain'
);

set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000d4';
select lives_ok(
  $$select public.apply_wiki_revision('student',
    (select id from public.students where slug = 'm2-student'), 2,
    '{"summary":"另一位 Creator 的补充"}'::jsonb, '补充简介')$$,
  'another Creator can contribute to the shared Wiki'
);

select throws_ok(
  $$select public.apply_wiki_revision('student',
    (select id from public.students where slug = 'm2-student'), 1,
    '{"name":"过期覆盖"}'::jsonb, '过期编辑')$$,
  '40001', 'WIKI_VERSION_CONFLICT', 'stale version cannot overwrite a newer edit'
);

select throws_ok(
  $$select public.apply_wiki_revision('student',
    (select id from public.students where slug = 'm2-student'), 3,
    '{"slug":"changed"}'::jsonb, '非法字段')$$,
  '23514', 'WIKI_PATCH_HAS_UNSUPPORTED_FIELDS', 'stable slug cannot be edited through a patch'
);

select is((select count(*) from public.wiki_revisions where entity_type = 'student'
  and entity_id = (select id from public.students where slug = 'm2-student')),
  3::bigint, 'rejected edits create no Revision');

select lives_ok(
  $$select public.rollback_wiki_revision(
    (select id from public.wiki_revisions where entity_type = 'student'
      and entity_id = (select id from public.students where slug = 'm2-student')
      and snapshot ->> 'version' = '1'), 3, '恢复初版')$$,
  'rollback creates a new Revision from a historical snapshot'
);

select is((select name from public.students where slug = 'm2-student'),
  '学生甲', 'rollback restored the original Student name');
select is((select version from public.students where slug = 'm2-student'),
  4::bigint, 'rollback advanced rather than rewound the version');
select is((select count(*) from public.wiki_revisions where entity_type = 'student'
  and entity_id = (select id from public.students where slug = 'm2-student')),
  4::bigint, 'rollback retained history and appended one Revision');

select * from finish();
rollback;
