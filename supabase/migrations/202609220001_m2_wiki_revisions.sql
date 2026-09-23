-- KTU Co-Creation Platform: M2 wiki revisions and optimistic concurrency.
-- All entity creation, edits, and rollbacks produce an immutable revision.

alter table public.colleges add column version bigint not null default 1 check (version > 0);
alter table public.places add column version bigint not null default 1 check (version > 0);
alter table public.students add column version bigint not null default 1 check (version > 0);

alter table public.colleges
  add constraint colleges_summary_length check (summary is null or char_length(summary) <= 4000);
alter table public.places
  add constraint places_summary_length check (summary is null or char_length(summary) <= 4000);
alter table public.students
  add constraint students_summary_length check (summary is null or char_length(summary) <= 4000);

drop policy if exists "authenticated creators can create colleges" on public.colleges;
drop policy if exists "authenticated creators can create places" on public.places;
drop policy if exists "authenticated creators can create students" on public.students;
drop policy if exists "authenticated users can add wiki revisions" on public.wiki_revisions;

revoke insert, update, delete on public.colleges, public.places, public.students from authenticated;
revoke insert, update, delete on public.wiki_revisions from authenticated;

create or replace function public.create_wiki_entity(
  p_entity_type text,
  p_slug text,
  p_name text,
  p_summary text default null,
  p_college_id uuid default null,
  p_signature text default null
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

  if p_signature is not null and char_length(btrim(p_signature)) > 280 then
    raise check_violation using message = 'WIKI_SIGNATURE_TOO_LONG';
  end if;

  if p_entity_type = 'student' then
    insert into public.students (
      slug, name, college_id, signature, summary, created_by
    ) values (
      btrim(p_slug), btrim(p_name), p_college_id, nullif(btrim(p_signature), ''), nullif(btrim(p_summary), ''), v_user_id
    ) returning id into v_entity_id;

    select to_jsonb(entity) into v_snapshot
    from public.students entity
    where entity.id = v_entity_id;
  elsif p_entity_type = 'college' then
    insert into public.colleges (
      slug, name, summary, created_by
    ) values (
      btrim(p_slug), btrim(p_name), nullif(btrim(p_summary), ''), v_user_id
    ) returning id into v_entity_id;

    select to_jsonb(entity) into v_snapshot
    from public.colleges entity
    where entity.id = v_entity_id;
  elsif p_entity_type = 'place' then
    insert into public.places (
      slug, name, college_id, summary, created_by
    ) values (
      btrim(p_slug), btrim(p_name), p_college_id, nullif(btrim(p_summary), ''), v_user_id
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

  if p_entity_type = 'student' then
    if exists (
      select 1 from jsonb_object_keys(p_patch) as patch_key(key)
      where patch_key.key not in ('name', 'college_id', 'signature', 'summary')
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
      version = version + 1
    where id = p_entity_id;

    select to_jsonb(entity) into v_snapshot
    from public.students entity
    where entity.id = p_entity_id;
  elsif p_entity_type = 'college' then
    if exists (
      select 1 from jsonb_object_keys(p_patch) as patch_key(key)
      where patch_key.key not in ('name', 'summary')
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
      version = version + 1
    where id = p_entity_id;

    select to_jsonb(entity) into v_snapshot
    from public.colleges entity
    where entity.id = p_entity_id;
  elsif p_entity_type = 'place' then
    if exists (
      select 1 from jsonb_object_keys(p_patch) as patch_key(key)
      where patch_key.key not in ('name', 'college_id', 'summary')
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
      'summary', v_revision.snapshot -> 'summary'
    );
  elsif v_revision.entity_type = 'college' then
    v_patch := jsonb_build_object(
      'name', v_revision.snapshot -> 'name',
      'summary', v_revision.snapshot -> 'summary'
    );
  elsif v_revision.entity_type = 'place' then
    v_patch := jsonb_build_object(
      'name', v_revision.snapshot -> 'name',
      'college_id', v_revision.snapshot -> 'college_id',
      'summary', v_revision.snapshot -> 'summary'
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

revoke execute on function public.create_wiki_entity(text, text, text, text, uuid, text) from public, anon;
revoke execute on function public.apply_wiki_revision(text, uuid, bigint, jsonb, text, uuid) from public, anon;
revoke execute on function public.rollback_wiki_revision(uuid, bigint, text) from public, anon;

grant execute on function public.create_wiki_entity(text, text, text, text, uuid, text) to authenticated;
grant execute on function public.apply_wiki_revision(text, uuid, bigint, jsonb, text, uuid) to authenticated;
grant execute on function public.rollback_wiki_revision(uuid, bigint, text) to authenticated;
