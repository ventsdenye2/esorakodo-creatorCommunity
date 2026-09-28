-- M4/M5: explicit editorial and archive aggregates, RPC-only mutation.
create table public.events (
 id uuid primary key default extensions.gen_random_uuid(), creator_id uuid not null references public.profiles(id),
 title text not null check(char_length(btrim(title)) between 1 and 160), summary text not null default '' check(char_length(summary)<=2000),
 time_range text not null default '' check(char_length(time_range)<=160), causes text not null default '' check(char_length(causes)<=10000), consequences text not null default '' check(char_length(consequences)<=10000),
 starts_on date, ends_on date, check(ends_on is null or starts_on is null or ends_on>=starts_on),
 status text not null default 'draft' check(status in ('draft','published','hidden')), published_at timestamptz,
 version bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.articles (
 id uuid primary key default extensions.gen_random_uuid(), creator_id uuid not null references public.profiles(id),
 title text not null check(char_length(btrim(title)) between 1 and 160), summary text not null default '' check(char_length(summary)<=2000),
 body jsonb not null, schema_version integer not null default 1 check(schema_version=1),
 status text not null default 'draft' check(status in ('draft','published','hidden')), published_at timestamptz,
 version bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.tags(id uuid primary key default extensions.gen_random_uuid(), name text not null unique check(char_length(btrim(name)) between 1 and 32));
create table public.article_tags(article_id uuid not null references public.articles(id) on delete cascade, tag_id uuid not null references public.tags(id), primary key(article_id,tag_id));
create index article_tags_tag_idx on public.article_tags(tag_id);
create table public.event_timeline_nodes (
 id uuid primary key default extensions.gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
 sort_order integer not null check(sort_order>0), label text not null check(char_length(label)<=160), title text not null check(char_length(btrim(title)) between 1 and 160), description text not null default '' check(char_length(description)<=10000),
 unique(event_id,sort_order) deferrable initially deferred, unique(event_id,id)
);
create table public.event_supplements (
 id uuid primary key default extensions.gen_random_uuid(), event_id uuid not null references public.events(id), timeline_node_id uuid,
 creator_id uuid not null references public.profiles(id), title text not null check(char_length(btrim(title)) between 1 and 160),
 kind text not null check(kind in ('article','testimony','document')), body jsonb not null, schema_version integer not null default 1 check(schema_version=1),
 status text not null default 'draft' check(status in ('draft','published','hidden')), published_at timestamptz,
 version bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(event_id,timeline_node_id) references public.event_timeline_nodes(event_id,id) on delete restrict
);
create index event_supplements_event_idx on public.event_supplements(event_id);
create index event_supplements_node_idx on public.event_supplements(timeline_node_id);

-- Relationship tables use real foreign keys; no polymorphic unconstrained IDs.
do $$ declare t text; parent text; key text; begin
 for t,parent,key in select * from (values ('article_entity_links','articles','article_id'),('event_entity_links','events','event_id'),('supplement_entity_links','event_supplements','supplement_id')) v loop
 execute format('create table public.%I (id uuid primary key default extensions.gen_random_uuid(), %I uuid not null references public.%I(id) on delete cascade, student_id uuid references public.students(id), college_id uuid references public.colleges(id), place_id uuid references public.places(id), %I uuid references public.events(id), check(num_nonnulls(student_id,college_id,place_id,%I)=1))',t,key,parent,case when t='event_entity_links' then 'related_event_id' else 'event_id' end,case when t='event_entity_links' then 'related_event_id' else 'event_id' end);
 execute format('create index on public.%I(%I)',t,key);
 execute format('create index on public.%I(student_id)',t); execute format('create index on public.%I(college_id)',t); execute format('create index on public.%I(place_id)',t);
 execute format('create index on public.%I(%I)',t,case when t='event_entity_links' then 'related_event_id' else 'event_id' end);
 end loop;
end $$;

do $$ declare t text; begin
 foreach t in array array['articles','events','event_supplements'] loop
 execute format('create index on public.%I(creator_id)',t);
 execute format('create index on public.%I(published_at desc) where status=''published''',t);
 execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',t||'_updated_at',t);
 end loop;
 foreach t in array array['articles','events','event_supplements','tags','article_tags','event_timeline_nodes','article_entity_links','event_entity_links','supplement_entity_links'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to anon,authenticated',t);
 end loop;
end $$;
create policy events_read on public.events for select using(status='published' or creator_id=auth.uid());
create policy articles_read on public.articles for select using(status='published' or creator_id=auth.uid());
create policy supplements_read on public.event_supplements for select using(creator_id=auth.uid() or (status='published' and exists(select 1 from public.events e where e.id=event_id and e.status='published')));
create policy tags_read on public.tags for select using(exists(select 1 from public.article_tags at where at.tag_id=id));
create policy article_tags_read on public.article_tags for select using(exists(select 1 from public.articles a where a.id=article_id));
create policy nodes_read on public.event_timeline_nodes for select using(exists(select 1 from public.events e where e.id=event_id));
create policy article_links_read on public.article_entity_links for select using(exists(select 1 from public.articles a where a.id=article_id));
create policy event_links_read on public.event_entity_links for select using(exists(select 1 from public.events e where e.id=event_id));
create policy supplement_links_read on public.supplement_entity_links for select using(exists(select 1 from public.event_supplements s where s.id=supplement_id));

create function public.validate_content_image(p_asset_id uuid) returns void language plpgsql set search_path='' as $$ begin raise exception 'MEDIA_NOT_READY' using errcode='23514'; end $$;
create function public.validate_content_body(p_body jsonb) returns void language plpgsql set search_path='' as $$
declare b jsonb; begin
 if jsonb_typeof(p_body) is distinct from 'object' or p_body->>'schema_version' is distinct from '1' or jsonb_typeof(p_body->'blocks') is distinct from 'array' then raise exception 'CONTENT_INVALID_BODY' using errcode='23514'; end if;
 if jsonb_array_length(p_body->'blocks')>200 or octet_length(p_body::text)>500000 then raise exception 'CONTENT_INVALID_BODY' using errcode='23514'; end if;
 for b in select value from jsonb_array_elements(p_body->'blocks') loop
 if b->>'type' in ('paragraph','heading','quote') then
  if jsonb_typeof(b->'text') is distinct from 'string' or char_length(b->>'text')>20000 then raise exception 'CONTENT_INVALID_BODY' using errcode='23514'; end if;
 elsif b->>'type'='entity' then
  if b->>'entity_type' not in ('student','college','place','event') or b->>'entity_type' is null or b->>'entity_id' is null or jsonb_typeof(b->'label') is distinct from 'string' or char_length(b->>'label')>160 then raise exception 'CONTENT_INVALID_ENTITY' using errcode='23514'; end if;
  perform (b->>'entity_id')::uuid;
 elsif b->>'type'='image' then
  if b->>'asset_id' is null or jsonb_typeof(b->'alt') is distinct from 'string' or char_length(b->>'alt')>500 then raise exception 'CONTENT_INVALID_BODY' using errcode='23514'; end if;
  perform public.validate_content_image((b->>'asset_id')::uuid);
 else raise exception 'CONTENT_INVALID_BODY' using errcode='23514'; end if;
 end loop;
end $$;

-- Internal helper accepts only a hardcoded table mapping, and is not executable by clients.
create function public.sync_content_links(p_kind text,p_id uuid,p_links jsonb) returns void language plpgsql set search_path='' as $$
declare t text; k text; b jsonb; c text; entity uuid; begin
 case p_kind when 'article' then t:='article_entity_links';k:='article_id'; when 'event' then t:='event_entity_links';k:='event_id'; when 'supplement' then t:='supplement_entity_links';k:='supplement_id'; else raise exception 'CONTENT_INVALID_KIND'; end case;
 if jsonb_typeof(p_links) is distinct from 'array' or jsonb_array_length(p_links)>200 then raise exception 'CONTENT_INVALID_ENTITY' using errcode='23514'; end if;
 execute format('delete from public.%I where %I=$1',t,k) using p_id;
 for b in select distinct value from jsonb_array_elements(p_links) loop
 c:=case b->>'entity_type' when 'student' then 'student_id' when 'college' then 'college_id' when 'place' then 'place_id' when 'event' then case when p_kind='event' then 'related_event_id' else 'event_id' end end;
 if c is null or b->>'entity_id' is null then raise exception 'CONTENT_INVALID_ENTITY' using errcode='23514'; end if;
 entity:=(b->>'entity_id')::uuid;
 if b->>'entity_type'='event' and not exists(select 1 from public.events where id=entity and status='published') then raise exception 'CONTENT_INVALID_ENTITY' using errcode='23514'; end if;
 execute format('insert into public.%I(%I,%I) values($1,$2)',t,k,c) using p_id,entity;
 end loop;
end $$;

create function public.save_article(p_id uuid,p_expected_version bigint,p_title text,p_summary text,p_body jsonb,p_tags text[],p_publish boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare a public.articles; tag text; tag_id uuid; target uuid; begin
 if auth.uid() is null then raise exception 'CONTENT_FORBIDDEN' using errcode='42501'; end if;
 perform public.validate_content_body(p_body);
 if p_tags is null or cardinality(p_tags)>3 then raise exception 'CONTENT_INVALID_TAGS' using errcode='23514'; end if;
 if p_publish and jsonb_array_length(p_body->'blocks')=0 then raise exception 'CONTENT_INVALID_BODY' using errcode='23514'; end if;
 if p_id is null then
 insert into public.articles(creator_id,title,summary,body,status,published_at) values(auth.uid(),btrim(p_title),p_summary,p_body,case when p_publish then 'published' else 'draft' end,case when p_publish then now() end) returning id into target;
 else
 select * into a from public.articles where id=p_id for update;
 if not found then raise exception 'CONTENT_NOT_FOUND' using errcode='P0002'; end if;
 if a.creator_id<>auth.uid() or a.status='hidden' then raise exception 'CONTENT_FORBIDDEN' using errcode='42501'; end if;
 if a.version is distinct from p_expected_version then raise exception 'CONTENT_VERSION_CONFLICT' using errcode='40001'; end if;
 if a.status='published' and jsonb_array_length(p_body->'blocks')=0 then raise exception 'CONTENT_INVALID_BODY' using errcode='23514'; end if;
 target:=p_id;
 update public.articles set title=btrim(p_title),summary=p_summary,body=p_body,status=case when p_publish then 'published' else status end,published_at=case when p_publish then coalesce(published_at,now()) else published_at end,version=version+1 where id=target;
 end if;
 delete from public.article_tags where article_id=target;
 foreach tag in array p_tags loop
 tag:=lower(btrim(tag));
 if char_length(tag) not between 1 and 32 then raise exception 'CONTENT_INVALID_TAGS' using errcode='23514'; end if;
 insert into public.tags(name) values(tag) on conflict(name) do update set name=excluded.name returning id into tag_id;
 insert into public.article_tags values(target,tag_id) on conflict do nothing;
 end loop;
 perform public.sync_content_links('article',target,(select coalesce(jsonb_agg(value),'[]') from jsonb_array_elements(p_body->'blocks') where value->>'type'='entity'));
 return target;
end $$;

create function public.save_event(p_id uuid,p_expected_version bigint,p_title text,p_summary text,p_time_range text,p_causes text,p_consequences text,p_nodes jsonb,p_publish boolean,p_links jsonb default '[]',p_starts_on date default null,p_ends_on date default null) returns uuid language plpgsql security definer set search_path='' as $$
declare e public.events; target uuid; n jsonb; node_id uuid; ids uuid[]:='{}'; pos integer:=0; begin
 if auth.uid() is null then raise exception 'CONTENT_FORBIDDEN' using errcode='42501'; end if;
 if jsonb_typeof(p_nodes) is distinct from 'array' or jsonb_array_length(p_nodes)>100 or (p_publish and jsonb_array_length(p_nodes)=0) then raise exception 'CONTENT_INVALID_NODES' using errcode='23514'; end if;
 if p_id is null then
 insert into public.events(creator_id,title,summary,time_range,causes,consequences,starts_on,ends_on,status,published_at) values(auth.uid(),btrim(p_title),p_summary,p_time_range,p_causes,p_consequences,p_starts_on,p_ends_on,case when p_publish then 'published' else 'draft' end,case when p_publish then now() end) returning id into target;
 else
 select * into e from public.events where id=p_id for update;
 if not found then raise exception 'CONTENT_NOT_FOUND' using errcode='P0002'; end if;
 if e.creator_id<>auth.uid() or e.status='hidden' then raise exception 'CONTENT_FORBIDDEN' using errcode='42501'; end if;
 if e.version is distinct from p_expected_version then raise exception 'CONTENT_VERSION_CONFLICT' using errcode='40001'; end if;
 if e.status='published' and jsonb_array_length(p_nodes)=0 then raise exception 'CONTENT_INVALID_NODES' using errcode='23514'; end if;
 target:=p_id;
 update public.events set title=btrim(p_title),summary=p_summary,time_range=p_time_range,causes=p_causes,consequences=p_consequences,starts_on=p_starts_on,ends_on=p_ends_on,status=case when p_publish then 'published' else status end,published_at=case when p_publish then coalesce(published_at,now()) else published_at end,version=version+1 where id=target;
 end if;
 for n in select value from jsonb_array_elements(p_nodes) loop
 pos:=pos+1; node_id:=coalesce(nullif(n->>'id','')::uuid,extensions.gen_random_uuid());
 if node_id=any(ids) or exists(select 1 from public.event_timeline_nodes where id=node_id and event_id<>target) then raise exception 'CONTENT_INVALID_NODES' using errcode='23514'; end if;
 ids:=array_append(ids,node_id);
 insert into public.event_timeline_nodes(id,event_id,sort_order,label,title,description) values(node_id,target,pos,coalesce(n->>'label',''),n->>'title',coalesce(n->>'description','')) on conflict(id) do update set sort_order=excluded.sort_order,label=excluded.label,title=excluded.title,description=excluded.description;
 end loop;
 if exists(select 1 from public.event_supplements where event_id=target and timeline_node_id is not null and not(timeline_node_id=any(ids))) then raise exception 'CONTENT_NODE_HAS_SUPPLEMENTS' using errcode='23514'; end if;
 delete from public.event_timeline_nodes where event_id=target and not(id=any(ids));
 perform public.sync_content_links('event',target,p_links);
 return target;
end $$;

create function public.save_event_supplement(p_id uuid,p_expected_version bigint,p_event_id uuid,p_timeline_node_id uuid,p_title text,p_kind text,p_body jsonb,p_publish boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare s public.event_supplements; target uuid; begin
 if auth.uid() is null then raise exception 'CONTENT_FORBIDDEN' using errcode='42501'; end if;
 -- Lock the archive before the supplement; timeline edits use the same lock.
 perform 1 from public.events where id=p_event_id and status='published' for update;
 if not found then raise exception 'CONTENT_INVALID_EVENT' using errcode='23514'; end if;
 perform public.validate_content_body(p_body);
 if p_publish and jsonb_array_length(p_body->'blocks')=0 then raise exception 'CONTENT_INVALID_BODY' using errcode='23514'; end if;
 if p_id is null then
 insert into public.event_supplements(event_id,timeline_node_id,creator_id,title,kind,body,status,published_at) values(p_event_id,p_timeline_node_id,auth.uid(),btrim(p_title),p_kind,p_body,case when p_publish then 'published' else 'draft' end,case when p_publish then now() end) returning id into target;
 else
 select * into s from public.event_supplements where id=p_id for update;
 if not found then raise exception 'CONTENT_NOT_FOUND' using errcode='P0002'; end if;
 if s.creator_id<>auth.uid() or s.status='hidden' or s.event_id<>p_event_id then raise exception 'CONTENT_FORBIDDEN' using errcode='42501'; end if;
 if s.version is distinct from p_expected_version then raise exception 'CONTENT_VERSION_CONFLICT' using errcode='40001'; end if;
 if s.status='published' and jsonb_array_length(p_body->'blocks')=0 then raise exception 'CONTENT_INVALID_BODY' using errcode='23514'; end if;
 target:=p_id;
 update public.event_supplements set timeline_node_id=p_timeline_node_id,title=btrim(p_title),kind=p_kind,body=p_body,status=case when p_publish then 'published' else status end,published_at=case when p_publish then coalesce(published_at,now()) else published_at end,version=version+1 where id=target;
 end if;
 perform public.sync_content_links('supplement',target,(select coalesce(jsonb_agg(value),'[]') from jsonb_array_elements(p_body->'blocks') where value->>'type'='entity'));
 return target;
end $$;

revoke all on function public.validate_content_image(uuid),public.validate_content_body(jsonb),public.sync_content_links(text,uuid,jsonb),public.save_article(uuid,bigint,text,text,jsonb,text[],boolean),public.save_event(uuid,bigint,text,text,text,text,text,jsonb,boolean,jsonb,date,date),public.save_event_supplement(uuid,bigint,uuid,uuid,text,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.save_article(uuid,bigint,text,text,jsonb,text[],boolean),public.save_event(uuid,bigint,text,text,text,text,text,jsonb,boolean,jsonb,date,date),public.save_event_supplement(uuid,bigint,uuid,uuid,text,text,jsonb,boolean) to authenticated;
