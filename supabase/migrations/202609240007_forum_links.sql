-- A forum work stays a BBS narrative; references belong to its Topic metadata.
alter table public.forum_topics add column version bigint not null default 1 check(version>0);
create table public.forum_topic_entity_links (
 id uuid primary key default gen_random_uuid(),
 topic_id uuid not null references public.forum_topics(id) on delete cascade,
 student_id uuid references public.students(id) on delete restrict,
 college_id uuid references public.colleges(id) on delete restrict,
 place_id uuid references public.places(id) on delete restrict,
 event_id uuid references public.events(id) on delete restrict,
 check(num_nonnulls(student_id,college_id,place_id,event_id)=1)
);
create index forum_topic_entity_links_topic_idx on public.forum_topic_entity_links(topic_id);
create unique index forum_topic_entity_links_student_idx on public.forum_topic_entity_links(topic_id,student_id) where student_id is not null;
create unique index forum_topic_entity_links_college_idx on public.forum_topic_entity_links(topic_id,college_id) where college_id is not null;
create unique index forum_topic_entity_links_place_idx on public.forum_topic_entity_links(topic_id,place_id) where place_id is not null;
create unique index forum_topic_entity_links_event_idx on public.forum_topic_entity_links(topic_id,event_id) where event_id is not null;
create index forum_topic_entity_links_student_backlink_idx on public.forum_topic_entity_links(student_id,topic_id) where student_id is not null;
create index forum_topic_entity_links_college_backlink_idx on public.forum_topic_entity_links(college_id,topic_id) where college_id is not null;
create index forum_topic_entity_links_place_backlink_idx on public.forum_topic_entity_links(place_id,topic_id) where place_id is not null;
create index forum_topic_entity_links_event_backlink_idx on public.forum_topic_entity_links(event_id,topic_id) where event_id is not null;
alter table public.forum_topic_entity_links enable row level security;
revoke all on public.forum_topic_entity_links from anon,authenticated;
grant select on public.forum_topic_entity_links to anon,authenticated;
create policy forum_entity_links_read on public.forum_topic_entity_links for select using(exists(
 select 1 from public.forum_topics t where t.id=topic_id and (t.status='published' or (t.status='draft' and t.creator_id=auth.uid()))
));

-- Legacy child RPCs/direct draft writes also advance the optimistic revision.
create function public.advance_forum_version() returns trigger language plpgsql set search_path='' as $$
begin new.version:=old.version+1; return new; end; $$;
create trigger forum_topics_advance_version before update on public.forum_topics for each row execute function public.advance_forum_version();
create function public.touch_forum_parent_version() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.forum_topics set updated_at=now() where id=case when tg_op='DELETE' then old.topic_id else new.topic_id end;
 return null;
end; $$;
create trigger forum_messages_touch_parent after insert or update or delete on public.forum_messages for each row execute function public.touch_forum_parent_version();
create trigger forum_tags_touch_parent after insert or delete on public.forum_topic_hashtags for each row execute function public.touch_forum_parent_version();
revoke execute on function public.advance_forum_version(),public.touch_forum_parent_version() from public,anon,authenticated;

create function public.save_forum_draft(p_topic_id uuid,p_expected_version bigint,p_title text,p_board text,p_messages jsonb,p_tags text[],p_links jsonb,p_publish boolean default false)
returns bigint language plpgsql security definer set search_path='' as $$
declare t public.forum_topics; entry jsonb; target uuid; entity_type text; next_version bigint;
begin
 if auth.uid() is null then raise insufficient_privilege using message='FORUM_AUTH_REQUIRED'; end if;
 select * into t from public.forum_topics where id=p_topic_id for update;
 if not found or t.creator_id is distinct from auth.uid() then raise insufficient_privilege using message='FORUM_TOPIC_NOT_OWNED'; end if;
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
revoke execute on function public.save_forum_draft(uuid,bigint,text,text,jsonb,text[],jsonb,boolean) from public,anon,authenticated;
grant execute on function public.save_forum_draft(uuid,bigint,text,text,jsonb,text[],jsonb,boolean) to authenticated;
