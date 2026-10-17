-- Authenticated shared editing; published relational content changes atomically.
create table public.forum_collaborators (
 topic_id uuid not null references public.forum_topics(id) on delete cascade,
 creator_id uuid not null references public.profiles(id) on delete cascade,
 added_by uuid not null references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(), primary key(topic_id,creator_id)
);
create index forum_collaborators_creator_idx on public.forum_collaborators(creator_id,topic_id);
create index forum_collaborators_added_by_idx on public.forum_collaborators(added_by);
create function public.can_edit_forum(p_topic_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.forum_topics t where t.id=p_topic_id and t.status in ('draft','published') and (t.creator_id=auth.uid() or exists(select 1 from public.forum_collaborators c where c.topic_id=t.id and c.creator_id=auth.uid())));
$$;
revoke all on function public.can_edit_forum(uuid) from public,anon; grant execute on function public.can_edit_forum(uuid) to authenticated;
alter table public.forum_collaborators enable row level security;
revoke all on public.forum_collaborators from anon,authenticated; grant select on public.forum_collaborators to authenticated;
create policy forum_collaborators_read on public.forum_collaborators for select to authenticated using(public.can_edit_forum(topic_id));
create policy forum_collaborators_topic_read on public.forum_topics for select to authenticated using(public.can_edit_forum(id));
create policy forum_collaborators_messages_read on public.forum_messages for select to authenticated using(public.can_edit_forum(topic_id));
create policy forum_collaborators_tags_read on public.forum_topic_hashtags for select to authenticated using(public.can_edit_forum(topic_id));
create policy forum_collaborators_links_read on public.forum_topic_entity_links for select to authenticated using(public.can_edit_forum(topic_id));

create table public.forum_edit_documents (
 topic_id uuid primary key references public.forum_topics(id) on delete cascade,
 state text not null check(length(state) between 1 and 2800000), revision bigint not null default 1 check(revision>0),
 first_id text check(length(first_id) <= 100), updated_by uuid not null references public.profiles(id) on delete restrict,
 updated_at timestamptz not null default now(), public_revision bigint not null default 0,
 publish_error text
);
create index forum_edit_documents_updated_by_idx on public.forum_edit_documents(updated_by);
alter table public.forum_edit_documents enable row level security;
revoke all on public.forum_edit_documents from anon,authenticated; grant select on public.forum_edit_documents to authenticated;
create policy forum_edit_document_read on public.forum_edit_documents for select to authenticated using(public.can_edit_forum(topic_id));
create table public.forum_edit_presence (
 session_id uuid primary key,topic_id uuid not null references public.forum_topics(id) on delete cascade,
 creator_id uuid not null references public.profiles(id) on delete cascade,
 field text not null default '' check(length(field)<=120), seen_at timestamptz not null default now()
);
create index forum_edit_presence_topic_idx on public.forum_edit_presence(topic_id,seen_at);
create index forum_edit_presence_creator_idx on public.forum_edit_presence(creator_id);
alter table public.forum_edit_presence enable row level security;
revoke all on public.forum_edit_presence from anon,authenticated; grant select on public.forum_edit_presence to authenticated;
create policy forum_edit_presence_read on public.forum_edit_presence for select to authenticated using(public.can_edit_forum(topic_id));

create table public.forum_topic_accounts (
 topic_id uuid not null references public.forum_topics(id) on delete cascade,
 account_id uuid not null references public.forum_accounts(id) on delete restrict, primary key(topic_id,account_id)
);
create index forum_topic_accounts_account_idx on public.forum_topic_accounts(account_id);
alter table public.forum_topic_accounts enable row level security;
revoke all on public.forum_topic_accounts from anon,authenticated;grant select on public.forum_topic_accounts to authenticated;
create policy forum_topic_accounts_read on public.forum_topic_accounts for select to authenticated using(public.can_edit_forum(topic_id));
insert into public.forum_topic_accounts select distinct topic_id,forum_account_id from public.forum_messages;
create table public.forum_topic_edit_media (
 topic_id uuid not null references public.forum_topics(id) on delete cascade,
 asset_id uuid not null references public.media_assets(id) on delete restrict, primary key(topic_id,asset_id)
);
create index forum_topic_edit_media_asset_idx on public.forum_topic_edit_media(asset_id);
alter table public.forum_topic_edit_media enable row level security;
revoke all on public.forum_topic_edit_media from anon,authenticated;grant select on public.forum_topic_edit_media to authenticated;
create policy forum_topic_edit_media_read on public.forum_topic_edit_media for select to authenticated using(public.can_edit_forum(topic_id));
insert into public.forum_topic_edit_media select distinct m.topic_id,f.asset_id from public.forum_message_media f join public.forum_messages m on m.id=f.message_id;
create policy forum_shared_ready_media on public.media_assets for select to authenticated using(status='ready' and exists(select 1 from public.forum_topic_edit_media f where f.asset_id=media_assets.id and public.can_edit_forum(f.topic_id)));
create function public.forum_account_allowed(p_topic_id uuid,p_account_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.forum_accounts a join public.forum_topics t on t.id=p_topic_id where a.id=p_account_id and (a.created_by=t.creator_id or exists(select 1 from public.forum_collaborators c where c.topic_id=t.id and c.creator_id=a.created_by) or exists(select 1 from public.forum_topic_accounts p where p.topic_id=t.id and p.account_id=a.id)));
$$;
revoke all on function public.forum_account_allowed(uuid,uuid) from public,anon,authenticated;
create function public.manage_forum_collaborator(p_topic_id uuid,p_handle text default null,p_remove_id uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare t public.forum_topics; target uuid;
begin
 select * into t from public.forum_topics where id=p_topic_id for update;
 if auth.uid() is null or not found or t.creator_id is distinct from auth.uid() or t.status not in ('draft','published') then raise insufficient_privilege using message='FORUM_OWNER_REQUIRED'; end if;
 if p_remove_id is not null then delete from public.forum_collaborators where topic_id=p_topic_id and creator_id=p_remove_id; delete from public.forum_edit_presence where topic_id=p_topic_id and creator_id=p_remove_id; return; end if;
 if not exists(select 1 from public.forum_messages where topic_id=p_topic_id) then raise check_violation using message='FORUM_FIRST_POST_REQUIRED'; end if;
 select id into target from public.profiles where lower(handle)=lower(trim(leading '@' from btrim(p_handle)));
 if target is null or target=t.creator_id then raise check_violation using message='FORUM_COLLABORATOR_INVALID'; end if;
 insert into public.forum_collaborators(topic_id,creator_id,added_by) values(p_topic_id,target,auth.uid()) on conflict do nothing;
end; $$;
create function public.touch_forum_presence(p_topic_id uuid,p_session_id uuid,p_field text default '',p_leave boolean default false) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.can_edit_forum(p_topic_id) then raise insufficient_privilege using message='FORUM_EDITOR_REQUIRED'; end if;
 delete from public.forum_edit_presence where topic_id=p_topic_id and seen_at < now()-interval '1 minute';
 if p_leave then delete from public.forum_edit_presence where session_id=p_session_id and creator_id=auth.uid(); return; end if;
 insert into public.forum_edit_presence(session_id,topic_id,creator_id,field) values(p_session_id,p_topic_id,auth.uid(),left(coalesce(p_field,''),120))
 on conflict(session_id) do update set seen_at=now(),field=excluded.field where forum_edit_presence.creator_id=auth.uid() and forum_edit_presence.topic_id=p_topic_id;
end; $$;
create function public.initialize_forum_edit(p_topic_id uuid,p_state text) returns public.forum_edit_documents language plpgsql security definer set search_path='' as $$
declare t public.forum_topics; result public.forum_edit_documents;
begin
 select * into t from public.forum_topics where id=p_topic_id for update;
 if not public.can_edit_forum(p_topic_id) then raise insufficient_privilege using message='FORUM_EDITOR_REQUIRED'; end if;
 insert into public.forum_edit_documents(topic_id,state,updated_by,first_id) values(p_topic_id,p_state,auth.uid(),(select id::text from public.forum_messages where topic_id=p_topic_id and floor_no=1)) on conflict do nothing;
 select * into result from public.forum_edit_documents where topic_id=p_topic_id; return result;
end; $$;

create or replace function public.check_forum_draft_child()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  topic_owner uuid;
  topic_status text;
  child_topic_id uuid;
  account_owner uuid;
  reply_topic_id uuid;
  reply_floor_no integer;
begin
  child_topic_id := case when tg_op = 'DELETE' then old.topic_id else new.topic_id end;
  if tg_op = 'UPDATE' and new.topic_id is distinct from old.topic_id then
    raise check_violation using message = 'FORUM_MESSAGE_TOPIC_IMMUTABLE';
  end if;

  select creator_id, status into topic_owner, topic_status
  from public.forum_topics where id = child_topic_id for update;
  if not found or topic_status <> 'draft' then
    raise check_violation using message = 'FORUM_TOPIC_NOT_DRAFT';
  end if;

  if exists(select 1 from public.forum_edit_documents d where d.topic_id=child_topic_id) and current_setting('app.forum_edit_commit',true) is distinct from child_topic_id::text then raise check_violation using message='FORUM_USE_LIVE_EDITOR'; end if;
  if tg_table_name = 'forum_messages' and tg_op <> 'DELETE' then
    select created_by into account_owner
    from public.forum_accounts where id = new.forum_account_id;
    if not public.forum_account_allowed(child_topic_id,new.forum_account_id) then
      raise check_violation using message = 'FORUM_ACCOUNT_NOT_OWNED';
    end if;
    if new.reply_to_message_id is not null then
      select topic_id, floor_no into reply_topic_id, reply_floor_no
      from public.forum_messages where id = new.reply_to_message_id;
      if not found or reply_topic_id is distinct from new.topic_id
          or reply_floor_no >= new.floor_no then
        raise check_violation using message = 'FORUM_REPLY_INVALID';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;


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
  if not found or not public.can_edit_forum(p_topic_id) then
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


create or replace function public.replace_forum_draft_hashtags(
  p_topic_id uuid, p_names text[]
)
returns setof public.hashtags
language plpgsql
security definer
set search_path = ''
as $$
declare
  topic_row public.forum_topics;
  tag_name text;
  normalized text;
  seen text[] := '{}';
  tag_id uuid;
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'FORUM_AUTH_REQUIRED';
  end if;
  select * into topic_row from public.forum_topics
  where id = p_topic_id for update;
  if not found or not public.can_edit_forum(p_topic_id) then
    raise insufficient_privilege using message = 'FORUM_TOPIC_NOT_OWNED';
  end if;
  if topic_row.status <> 'draft' then
    raise check_violation using message = 'FORUM_TOPIC_NOT_DRAFT';
  end if;
  if p_names is null or cardinality(p_names) > 8 then
    raise check_violation using message = 'FORUM_HASHTAGS_INVALID';
  end if;

  delete from public.forum_topic_hashtags where topic_id = p_topic_id;
  foreach tag_name in array p_names loop
    if tag_name is null then
      raise check_violation using message = 'FORUM_HASHTAG_INVALID';
    end if;
    tag_name := btrim(tag_name);
    normalized := lower(regexp_replace(tag_name, '[[:space:]]+', ' ', 'g'));
    if char_length(tag_name) < 1 or char_length(tag_name) > 64
      or position('#' in tag_name) > 0 then
      raise check_violation using message = 'FORUM_HASHTAG_INVALID';
    end if;
    if normalized = any(seen) then
      continue;
    end if;
    seen := array_append(seen, normalized);
    insert into public.hashtags(name) values (tag_name)
      on conflict (normalized_name) do nothing;
    select id into strict tag_id from public.hashtags
      where normalized_name = normalized;
    insert into public.forum_topic_hashtags(topic_id, hashtag_id)
      values (p_topic_id, tag_id);
  end loop;

  return query select h.* from public.hashtags h
  join public.forum_topic_hashtags th on th.hashtag_id = h.id
  where th.topic_id = p_topic_id order by h.normalized_name;
end;
$$;


create or replace function public.save_forum_draft(p_topic_id uuid,p_expected_version bigint,p_title text,p_board text,p_messages jsonb,p_tags text[],p_links jsonb,p_publish boolean default false)
returns bigint language plpgsql security definer set search_path='' as $$
declare t public.forum_topics; entry jsonb; target uuid; entity_type text; next_version bigint;
begin
 if auth.uid() is null then raise insufficient_privilege using message='FORUM_AUTH_REQUIRED'; end if;
 select * into t from public.forum_topics where id=p_topic_id for update;
 if not found or not public.can_edit_forum(p_topic_id) then raise insufficient_privilege using message='FORUM_TOPIC_NOT_OWNED'; end if;
 if t.status<>'draft' then raise check_violation using message='FORUM_TOPIC_NOT_DRAFT'; end if;
 if p_expected_version is distinct from t.version then raise exception 'FORUM_VERSION_CONFLICT'; end if;
 if p_title is null or char_length(btrim(p_title)) not between 1 and 160 or p_board is null or p_board not in ('campus','academic','clubs','stories') then raise check_violation using message='FORUM_TOPIC_INVALID'; end if;
 if p_links is null or jsonb_typeof(p_links)<>'array' or jsonb_array_length(p_links)>30 then raise check_violation using message='FORUM_LINKS_INVALID'; end if;
 if p_publish is null then raise check_violation using message='FORUM_TOPIC_INVALID'; end if;
 perform public.replace_forum_draft_messages(p_topic_id,p_messages);
 perform public.replace_forum_draft_hashtags(p_topic_id,p_tags);
 delete from public.forum_topic_entity_links where topic_id=p_topic_id;
 for entry in select value from jsonb_array_elements(p_links) loop
  if jsonb_typeof(entry)<>'object' or entry-array['entity_type','entity_id']<>'{}'::jsonb or jsonb_typeof(entry->'entity_type') is distinct from 'string' or jsonb_typeof(entry->'entity_id') is distinct from 'string' then raise check_violation using message='FORUM_LINKS_INVALID'; end if;
  entity_type:=entry->>'entity_type';
  begin target:=(entry->>'entity_id')::uuid; exception when invalid_text_representation then raise check_violation using message='FORUM_LINKS_INVALID'; end;
  if entity_type='student' then
   if not exists(select 1 from public.students where id=target) then raise check_violation using message='FORUM_LINKS_INVALID'; end if;
   insert into public.forum_topic_entity_links(topic_id,student_id) values(p_topic_id,target) on conflict do nothing;
  elsif entity_type='college' then
   if not exists(select 1 from public.colleges where id=target) then raise check_violation using message='FORUM_LINKS_INVALID'; end if;
   insert into public.forum_topic_entity_links(topic_id,college_id) values(p_topic_id,target) on conflict do nothing;
  elsif entity_type='place' then
   if not exists(select 1 from public.places where id=target) then raise check_violation using message='FORUM_LINKS_INVALID'; end if;
   insert into public.forum_topic_entity_links(topic_id,place_id) values(p_topic_id,target) on conflict do nothing;
  elsif entity_type='event' then
   if not exists(select 1 from public.events where id=target and status='published') then raise check_violation using message='FORUM_LINKS_INVALID'; end if;
   insert into public.forum_topic_entity_links(topic_id,event_id) values(p_topic_id,target) on conflict do nothing;
  else raise check_violation using message='FORUM_LINKS_INVALID'; end if;
 end loop;
 update public.forum_topics set title=btrim(p_title),board=p_board where id=p_topic_id;
 if p_publish then perform public.publish_forum_topic(p_topic_id); end if;
 select version into next_version from public.forum_topics where id=p_topic_id;
 return next_version;
end; $$;

create or replace function public.publish_forum_topic(p_topic_id uuid)
returns public.forum_topics
language plpgsql
security definer
set search_path = ''
as $$
declare
  topic_row public.forum_topics;
  floor_count bigint;
  first_floor integer;
  last_floor integer;
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

  select count(*), min(floor_no), max(floor_no)
  into floor_count, first_floor, last_floor
  from public.forum_messages where topic_id = p_topic_id;
  if floor_count = 0 then
    raise check_violation using message = 'FORUM_TOPIC_EMPTY';
  end if;
  if first_floor <> 1 or last_floor <> floor_count then
    raise check_violation using message = 'FORUM_FLOOR_SEQUENCE_INVALID';
  end if;
  if exists (
    select 1 from public.forum_messages m
    join public.forum_accounts a on a.id = m.forum_account_id
    where m.topic_id = p_topic_id and not public.forum_account_allowed(p_topic_id,a.id)
  ) then
    raise check_violation using message = 'FORUM_ACCOUNT_NOT_OWNED';
  end if;
  if exists (
    select 1 from public.forum_messages m
    left join public.forum_messages reply on reply.id = m.reply_to_message_id
    where m.topic_id = p_topic_id and m.reply_to_message_id is not null
      and (reply.id is null or reply.topic_id <> p_topic_id
        or reply.floor_no >= m.floor_no)
  ) then
    raise check_violation using message = 'FORUM_REPLY_INVALID';
  end if;

  update public.forum_topics
  set status = 'published', published_at = clock_timestamp()
  where id = p_topic_id returning * into topic_row;
  return topic_row;
end;
$$;


create or replace function public.sync_forum_message_media()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_line text; v_match text[]; v_id uuid; v_creator uuid;
begin
  select creator_id into v_creator from public.forum_topics where id = new.topic_id;
  delete from public.forum_message_media where message_id = new.id;
  foreach v_line in array string_to_array(replace(new.body, E'\r', ''), E'\n') loop
    if position('![' in v_line) > 0 then
      v_match := regexp_match(btrim(v_line), '^!\[([^]\r\n]*)\]\(/api/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)$', 'i');
      if v_match is null then raise exception 'FORUM_IMAGE_INVALID' using errcode = '23514'; end if;
      v_id := v_match[2]::uuid;
      if not exists (select 1 from public.media_assets where id = v_id and (uploader_id = v_creator or exists(select 1 from public.forum_collaborators c where c.topic_id=new.topic_id and c.creator_id=uploader_id) or exists(select 1 from public.forum_topic_edit_media p where p.topic_id=new.topic_id and p.asset_id=v_id)) and status = 'ready') then
        raise exception 'FORUM_IMAGE_INVALID' using errcode = '23514';
      end if;
      insert into public.forum_topic_edit_media(topic_id,asset_id) values(new.topic_id,v_id) on conflict do nothing;
      insert into public.forum_message_media(message_id, asset_id) values(new.id, v_id) on conflict do nothing;
    end if;
  end loop;
  return new;
end;
$$;

create function public.commit_forum_edit(p_topic_id uuid,p_expected_revision bigint,p_state text,p_first_id text,p_snapshot jsonb default null,p_publish boolean default false) returns public.forum_edit_documents language plpgsql security definer set search_path='' as $$
declare t public.forum_topics; d public.forum_edit_documents; v bigint; err text; published boolean; a uuid;
begin
 select * into t from public.forum_topics where id=p_topic_id for update;
 if not public.can_edit_forum(p_topic_id) then raise insufficient_privilege using message='FORUM_EDITOR_REQUIRED'; end if;
 if p_publish and t.creator_id<>auth.uid() then raise insufficient_privilege using message='FORUM_OWNER_REQUIRED'; end if;
 select * into d from public.forum_edit_documents where topic_id=p_topic_id for update;
 if not found or d.revision is distinct from p_expected_revision then raise serialization_failure using message='FORUM_EDIT_CONFLICT'; end if;
 if d.first_id is not null and d.first_id is distinct from p_first_id then raise check_violation using message='FORUM_FIRST_POST_REQUIRED'; end if;
 published:=t.status='published';
 perform set_config('app.forum_edit_commit',p_topic_id::text,true);
 if p_snapshot is not null then
  begin
   for a in select (e->>'forum_account_id')::uuid from jsonb_array_elements(p_snapshot->'messages') e loop
    if not public.forum_account_allowed(p_topic_id,a) then raise check_violation using message='FORUM_ACCOUNT_NOT_OWNED'; end if;
    insert into public.forum_topic_accounts values(p_topic_id,a) on conflict do nothing;
   end loop;
   -- No reader can observe this temporary draft: the whole replacement is one transaction.
   if published then update public.forum_topics set status='draft',published_at=null where id=p_topic_id; end if;
   select version into v from public.forum_topics where id=p_topic_id;
   perform public.save_forum_draft(p_topic_id,v,p_snapshot->>'title',p_snapshot->>'board',p_snapshot->'messages',array(select jsonb_array_elements_text(p_snapshot->'tags')),p_snapshot->'links',false);
   if published then
    if jsonb_array_length(p_snapshot->'messages')=0 then raise check_violation using message='FORUM_TOPIC_EMPTY'; end if;
    update public.forum_topics set status='published',published_at=t.published_at where id=p_topic_id;
   elsif p_publish then perform public.publish_forum_topic(p_topic_id); end if;
  exception when check_violation or foreign_key_violation or invalid_text_representation or not_null_violation then
   get stacked diagnostics err=MESSAGE_TEXT;
   if p_publish then raise; end if;
  end;
 elsif p_publish then raise check_violation using message='FORUM_CONTENT_INCOMPLETE';
 end if;
 update public.forum_edit_documents set state=p_state,first_id=coalesce(first_id,p_first_id),revision=revision+1,updated_by=auth.uid(),updated_at=now(),publish_error=coalesce(err,case when p_snapshot is null then 'FORUM_CONTENT_INCOMPLETE' end),public_revision=case when p_snapshot is not null and err is null then revision+1 else public_revision end where topic_id=p_topic_id returning * into d;
 return d;
end; $$;
revoke all on function public.manage_forum_collaborator(uuid,text,uuid),public.touch_forum_presence(uuid,uuid,text,boolean),public.initialize_forum_edit(uuid,text),public.commit_forum_edit(uuid,bigint,text,text,jsonb,boolean) from public,anon;
grant execute on function public.manage_forum_collaborator(uuid,text,uuid),public.touch_forum_presence(uuid,uuid,text,boolean),public.initialize_forum_edit(uuid,text),public.commit_forum_edit(uuid,bigint,text,text,jsonb,boolean) to authenticated;
notify pgrst,'reload schema';

create function public.list_forum_edit_accounts(p_topic_id uuid) returns setof public.forum_accounts language sql stable security definer set search_path='' as $$
 select a.* from public.forum_accounts a join public.forum_topics t on t.id=p_topic_id where public.can_edit_forum(t.id) and (a.created_by=auth.uid() or a.created_by=t.creator_id or exists(select 1 from public.forum_collaborators c where c.topic_id=t.id and c.creator_id=a.created_by) or exists(select 1 from public.forum_topic_accounts p where p.topic_id=t.id and p.account_id=a.id)) order by a.created_at;
$$;
revoke all on function public.list_forum_edit_accounts(uuid) from public,anon;grant execute on function public.list_forum_edit_accounts(uuid) to authenticated;

-- Identity presentation changes are visible to readers and active coauthors too.
create function public.touch_forum_identity_works() returns trigger language plpgsql security definer set search_path='' as $$
begin update public.forum_topics t set updated_at=now() where exists(select 1 from public.forum_messages m where m.topic_id=t.id and m.forum_account_id=new.id); return new; end; $$;
create trigger forum_accounts_touch_works after update of display_name,avatar_asset_id on public.forum_accounts for each row execute function public.touch_forum_identity_works();
revoke all on function public.touch_forum_identity_works() from public,anon,authenticated;
