-- KTU Co-Creation Platform: M0/M1 identity and wiki foundations.
-- Binary media is intentionally excluded; Cloudflare R2 belongs to a later milestone.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,32}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_key text,
  bio text check (bio is null or char_length(bio) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.colleges (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,64}$'),
  name text not null check (char_length(name) between 1 and 100),
  summary text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,64}$'),
  name text not null check (char_length(name) between 1 and 100),
  college_id uuid references public.colleges(id) on delete set null,
  summary text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,64}$'),
  name text not null check (char_length(name) between 1 and 100),
  college_id uuid references public.colleges(id) on delete set null,
  signature text check (signature is null or char_length(signature) <= 280),
  summary text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.forum_accounts (
  id uuid primary key default extensions.gen_random_uuid(),
  handle text not null unique check (handle ~ '^[A-Za-z0-9_]{2,32}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_key text,
  signature text check (signature is null or char_length(signature) <= 280),
  student_id uuid references public.students(id) on delete set null,
  account_type text not null default 'unknown'
    check (account_type in ('student', 'unknown', 'organization', 'bot')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_accounts_require_student check (
    account_type <> 'student' or student_id is not null
  )
);

create table public.wiki_revisions (
  id uuid primary key default extensions.gen_random_uuid(),
  entity_type text not null check (entity_type in ('student', 'college', 'place')),
  entity_id uuid not null,
  editor_id uuid not null references public.profiles(id) on delete restrict,
  summary text not null default '' check (char_length(summary) <= 280),
  source_work_id uuid,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.validate_wiki_revision_entity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.entity_type = 'student' and not exists (
    select 1 from public.students where id = new.entity_id
  ) then
    raise foreign_key_violation using message = 'Student wiki entity does not exist';
  elsif new.entity_type = 'college' and not exists (
    select 1 from public.colleges where id = new.entity_id
  ) then
    raise foreign_key_violation using message = 'College wiki entity does not exist';
  elsif new.entity_type = 'place' and not exists (
    select 1 from public.places where id = new.entity_id
  ) then
    raise foreign_key_violation using message = 'Place wiki entity does not exist';
  end if;
  return new;
end;
$$;

create index colleges_created_by_idx on public.colleges(created_by);
create index places_college_id_idx on public.places(college_id);
create index places_created_by_idx on public.places(created_by);
create index students_college_id_idx on public.students(college_id);
create index students_created_by_idx on public.students(created_by);
create index forum_accounts_student_id_idx on public.forum_accounts(student_id);
create index forum_accounts_created_by_idx on public.forum_accounts(created_by);
create index wiki_revisions_entity_idx on public.wiki_revisions(entity_type, entity_id, created_at desc);
create index wiki_revisions_editor_idx on public.wiki_revisions(editor_id);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger colleges_set_updated_at before update on public.colleges
for each row execute function public.set_updated_at();
create trigger places_set_updated_at before update on public.places
for each row execute function public.set_updated_at();
create trigger students_set_updated_at before update on public.students
for each row execute function public.set_updated_at();
create trigger forum_accounts_set_updated_at before update on public.forum_accounts
for each row execute function public.set_updated_at();
create trigger wiki_revisions_validate_entity before insert on public.wiki_revisions
for each row execute function public.validate_wiki_revision_entity();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_handle text;
  safe_handle text;
  requested_name text;
begin
  requested_handle := lower(coalesce(new.raw_user_meta_data ->> 'handle', split_part(new.email, '@', 1), 'creator'));
  safe_handle := regexp_replace(requested_handle, '[^a-z0-9_]', '', 'g');
  if char_length(safe_handle) < 3 then
    safe_handle := 'creator_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  safe_handle := left(safe_handle, 32);
  if exists (select 1 from public.profiles where handle = safe_handle) then
    safe_handle := left(safe_handle, 23) || '_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  requested_name := coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'Creator');
  begin
    insert into public.profiles (id, handle, display_name)
    values (new.id, safe_handle, left(requested_name, 60));
  exception when unique_violation then
    safe_handle := left(safe_handle, 23) || '_' || substr(replace(new.id::text, '-', ''), 1, 8);
    insert into public.profiles (id, handle, display_name)
    values (new.id, safe_handle, left(requested_name, 60));
  end;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.colleges enable row level security;
alter table public.places enable row level security;
alter table public.students enable row level security;
alter table public.forum_accounts enable row level security;
alter table public.wiki_revisions enable row level security;

create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users can insert their profile" on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
create policy "users can update their profile" on public.profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "colleges are publicly readable" on public.colleges for select using (true);
create policy "authenticated creators can create colleges" on public.colleges
for insert to authenticated with check ((select auth.uid()) = created_by);

create policy "places are publicly readable" on public.places for select using (true);
create policy "authenticated creators can create places" on public.places
for insert to authenticated with check ((select auth.uid()) = created_by);

create policy "students are publicly readable" on public.students for select using (true);
create policy "authenticated creators can create students" on public.students
for insert to authenticated with check ((select auth.uid()) = created_by);

create policy "forum accounts are publicly readable" on public.forum_accounts for select using (true);
create policy "authenticated creators can create forum accounts" on public.forum_accounts
for insert to authenticated with check ((select auth.uid()) = created_by);
create policy "forum account creators can update their accounts" on public.forum_accounts
for update to authenticated using ((select auth.uid()) = created_by) with check ((select auth.uid()) = created_by);

create policy "wiki revisions are publicly readable" on public.wiki_revisions for select using (true);
create policy "authenticated users can add wiki revisions" on public.wiki_revisions
for insert to authenticated with check ((select auth.uid()) = editor_id);

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.colleges, public.places, public.students, public.forum_accounts, public.wiki_revisions to anon;
grant select, insert, update on public.profiles, public.forum_accounts to authenticated;
grant select, insert on public.colleges, public.places, public.students to authenticated;
grant select, insert on public.wiki_revisions to authenticated;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.validate_wiki_revision_entity() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
