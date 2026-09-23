-- Follow-up M3 RPC for atomic replacement of a draft Topic's free tags.
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
  if not found or topic_row.creator_id is distinct from (select auth.uid()) then
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

revoke execute on function public.replace_forum_draft_hashtags(uuid, text[])
  from public, anon, authenticated;
grant execute on function public.replace_forum_draft_hashtags(uuid, text[])
  to authenticated;
