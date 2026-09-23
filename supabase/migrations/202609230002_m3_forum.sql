-- M3 Campus Forum: a Creator owns the whole work; Forum Accounts speak in-world.
-- Published text is frozen for the public beta. Moderation needs a later,
-- separately authorized transition rather than a client-side status update.

create table public.forum_topics (
  id uuid primary key default extensions.gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  board text not null check (board ~ '^[a-z0-9-]{2,32}$'),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'hidden', 'removed')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_topic_publication_time check (
    (status = 'draft' and published_at is null)
    or (status <> 'draft' and published_at is not null)
  )
);

create table public.forum_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  forum_account_id uuid not null references public.forum_accounts(id) on delete restrict,
  floor_no integer not null check (floor_no > 0),
  body text not null check (char_length(btrim(body)) between 1 and 10000),
  reply_to_message_id uuid references public.forum_messages(id) on delete restrict,
  in_world_time text check (in_world_time is null or char_length(in_world_time) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_messages_topic_floor_unique unique (topic_id, floor_no)
    deferrable initially immediate,
  constraint forum_message_cannot_reply_to_self check (reply_to_message_id is distinct from id)
);

create table public.hashtags (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (
    char_length(btrim(name)) between 1 and 64
    and name !~ '#'
  ),
  normalized_name text generated always as (
    lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g'))
  ) stored unique,
  created_at timestamptz not null default now()
);

create table public.forum_topic_hashtags (
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  hashtag_id uuid not null references public.hashtags(id) on delete restrict,
  primary key (topic_id, hashtag_id)
);

create index forum_topics_creator_id_idx on public.forum_topics(creator_id);
create index forum_topics_public_board_idx
  on public.forum_topics(board, published_at desc, id) where status = 'published';
create index forum_messages_forum_account_id_idx
  on public.forum_messages(forum_account_id);
create index forum_messages_reply_to_message_id_idx
  on public.forum_messages(reply_to_message_id);
create index forum_topic_hashtags_hashtag_id_idx
  on public.forum_topic_hashtags(hashtag_id, topic_id);

create trigger forum_topics_set_updated_at before update on public.forum_topics
for each row execute function public.set_updated_at();
create trigger forum_messages_set_updated_at before update on public.forum_messages
for each row execute function public.set_updated_at();

-- Lock the parent row before any draft child mutation. This prevents a
-- concurrent publish from racing a Message or Hashtag write into the work.
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

  if tg_table_name = 'forum_messages' and tg_op <> 'DELETE' then
    select created_by into account_owner
    from public.forum_accounts where id = new.forum_account_id;
    if account_owner is distinct from topic_owner then
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

create trigger forum_messages_check_draft
before insert or update or delete on public.forum_messages
for each row execute function public.check_forum_draft_child();
create trigger forum_topic_hashtags_check_draft
before insert or delete on public.forum_topic_hashtags
for each row execute function public.check_forum_draft_child();

-- The only authenticated path from draft to published. Both the parent lock
-- and validation happen in the caller's transaction.
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
    where m.topic_id = p_topic_id and a.created_by <> topic_row.creator_id
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

-- Replace the complete sequence in one transaction. JSON array order becomes floor_no;
-- references use earlier floor numbers so IDs remain an internal detail.
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
        'reply_to_floor_no', 'in_world_time']) <> '{}'::jsonb
      or jsonb_typeof(entry -> 'forum_account_id') <> 'string'
      or jsonb_typeof(entry -> 'body') <> 'string'
      or (entry ? 'reply_to_floor_no' and jsonb_typeof(entry -> 'reply_to_floor_no')
        not in ('number', 'null'))
      or (entry ? 'in_world_time' and jsonb_typeof(entry -> 'in_world_time')
        not in ('string', 'null')) then
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
        reply_to_message_id, in_world_time)
    values (p_topic_id, account_id, floor_number, message_body,
      reply_id, world_time);
  end loop;
  return query select * from public.forum_messages
    where topic_id = p_topic_id order by floor_no;
end;
$$;
alter table public.forum_topics enable row level security;
alter table public.forum_messages enable row level security;
alter table public.hashtags enable row level security;
alter table public.forum_topic_hashtags enable row level security;

create policy "published topics are public" on public.forum_topics
for select using (status = 'published');
create policy "creators can read their own topics" on public.forum_topics
for select to authenticated using (creator_id = (select auth.uid()));
create policy "creators can insert draft topics" on public.forum_topics
for insert to authenticated with check (
  creator_id = (select auth.uid()) and status = 'draft' and published_at is null
);
create policy "creators can edit only their draft topics" on public.forum_topics
for update to authenticated
using (creator_id = (select auth.uid()) and status = 'draft')
with check (creator_id = (select auth.uid()) and status = 'draft' and published_at is null);

create policy "published messages are public" on public.forum_messages
for select using (exists (
  select 1 from public.forum_topics t
  where t.id = topic_id and t.status = 'published'
));
create policy "creators can read their draft messages" on public.forum_messages
for select to authenticated using (exists (
  select 1 from public.forum_topics t
  where t.id = topic_id and t.creator_id = (select auth.uid())
));
create policy "creators can add draft messages" on public.forum_messages
for insert to authenticated with check (exists (
  select 1 from public.forum_topics t
  where t.id = topic_id and t.creator_id = (select auth.uid()) and t.status = 'draft'
));
create policy "creators can edit draft messages" on public.forum_messages
for update to authenticated
using (exists (
  select 1 from public.forum_topics t
  where t.id = topic_id and t.creator_id = (select auth.uid()) and t.status = 'draft'
))
with check (exists (
  select 1 from public.forum_topics t
  where t.id = topic_id and t.creator_id = (select auth.uid()) and t.status = 'draft'
));
create policy "creators can delete draft messages" on public.forum_messages
for delete to authenticated using (exists (
  select 1 from public.forum_topics t
  where t.id = topic_id and t.creator_id = (select auth.uid()) and t.status = 'draft'
));

create policy "hashtags are public" on public.hashtags for select using (true);
create policy "creators can create hashtags" on public.hashtags
for insert to authenticated with check ((select auth.uid()) is not null);

create policy "published topic hashtags are public" on public.forum_topic_hashtags
for select using (exists (
  select 1 from public.forum_topics t
  where t.id = topic_id and t.status = 'published'
));
create policy "creators can read their draft topic hashtags" on public.forum_topic_hashtags
for select to authenticated using (exists (
  select 1 from public.forum_topics t
  where t.id = topic_id and t.creator_id = (select auth.uid())
));
create policy "creators can tag draft topics" on public.forum_topic_hashtags
for insert to authenticated with check (exists (
  select 1 from public.forum_topics t
  where t.id = topic_id and t.creator_id = (select auth.uid()) and t.status = 'draft'
));
create policy "creators can untag draft topics" on public.forum_topic_hashtags
for delete to authenticated using (exists (
  select 1 from public.forum_topics t
  where t.id = topic_id and t.creator_id = (select auth.uid()) and t.status = 'draft'
));

-- Supabase default privileges can grant DML to anon/authenticated. Replace
-- them explicitly before the API is exposed; RLS is the second boundary.
revoke all privileges on table public.forum_topics, public.forum_messages,
  public.hashtags, public.forum_topic_hashtags from anon, authenticated;
grant select on table public.forum_topics, public.forum_messages,
  public.hashtags, public.forum_topic_hashtags to anon, authenticated;
grant insert, update on table public.forum_topics, public.forum_messages
  to authenticated;
grant delete on table public.forum_messages to authenticated;
grant insert on table public.hashtags to authenticated;
grant insert, delete on table public.forum_topic_hashtags to authenticated;

revoke execute on function public.check_forum_draft_child() from public, anon, authenticated;
revoke execute on function public.publish_forum_topic(uuid) from public, anon, authenticated;
grant execute on function public.publish_forum_topic(uuid) to authenticated;
revoke execute on function public.replace_forum_draft_messages(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_forum_draft_messages(uuid, jsonb)
  to authenticated;
