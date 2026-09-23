begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

-- These users exist only inside this rolled-back test transaction. Inserting
-- through auth.users exercises the same profile trigger as a real signup.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000a1', 'm1-a@example.test', '{"handle":"test_author","display_name":"Author A"}'::jsonb),
  ('00000000-0000-4000-8000-0000000000b2', 'm1-b@example.test', '{"handle":"test_author","display_name":"Author B"}'::jsonb);

select is((select count(*) from public.profiles where id in (
  '00000000-0000-4000-8000-0000000000a1',
  '00000000-0000-4000-8000-0000000000b2'
)), 2::bigint, 'signup trigger creates one profile per Auth user');

select is((select handle from public.profiles where id = '00000000-0000-4000-8000-0000000000a1'),
  'test_author', 'first requested handle is retained');

select ok((select handle <> 'test_author' and handle ~ '^test_author_[a-f0-9]{8}$'
  from public.profiles where id = '00000000-0000-4000-8000-0000000000b2'),
  'duplicate requested handle gets a stable unique suffix');

select ok(not has_table_privilege('anon', 'public.profiles', 'INSERT'),
  'anonymous role has no direct Profile insert grant');
select ok(not has_table_privilege('anon', 'public.profiles', 'UPDATE'),
  'anonymous role has no direct Profile update grant');
select ok(not has_table_privilege('anon', 'public.profiles', 'DELETE'),
  'anonymous role has no direct Profile delete grant');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'DELETE'),
  'authenticated role cannot directly delete a Profile');

set local role anon;
select is((select count(*) from public.profiles where id in (
  '00000000-0000-4000-8000-0000000000a1',
  '00000000-0000-4000-8000-0000000000b2'
)), 2::bigint, 'anonymous readers can see public Creator profiles');

select throws_ok(
  $$update public.profiles set bio = 'forbidden' where id = '00000000-0000-4000-8000-0000000000a1'$$,
  '42501', null, 'anonymous readers cannot update a profile'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000a1';

select lives_ok(
  $$update public.profiles set bio = 'owned' where id = '00000000-0000-4000-8000-0000000000a1'$$,
  'Creator can update their own profile'
);

select lives_ok(
  $$update public.profiles set bio = 'stolen' where id = '00000000-0000-4000-8000-0000000000b2'$$,
  'cross-user update is filtered by RLS'
);

select is((select bio from public.profiles where id = '00000000-0000-4000-8000-0000000000b2'),
  null, 'cross-user update left the other profile unchanged');

select * from finish();
rollback;
