-- Authored fictional counts; reader reactions remain a separate work-community model.
alter table public.forum_messages add column like_count integer not null default 0 check (like_count between 0 and 999999999);
alter table public.forum_messages add column question_count integer not null default 0 check (question_count between 0 and 999999999);
alter table public.students add column body text not null default '' check (char_length(body) <= 50000);
alter table public.colleges add column body text not null default '' check (char_length(body) <= 50000);
alter table public.places add column body text not null default '' check (char_length(body) <= 50000);

create or replace function public.replace_forum_draft_messages(
  p_topic_id uuid, p_messages jsonb
)
returns setof public.forum_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  topic_row public.forum_topics;
  entry jsonb;
  floor_number integer := 0;
  account_id uuid;
  reply_floor integer;
  reply_id uuid;
  message_body text;
  world_time text;
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'FORUM_AUTH_REQUIRED';
  end if;
  select * into topic_row from public.forum_topics
  where id = p_topic_id for update;
  if not found or topic_row.creator_id is distinct from (select auth.uid()) then
    raise insufficient_privilege using message = 'FORUM_TOPIC_NOT_OWNED';
  end if;
  if topic_row.status <> 'draft' then
    raise check_violation using message = 'FORUM_TOPIC_NOT_DRAFT';
  end if;
  if p_messages is null or jsonb_typeof(p_messages) <> 'array'
    or jsonb_array_length(p_messages) > 100 then
    raise check_violation using message = 'FORUM_MESSAGES_INVALID';
  end if;

  delete from public.forum_messages where topic_id = p_topic_id;
  for entry in select value from jsonb_array_elements(p_messages) loop
    floor_number := floor_number + 1;
    if jsonb_typeof(entry) <> 'object'
      or (entry - array['forum_account_id', 'body',
        'reply_to_floor_no', 'in_world_time', 'like_count', 'question_count']) <> '{}'::jsonb
      or jsonb_typeof(entry -> 'forum_account_id') <> 'string'
      or jsonb_typeof(entry -> 'body') <> 'string'
      or (entry ? 'reply_to_floor_no' and jsonb_typeof(entry -> 'reply_to_floor_no')
        not in ('number', 'null'))
      or (entry ? 'in_world_time' and jsonb_typeof(entry -> 'in_world_time')
        not in ('string', 'null')) then
      raise check_violation using message = 'FORUM_MESSAGE_INVALID';
    end if;
    if (entry ? 'like_count' and (jsonb_typeof(entry -> 'like_count') <> 'number' or (entry ->> 'like_count') !~ '^[0-9]{1,9}$'))
      or (entry ? 'question_count' and (jsonb_typeof(entry -> 'question_count') <> 'number' or (entry ->> 'question_count') !~ '^[0-9]{1,9}$')) then
      raise check_violation using message = 'FORUM_MESSAGE_INVALID';
    end if;
    begin
      account_id := (entry ->> 'forum_account_id')::uuid;
      reply_floor := (entry ->> 'reply_to_floor_no')::integer;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise check_violation using message = 'FORUM_MESSAGE_INVALID';
    end;
    message_body := entry ->> 'body';
    world_time := entry ->> 'in_world_time';
    if reply_floor is not null and (reply_floor < 1 or reply_floor >= floor_number) then
      raise check_violation using message = 'FORUM_REPLY_INVALID';
    end if;
    reply_id := null;
    if reply_floor is not null then
      select id into reply_id from public.forum_messages
      where topic_id = p_topic_id and floor_no = reply_floor;
      if not found then
        raise check_violation using message = 'FORUM_REPLY_INVALID';
      end if;
    end if;
    insert into public.forum_messages
      (topic_id, forum_account_id, floor_no, body,
        reply_to_message_id, in_world_time, like_count, question_count)
    values (p_topic_id, account_id, floor_number, message_body,
      reply_id, world_time, coalesce((entry ->> 'like_count')::integer, 0), coalesce((entry ->> 'question_count')::integer, 0));
  end loop;
  return query select * from public.forum_messages
    where topic_id = p_topic_id order by floor_no;
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

  if p_entity_type = 'student' then
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

  if p_entity_type = 'student' then
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
  elsif v_revision.entity_type = 'college' then
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


-- Keep the six-argument RPC for compatibility with old clients.
create or replace function public.create_wiki_entity(p_entity_type text, p_slug text, p_name text, p_summary text default null, p_college_id uuid default null, p_signature text default null)
returns jsonb language sql security invoker set search_path = '' as $$
 select public.create_wiki_entity_with_body(p_entity_type,p_slug,p_name,p_summary,p_college_id,p_signature,null);
$$;
revoke execute on function public.create_wiki_entity_with_body(text,text,text,text,uuid,text,text) from public, anon;
grant execute on function public.create_wiki_entity_with_body(text,text,text,text,uuid,text,text) to authenticated;
-- Identity type describes a role; it does not require a published character archive.
alter table public.forum_accounts drop constraint student_accounts_require_student;
notify pgrst, 'reload schema';
