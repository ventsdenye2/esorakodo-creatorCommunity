-- Stable editorial taxonomy and complete publication metadata.
insert into public.tags(name) values ('校园怪谈'),('个人见闻'),('校园生活'),('人物故事'),('历史'),('悬疑'),('科幻'),('旅行'),('随笔') on conflict(name) do nothing;
alter table public.event_supplements drop constraint event_supplements_kind_check;
alter table public.event_supplements add constraint event_supplements_kind_check check(kind in ('detail','perspective','aftermath','rumor','interpretation','article','testimony','document'));
create or replace function public.save_article(p_id uuid,p_expected_version bigint,p_title text,p_summary text,p_body jsonb,p_tags text[],p_publish boolean) returns uuid language plpgsql security definer set search_path='' as $$
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
 select id into tag_id from public.tags where name=tag and name in ('校园怪谈','个人见闻','校园生活','人物故事','历史','悬疑','科幻','旅行','随笔');
 if tag_id is null then raise exception 'CONTENT_INVALID_TAGS' using errcode='23514'; end if;
 insert into public.article_tags values(target,tag_id) on conflict do nothing;
 end loop;
 perform public.sync_content_links('article',target,(select coalesce(jsonb_agg(value),'[]') from jsonb_array_elements(p_body->'blocks') where value->>'type'='entity'));
 return target;
end $$;
create or replace function public.save_event(p_id uuid,p_expected_version bigint,p_title text,p_summary text,p_time_range text,p_causes text,p_consequences text,p_nodes jsonb,p_publish boolean,p_links jsonb default '[]',p_starts_on date default null,p_ends_on date default null) returns uuid language plpgsql security definer set search_path='' as $$
declare e public.events; target uuid; n jsonb; node_id uuid; ids uuid[]:='{}'; pos integer:=0; begin
 if auth.uid() is null then raise exception 'CONTENT_FORBIDDEN' using errcode='42501'; end if;
 if (p_publish or exists(select 1 from public.events where id=p_id and status='published')) and (btrim(coalesce(p_summary,''))='' or btrim(coalesce(p_time_range,''))='') then raise exception 'CONTENT_INVALID_EVENT_DETAILS' using errcode='23514'; end if;
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
create or replace function public.validate_content_body(p_body jsonb) returns void language plpgsql set search_path='' as $$
declare b jsonb; begin
 if jsonb_typeof(p_body) is distinct from 'object' or p_body->>'schema_version' is distinct from '1' or jsonb_typeof(p_body->'blocks') is distinct from 'array' then raise exception 'CONTENT_INVALID_BODY' using errcode='23514'; end if;
 if jsonb_array_length(p_body->'blocks')>150 or octet_length(p_body::text)>500000 then raise exception 'CONTENT_INVALID_BODY' using errcode='23514'; end if;
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
