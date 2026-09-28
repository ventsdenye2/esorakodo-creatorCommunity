-- Real-author interactions live outside the in-world forum floors.
create table public.work_comments (
 id uuid primary key default extensions.gen_random_uuid(), creator_id uuid not null references public.profiles(id) on delete restrict,
 forum_topic_id uuid references public.forum_topics(id) on delete restrict,
 article_id uuid references public.articles(id) on delete restrict,
 event_id uuid references public.events(id) on delete restrict,
 supplement_id uuid references public.event_supplements(id) on delete restrict,
 body text not null check(length(btrim(body)) between 1 and 2000),
 deleted boolean not null default false,created_at timestamptz not null default now(),
 check(num_nonnulls(forum_topic_id,article_id,event_id,supplement_id)=1)
);
create table public.work_bookmarks (
 id uuid primary key default extensions.gen_random_uuid(),creator_id uuid not null references public.profiles(id) on delete cascade,
 forum_topic_id uuid references public.forum_topics(id) on delete cascade,
 article_id uuid references public.articles(id) on delete cascade,
 event_id uuid references public.events(id) on delete cascade,
 supplement_id uuid references public.event_supplements(id) on delete cascade,
 created_at timestamptz not null default now(),check(num_nonnulls(forum_topic_id,article_id,event_id,supplement_id)=1)
);
create table public.work_likes (like public.work_bookmarks including defaults including constraints including indexes);
alter table public.work_likes add foreign key(creator_id) references public.profiles(id) on delete cascade;
alter table public.work_likes add foreign key(forum_topic_id) references public.forum_topics(id) on delete cascade;
alter table public.work_likes add foreign key(article_id) references public.articles(id) on delete cascade;
alter table public.work_likes add foreign key(event_id) references public.events(id) on delete cascade;
alter table public.work_likes add foreign key(supplement_id) references public.event_supplements(id) on delete cascade;

do $$ declare t text; c text;
begin
 foreach t in array array['work_comments','work_bookmarks','work_likes'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  execute format('create index %I on public.%I(creator_id,created_at desc)',t||'_creator_idx',t);
  foreach c in array array['forum_topic_id','article_id','event_id','supplement_id'] loop
   execute format('create index %I on public.%I(%I)',t||'_'||c||'_idx',t,c);
   if t<>'work_comments' then execute format('create unique index %I on public.%I(creator_id,%I) where %I is not null',t||'_'||c||'_unique',t,c,c); end if;
  end loop;
 end loop;
end $$;
create policy bookmarks_owner on public.work_bookmarks for select to authenticated using(creator_id=auth.uid());
create policy likes_visible on public.work_likes for select using(public.work_is_public(case when forum_topic_id is not null then 'forum' when article_id is not null then 'article' when event_id is not null then 'event' else 'supplement' end,coalesce(forum_topic_id,article_id,event_id,supplement_id)));
create policy comments_visible on public.work_comments for select using(not deleted and public.work_is_public(case when forum_topic_id is not null then 'forum' when article_id is not null then 'article' when event_id is not null then 'event' else 'supplement' end,coalesce(forum_topic_id,article_id,event_id,supplement_id)));

create or replace function public.interact_work(p_kind text,p_id uuid,p_action text,p_body text default '')
returns void language plpgsql security definer set search_path='' as $$
declare v_table text; v_column text; v_exists uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if not public.work_is_public(p_kind,p_id) then raise exception 'WORK_NOT_PUBLIC'; end if;
 v_column:=case p_kind when 'forum' then 'forum_topic_id' when 'article' then 'article_id' when 'event' then 'event_id' when 'supplement' then 'supplement_id' end;
 if v_column is null then raise exception 'INVALID_TARGET'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_id::text,3));
 if p_action='comment' then
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,4));
  if (select count(*) from public.work_comments where creator_id=auth.uid() and created_at>now()-interval '1 hour')>=30 then raise exception 'RATE_LIMIT'; end if;
  execute format('insert into public.work_comments(creator_id,%I,body) values($1,$2,$3)',v_column) using auth.uid(),p_id,btrim(p_body);
 elsif p_action in ('like','bookmark') then
  v_table:=case p_action when 'like' then 'work_likes' else 'work_bookmarks' end;
  execute format('select id from public.%I where creator_id=$1 and %I=$2',v_table,v_column) into v_exists using auth.uid(),p_id;
  if v_exists is not null then execute format('delete from public.%I where id=$1',v_table) using v_exists;
  else execute format('insert into public.%I(creator_id,%I) values($1,$2)',v_table,v_column) using auth.uid(),p_id; end if;
 else raise exception 'INVALID_ACTION'; end if;
end; $$;
create or replace function public.remove_work_comment(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 update public.work_comments set deleted=true where id=p_id and creator_id=auth.uid();
 if not found then raise exception 'FORBIDDEN'; end if;
end; $$;
revoke execute on function public.interact_work(text,uuid,text,text),public.remove_work_comment(uuid) from public,anon,authenticated;
grant execute on function public.interact_work(text,uuid,text,text),public.remove_work_comment(uuid) to authenticated;
