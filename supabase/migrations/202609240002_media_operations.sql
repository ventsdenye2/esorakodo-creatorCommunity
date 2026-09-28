-- Media remains private; binary objects are stored outside PostgreSQL.
create table public.media_assets (
  id uuid primary key default extensions.gen_random_uuid(),
  uploader_id uuid not null references public.profiles(id) on delete restrict,
  object_key text not null unique,
  filename text not null check(char_length(filename) between 1 and 180),
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size bigint not null check(byte_size between 1 and 10485760),
  status text not null default 'pending' check(status in ('pending','ready','hidden')),
  created_at timestamptz not null default now()
);
create index media_assets_uploader_idx on public.media_assets(uploader_id,created_at desc);
create table public.article_media (
  article_id uuid not null references public.articles(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  primary key(article_id,asset_id)
);
create index article_media_asset_idx on public.article_media(asset_id);
create table public.supplement_media (
  supplement_id uuid not null references public.event_supplements(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  primary key(supplement_id,asset_id)
);
create index supplement_media_asset_idx on public.supplement_media(asset_id);

create or replace function public.reserve_media(p_filename text,p_mime_type text,p_byte_size bigint)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid := extensions.gen_random_uuid(); v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  if (select count(*) from public.media_assets where uploader_id=v_user and created_at>now()-interval '1 day')>=50 then raise exception 'MEDIA_QUOTA'; end if;
  insert into public.media_assets(id,uploader_id,object_key,filename,mime_type,byte_size)
  values(v_id,v_user,v_user::text||'/'||v_id::text,p_filename,p_mime_type,p_byte_size);
  return v_id;
end; $$;

create or replace function public.validate_content_image(p_asset_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.media_assets where id=p_asset_id and uploader_id=auth.uid() and status='ready') then raise exception 'MEDIA_NOT_READY'; end if;
end; $$;

create or replace function public.sync_content_media()
returns trigger language plpgsql security definer set search_path='' as $$
declare block jsonb;
begin
  if tg_table_name='articles' then delete from public.article_media where article_id=new.id;
  else delete from public.supplement_media where supplement_id=new.id; end if;
  for block in select value from jsonb_array_elements(new.body->'blocks') loop
    if block->>'type'='image' then
      perform public.validate_content_image((block->>'asset_id')::uuid);
      if tg_table_name='articles' then insert into public.article_media values(new.id,(block->>'asset_id')::uuid) on conflict do nothing;
      else insert into public.supplement_media values(new.id,(block->>'asset_id')::uuid) on conflict do nothing; end if;
    end if;
  end loop;
  return new;
end; $$;
create trigger articles_sync_media after insert or update of body on public.articles for each row execute function public.sync_content_media();
create trigger supplements_sync_media after insert or update of body on public.event_supplements for each row execute function public.sync_content_media();

alter table public.media_assets enable row level security;
alter table public.article_media enable row level security;
alter table public.supplement_media enable row level security;
revoke all on public.media_assets,public.article_media,public.supplement_media from anon,authenticated;
grant select on public.media_assets,public.article_media,public.supplement_media to anon,authenticated;
grant all on public.media_assets,public.article_media,public.supplement_media to service_role;
create policy media_owner_read on public.media_assets for select to authenticated using(uploader_id=auth.uid());
create policy media_published_read on public.media_assets for select using(status='ready' and (
  exists(select 1 from public.article_media m join public.articles a on a.id=m.article_id where m.asset_id=media_assets.id and a.status='published') or
  exists(select 1 from public.supplement_media m join public.event_supplements s on s.id=m.supplement_id join public.events e on e.id=s.event_id where m.asset_id=media_assets.id and s.status='published' and e.status='published')
));
create policy article_media_read on public.article_media for select using(exists(select 1 from public.articles a where a.id=article_id));
create policy supplement_media_read on public.supplement_media for select using(exists(select 1 from public.event_supplements s where s.id=supplement_id));
revoke execute on function public.reserve_media(text,text,bigint) from public,anon,authenticated;
grant execute on function public.reserve_media(text,text,bigint) to authenticated;
revoke execute on function public.validate_content_image(uuid),public.sync_content_media() from public,anon,authenticated;

-- Administrator memberships cannot be granted through the browser or user metadata.
create table public.moderators (
  creator_id uuid primary key references public.profiles(id) on delete cascade,
  granted_at timestamptz not null default now()
);
alter table public.moderators enable row level security;
revoke all on public.moderators from anon,authenticated;
grant all on public.moderators to service_role;
create or replace function public.is_moderator() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.moderators where creator_id=auth.uid());
$$;
revoke execute on function public.is_moderator() from public,anon,authenticated;
grant execute on function public.is_moderator() to authenticated;

-- Targets use real foreign keys; a row references exactly one published work.
create table public.reports (
  id uuid primary key default extensions.gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  forum_topic_id uuid references public.forum_topics(id) on delete restrict,
  article_id uuid references public.articles(id) on delete restrict,
  event_id uuid references public.events(id) on delete restrict,
  supplement_id uuid references public.event_supplements(id) on delete restrict,
  reason text not null check(char_length(reason) between 5 and 1000),
  status text not null default 'open' check(status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  check(num_nonnulls(forum_topic_id,article_id,event_id,supplement_id)=1)
);
create index reports_reporter_idx on public.reports(reporter_id,created_at desc);
create index reports_forum_idx on public.reports(forum_topic_id);
create index reports_article_idx on public.reports(article_id);
create index reports_event_idx on public.reports(event_id);
create index reports_supplement_idx on public.reports(supplement_id);
create index reports_status_idx on public.reports(status,created_at);
create table public.moderation_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete restrict,
  moderator_id uuid not null references public.profiles(id) on delete restrict,
  action text not null check(action in ('hide','restore','dismiss')),
  reason text not null check(char_length(reason) between 5 and 1000),
  previous_status text not null,
  next_status text not null,
  created_at timestamptz not null default now()
);
create index moderation_actions_report_idx on public.moderation_actions(report_id,created_at);
create index moderation_actions_moderator_idx on public.moderation_actions(moderator_id);
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
revoke all on public.reports,public.moderation_actions from anon,authenticated;
grant select on public.reports,public.moderation_actions to authenticated;
grant all on public.reports,public.moderation_actions to service_role;
create policy reports_own_read on public.reports for select to authenticated using(reporter_id=auth.uid() or public.is_moderator());
create policy moderation_read on public.moderation_actions for select to authenticated using(public.is_moderator());

create or replace function public.work_is_public(p_kind text,p_id uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
begin
  if p_kind='forum' then return exists(select 1 from public.forum_topics where id=p_id and status='published');
  elsif p_kind='article' then return exists(select 1 from public.articles where id=p_id and status='published');
  elsif p_kind='event' then return exists(select 1 from public.events where id=p_id and status='published');
  elsif p_kind='supplement' then return exists(select 1 from public.event_supplements s join public.events e on e.id=s.event_id where s.id=p_id and s.status='published' and e.status='published');
  end if;
  return false;
end; $$;
revoke execute on function public.work_is_public(text,uuid) from public,anon,authenticated;
grant execute on function public.work_is_public(text,uuid) to anon,authenticated;

create or replace function public.report_work(p_kind text,p_id uuid,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.work_is_public(p_kind,p_id) then raise exception 'WORK_NOT_PUBLIC'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
  if (select count(*) from public.reports where reporter_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'RATE_LIMIT'; end if;
  insert into public.reports(reporter_id,forum_topic_id,article_id,event_id,supplement_id,reason)
  values(auth.uid(),case when p_kind='forum' then p_id end,case when p_kind='article' then p_id end,case when p_kind='event' then p_id end,case when p_kind='supplement' then p_id end,btrim(p_reason)) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.moderate_report(p_report_id uuid,p_action text,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.reports; v_table text; v_id uuid; v_before text; v_after text;
begin
  if not public.is_moderator() then raise exception 'FORBIDDEN'; end if;
  if p_action not in ('hide','restore','dismiss') or length(btrim(p_reason)) not between 5 and 1000 then raise exception 'INVALID_ACTION'; end if;
  select * into r from public.reports where id=p_report_id for update;
  if not found then raise exception 'REPORT_NOT_FOUND'; end if;
  if r.forum_topic_id is not null then v_table:='forum_topics';v_id:=r.forum_topic_id;
  elsif r.article_id is not null then v_table:='articles';v_id:=r.article_id;
  elsif r.event_id is not null then v_table:='events';v_id:=r.event_id;
  else v_table:='event_supplements';v_id:=r.supplement_id; end if;
  execute format('select status from public.%I where id=$1 for update',v_table) into v_before using v_id;
  v_after:=v_before;
  if p_action='hide' then
    if v_before<>'published' then raise exception 'STATUS_CONFLICT'; end if;
    v_after:='hidden';
  elsif p_action='restore' then
    if v_before<>'hidden' then raise exception 'STATUS_CONFLICT'; end if;
    v_after:='published';
  end if;
  if v_after<>v_before then execute format('update public.%I set status=$1 where id=$2',v_table) using v_after,v_id; end if;
  update public.reports set status=case when p_action='dismiss' then 'dismissed' else 'resolved' end where id=r.id;
  insert into public.moderation_actions(report_id,moderator_id,action,reason,previous_status,next_status)
  values(r.id,auth.uid(),p_action,btrim(p_reason),v_before,v_after);
end; $$;
revoke execute on function public.report_work(text,uuid,text),public.moderate_report(uuid,text,text) from public,anon,authenticated;
grant execute on function public.report_work(text,uuid,text),public.moderate_report(uuid,text,text) to authenticated;
