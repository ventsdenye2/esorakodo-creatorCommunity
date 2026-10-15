-- Shared encyclopedia: explicit knowledge articles and official baseline reconciliation.
create table public.wiki_articles (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,64}$'),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  summary text check (char_length(summary) <= 4000),
  body text not null default '' check (char_length(body) <= 50000),
  version bigint not null default 1 check (version > 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index wiki_articles_created_by_idx on public.wiki_articles(created_by);
create trigger wiki_articles_set_updated_at before update on public.wiki_articles
for each row execute function public.set_updated_at();
alter table public.wiki_articles enable row level security;
grant select on public.wiki_articles to anon, authenticated;
create policy "wiki articles are publicly readable" on public.wiki_articles for select using (true);
revoke insert, update, delete on public.wiki_articles from anon, authenticated;
alter table public.wiki_revisions drop constraint wiki_revisions_entity_type_check;
alter table public.wiki_revisions add constraint wiki_revisions_entity_type_check check (entity_type in ('student','college','place','article'));
create table public.wiki_official_sources (
  official_id text primary key check (official_id ~ '^[a-z0-9-]{2,64}$'),
  entity_type text not null check (entity_type in ('student','college','place','article')),
  entity_id uuid not null,
  source_hash text not null check (source_hash ~ '^[a-f0-9]{64}$'),
  synced_at timestamptz not null default now(),
  unique (entity_type, entity_id)
);
alter table public.wiki_official_sources enable row level security;
grant select on public.wiki_official_sources to anon, authenticated;
create policy "official source metadata is public" on public.wiki_official_sources for select using (true);
revoke insert, update, delete on public.wiki_official_sources from anon, authenticated;

create or replace function public.validate_wiki_revision_entity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.entity_type = 'article' and not exists (select 1 from public.wiki_articles where id = new.entity_id) then
    raise foreign_key_violation using message = 'Article wiki entity does not exist';
  elsif new.entity_type = 'student' and not exists (
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


create or replace function public.create_wiki_entity_with_body(
  p_entity_type text,
  p_slug text,
  p_name text,
  p_summary text default null,
  p_college_id uuid default null,
  p_signature text default null,
  p_body text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_entity_id uuid;
  v_snapshot jsonb;
begin
  if v_user_id is null then
    raise insufficient_privilege using message = 'AUTH_REQUIRED';
  end if;

  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise foreign_key_violation using message = 'CREATOR_PROFILE_REQUIRED';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 100 then
    raise check_violation using message = 'WIKI_NAME_INVALID';
  end if;

  if p_summary is not null and char_length(btrim(p_summary)) > 4000 then
    raise check_violation using message = 'WIKI_SUMMARY_TOO_LONG';
  end if;

  if p_body is not null and char_length(p_body) > 50000 then
    raise check_violation using message = 'WIKI_BODY_TOO_LONG';
  end if;

  if p_signature is not null and char_length(btrim(p_signature)) > 280 then
    raise check_violation using message = 'WIKI_SIGNATURE_TOO_LONG';
  end if;

  if p_entity_type = 'article' then
    insert into public.wiki_articles (slug, name, summary, body, created_by)
    values (btrim(p_slug), btrim(p_name), nullif(btrim(p_summary), ''), coalesce(p_body, ''), v_user_id)
    returning id into v_entity_id;
    select to_jsonb(entity) into v_snapshot from public.wiki_articles entity where id = v_entity_id;
  elsif p_entity_type = 'student' then
    insert into public.students (
      slug, name, college_id, signature, summary, body, created_by
    ) values (
      btrim(p_slug), btrim(p_name), p_college_id, nullif(btrim(p_signature), ''), nullif(btrim(p_summary), ''), coalesce(p_body, ''), v_user_id
    ) returning id into v_entity_id;

    select to_jsonb(entity) into v_snapshot
    from public.students entity
    where entity.id = v_entity_id;
  elsif p_entity_type = 'college' then
    insert into public.colleges (
      slug, name, summary, body, created_by
    ) values (
      btrim(p_slug), btrim(p_name), nullif(btrim(p_summary), ''), coalesce(p_body, ''), v_user_id
    ) returning id into v_entity_id;

    select to_jsonb(entity) into v_snapshot
    from public.colleges entity
    where entity.id = v_entity_id;
  elsif p_entity_type = 'place' then
    insert into public.places (
      slug, name, college_id, summary, body, created_by
    ) values (
      btrim(p_slug), btrim(p_name), p_college_id, nullif(btrim(p_summary), ''), coalesce(p_body, ''), v_user_id
    ) returning id into v_entity_id;

    select to_jsonb(entity) into v_snapshot
    from public.places entity
    where entity.id = v_entity_id;
  else
    raise check_violation using message = 'UNSUPPORTED_WIKI_ENTITY_TYPE';
  end if;

  insert into public.wiki_revisions (
    entity_type, entity_id, editor_id, summary, snapshot
  ) values (
    p_entity_type, v_entity_id, v_user_id, '创建档案', v_snapshot
  );

  return v_snapshot;
end;
$$;

create or replace function public.apply_wiki_revision(
  p_entity_type text,
  p_entity_id uuid,
  p_expected_version bigint,
  p_patch jsonb,
  p_summary text default '',
  p_source_work_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_version bigint;
  v_snapshot jsonb;
begin
  if v_user_id is null then
    raise insufficient_privilege using message = 'AUTH_REQUIRED';
  end if;

  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise foreign_key_violation using message = 'CREATOR_PROFILE_REQUIRED';
  end if;

  if p_expected_version is null or p_expected_version <= 0 then
    raise check_violation using message = 'WIKI_EXPECTED_VERSION_INVALID';
  end if;

  if p_patch is null or jsonb_typeof(p_patch) <> 'object' or p_patch = '{}'::jsonb then
    raise check_violation using message = 'WIKI_PATCH_MUST_BE_OBJECT';
  end if;

  if btrim(coalesce(p_summary, '')) = '' then
    raise check_violation using message = 'WIKI_SUMMARY_REQUIRED';
  end if;

  if char_length(btrim(p_summary)) > 280 then
    raise check_violation using message = 'WIKI_SUMMARY_TOO_LONG';
  end if;

  if p_entity_type = 'article' then
    if exists (select 1 from jsonb_object_keys(p_patch) as k(key) where k.key not in ('name','summary','body')) then
      raise check_violation using message = 'WIKI_PATCH_HAS_UNSUPPORTED_FIELDS';
    end if;
    select version into v_current_version from public.wiki_articles where id = p_entity_id for update;
    if not found then raise no_data_found using message = 'WIKI_ENTITY_NOT_FOUND'; end if;
    if v_current_version <> p_expected_version then raise serialization_failure using message = 'WIKI_VERSION_CONFLICT'; end if;
    update public.wiki_articles set
      name = case when p_patch ? 'name' then nullif(btrim(p_patch ->> 'name'), '') else name end,
      summary = case when p_patch ? 'summary' then nullif(btrim(p_patch ->> 'summary'), '') else summary end,
      body = case when p_patch ? 'body' then coalesce(p_patch ->> 'body', '') else body end,
      version = version + 1 where id = p_entity_id;
    select to_jsonb(entity) into v_snapshot from public.wiki_articles entity where id = p_entity_id;
  elsif p_entity_type = 'student' then
    if exists (
      select 1 from jsonb_object_keys(p_patch) as patch_key(key)
      where patch_key.key not in ('name', 'college_id', 'signature', 'summary', 'body')
    ) then
      raise check_violation using message = 'WIKI_PATCH_HAS_UNSUPPORTED_FIELDS';
    end if;

    select version into v_current_version
    from public.students
    where id = p_entity_id
    for update;

    if not found then
      raise no_data_found using message = 'WIKI_ENTITY_NOT_FOUND';
    end if;
    if v_current_version <> p_expected_version then
      raise serialization_failure using message = 'WIKI_VERSION_CONFLICT';
    end if;

    update public.students
    set
      name = case when p_patch ? 'name' then nullif(btrim(p_patch ->> 'name'), '') else name end,
      college_id = case when p_patch ? 'college_id' then nullif(p_patch ->> 'college_id', '')::uuid else college_id end,
      signature = case when p_patch ? 'signature' then nullif(btrim(p_patch ->> 'signature'), '') else signature end,
      summary = case when p_patch ? 'summary' then nullif(btrim(p_patch ->> 'summary'), '') else summary end,
      body = case when p_patch ? 'body' then coalesce(p_patch ->> 'body', '') else body end,
      version = version + 1
    where id = p_entity_id;

    select to_jsonb(entity) into v_snapshot
    from public.students entity
    where entity.id = p_entity_id;
  elsif p_entity_type = 'college' then
    if exists (
      select 1 from jsonb_object_keys(p_patch) as patch_key(key)
      where patch_key.key not in ('name', 'summary', 'body')
    ) then
      raise check_violation using message = 'WIKI_PATCH_HAS_UNSUPPORTED_FIELDS';
    end if;

    select version into v_current_version
    from public.colleges
    where id = p_entity_id
    for update;

    if not found then
      raise no_data_found using message = 'WIKI_ENTITY_NOT_FOUND';
    end if;
    if v_current_version <> p_expected_version then
      raise serialization_failure using message = 'WIKI_VERSION_CONFLICT';
    end if;

    update public.colleges
    set
      name = case when p_patch ? 'name' then nullif(btrim(p_patch ->> 'name'), '') else name end,
      summary = case when p_patch ? 'summary' then nullif(btrim(p_patch ->> 'summary'), '') else summary end,
      body = case when p_patch ? 'body' then coalesce(p_patch ->> 'body', '') else body end,
      version = version + 1
    where id = p_entity_id;

    select to_jsonb(entity) into v_snapshot
    from public.colleges entity
    where entity.id = p_entity_id;
  elsif p_entity_type = 'place' then
    if exists (
      select 1 from jsonb_object_keys(p_patch) as patch_key(key)
      where patch_key.key not in ('name', 'college_id', 'summary', 'body')
    ) then
      raise check_violation using message = 'WIKI_PATCH_HAS_UNSUPPORTED_FIELDS';
    end if;

    select version into v_current_version
    from public.places
    where id = p_entity_id
    for update;

    if not found then
      raise no_data_found using message = 'WIKI_ENTITY_NOT_FOUND';
    end if;
    if v_current_version <> p_expected_version then
      raise serialization_failure using message = 'WIKI_VERSION_CONFLICT';
    end if;

    update public.places
    set
      name = case when p_patch ? 'name' then nullif(btrim(p_patch ->> 'name'), '') else name end,
      college_id = case when p_patch ? 'college_id' then nullif(p_patch ->> 'college_id', '')::uuid else college_id end,
      summary = case when p_patch ? 'summary' then nullif(btrim(p_patch ->> 'summary'), '') else summary end,
      body = case when p_patch ? 'body' then coalesce(p_patch ->> 'body', '') else body end,
      version = version + 1
    where id = p_entity_id;

    select to_jsonb(entity) into v_snapshot
    from public.places entity
    where entity.id = p_entity_id;
  else
    raise check_violation using message = 'UNSUPPORTED_WIKI_ENTITY_TYPE';
  end if;

  insert into public.wiki_revisions (
    entity_type, entity_id, editor_id, summary, source_work_id, snapshot
  ) values (
    p_entity_type,
    p_entity_id,
    v_user_id,
    btrim(p_summary),
    p_source_work_id,
    v_snapshot
  );

  return v_snapshot;
end;
$$;

create or replace function public.rollback_wiki_revision(
  p_revision_id uuid,
  p_expected_version bigint,
  p_summary text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revision public.wiki_revisions%rowtype;
  v_patch jsonb;
begin
  select * into v_revision
  from public.wiki_revisions
  where id = p_revision_id;

  if not found then
    raise no_data_found using message = 'WIKI_REVISION_NOT_FOUND';
  end if;

  if v_revision.entity_type = 'student' then
    v_patch := jsonb_build_object(
      'name', v_revision.snapshot -> 'name',
      'college_id', v_revision.snapshot -> 'college_id',
      'signature', v_revision.snapshot -> 'signature',
      'summary', v_revision.snapshot -> 'summary',
      'body', coalesce(v_revision.snapshot ->> 'body', '')
    );
  elsif v_revision.entity_type in ('college', 'article') then
    v_patch := jsonb_build_object(
      'name', v_revision.snapshot -> 'name',
      'summary', v_revision.snapshot -> 'summary',
      'body', coalesce(v_revision.snapshot ->> 'body', '')
    );
  elsif v_revision.entity_type = 'place' then
    v_patch := jsonb_build_object(
      'name', v_revision.snapshot -> 'name',
      'college_id', v_revision.snapshot -> 'college_id',
      'summary', v_revision.snapshot -> 'summary',
      'body', coalesce(v_revision.snapshot ->> 'body', '')
    );
  else
    raise check_violation using message = 'UNSUPPORTED_WIKI_ENTITY_TYPE';
  end if;

  return public.apply_wiki_revision(
    v_revision.entity_type,
    v_revision.entity_id,
    p_expected_version,
    v_patch,
    coalesce(nullif(p_summary, ''), '回滚到历史版本'),
    null
  );
end;
$$;


-- Operator-only, invoked in the same transaction as setting the maintenance Creator.
-- An unchanged official baseline is a no-op, so community edits survive repeat syncs.
create or replace function public.reconcile_official_wiki(p_entries jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  item jsonb;
  mapping public.wiki_official_sources%rowtype;
  entity jsonb;
  table_name text;
  changed integer := 0;
  unchanged integer := 0;
begin
  if auth.uid() is null or not exists (select 1 from public.profiles where id = auth.uid()) then
    raise insufficient_privilege using message = 'CREATOR_PROFILE_REQUIRED';
  end if;
  if jsonb_typeof(p_entries) is distinct from 'array' or jsonb_array_length(p_entries) not between 1 and 1000 then
    raise check_violation using message = 'OFFICIAL_MANIFEST_INVALID';
  end if;
  if (select count(distinct value->>'official_id') from jsonb_array_elements(p_entries)) <> jsonb_array_length(p_entries) then
    raise check_violation using message = 'OFFICIAL_ID_DUPLICATED';
  end if;
  perform pg_advisory_xact_lock(hashtext('ktu-official-wiki'));
  for item in select value from jsonb_array_elements(p_entries) loop
    table_name := case item->>'entity_type' when 'article' then 'wiki_articles' when 'college' then 'colleges'
      when 'student' then 'students' when 'place' then 'places' else null end;
    if table_name is null or (item->>'source_hash') is null or (item->>'source_hash') !~ '^[a-f0-9]{64}$'
      or (item->>'official_id') is null or (item->>'official_id') !~ '^[a-z0-9-]{2,64}$'
      or (item->>'slug') is null or (item->>'slug') !~ '^[a-z0-9-]{2,64}$' then
      raise check_violation using message = 'OFFICIAL_ENTRY_INVALID';
    end if;
    select * into mapping from public.wiki_official_sources where official_id = item->>'official_id' for update;
    if found then
      if mapping.entity_type <> item->>'entity_type' then raise check_violation using message = 'OFFICIAL_IDENTITY_CHANGED'; end if;
      execute format('select to_jsonb(e) from public.%I e where id = $1 for update', table_name) into entity using mapping.entity_id;
      if entity is null or entity->>'slug' <> item->>'slug' then raise check_violation using message = 'OFFICIAL_IDENTITY_CHANGED'; end if;
      if mapping.source_hash = item->>'source_hash' then unchanged := unchanged + 1; continue; end if;
    else
      execute format('select to_jsonb(e) from public.%I e where slug = $1 for update', table_name) into entity using item->>'slug';
    end if;
    if entity is null then
      entity := public.create_wiki_entity_with_body(item->>'entity_type', item->>'slug', item->>'name', item->>'summary', null, null, item->>'body');
    else
      if jsonb_build_object('name',entity->'name','summary',entity->'summary','body',entity->'body')
        is distinct from jsonb_build_object('name',item->'name','summary',item->'summary','body',item->'body') then
        entity := public.apply_wiki_revision(item->>'entity_type', (entity->>'id')::uuid, (entity->>'version')::bigint,
          jsonb_build_object('name',item->'name','summary',item->'summary','body',item->'body'), '官网权威版本同步；保留此前修订');
      end if;
    end if;
    insert into public.wiki_official_sources(official_id,entity_type,entity_id,source_hash)
    values(item->>'official_id',item->>'entity_type',(entity->>'id')::uuid,item->>'source_hash')
    on conflict(official_id) do update set source_hash = excluded.source_hash, synced_at = now();
    changed := changed + 1;
  end loop;
  return jsonb_build_object('changed',changed,'unchanged',unchanged);
end;
$$;
revoke all on function public.reconcile_official_wiki(jsonb) from public, anon, authenticated, service_role;
notify pgrst, 'reload schema';

