-- Owner-controlled edit modes, revocable invitations and immutable branch checkpoints.
create table public.forum_edit_settings (
 topic_id uuid primary key references public.forum_topics(id) on delete cascade,
 mode text not null default 'invited' check(mode in ('owner','invited','everyone')),
 head_id uuid
);
alter table public.forum_edit_settings enable row level security;
grant select on public.forum_edit_settings to authenticated;
revoke insert,update,delete on public.forum_edit_settings from anon,authenticated;
create policy forum_settings_read on public.forum_edit_settings for select to authenticated using(public.can_edit_forum(topic_id));
create or replace function public.can_edit_forum(p_topic_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.forum_topics t left join public.forum_edit_settings s on s.topic_id=t.id
 where t.id=p_topic_id and t.status in ('draft','published') and (t.creator_id=auth.uid()
 or coalesce(s.mode,'invited')='everyone'
 or (coalesce(s.mode,'invited')='invited' and exists(select 1 from public.forum_collaborators c where c.topic_id=t.id and c.creator_id=auth.uid()))));
$$;
create function public.set_forum_edit_mode(p_topic_id uuid,p_mode text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.forum_topics where id=p_topic_id and creator_id=auth.uid() and status in ('draft','published') for update;
 if not found then raise insufficient_privilege using message='FORUM_OWNER_REQUIRED'; end if;
 if p_mode is null or p_mode not in ('owner','invited','everyone') then raise check_violation using message='FORUM_MODE_INVALID'; end if;
 insert into public.forum_edit_settings(topic_id,mode) values(p_topic_id,p_mode) on conflict(topic_id) do update set mode=excluded.mode;
 delete from public.forum_edit_presence p where p.topic_id=p_topic_id and p.creator_id<>auth.uid() and
 (p_mode='owner' or (p_mode='invited' and not exists(select 1 from public.forum_collaborators c where c.topic_id=p_topic_id and c.creator_id=p.creator_id)));
end; $$;

create table public.forum_invite_links (
 topic_id uuid primary key references public.forum_topics(id) on delete cascade,
 token_hash text not null unique check(length(token_hash)=64),
 expires_at timestamptz not null, created_by uuid not null references public.profiles(id) on delete restrict
);
create index forum_invite_links_creator_idx on public.forum_invite_links(created_by);
alter table public.forum_invite_links enable row level security;
revoke all on public.forum_invite_links from anon,authenticated;
-- Tokens are returned only on creation; the database retains only their SHA-256 digest.
create function public.rotate_forum_invite(p_topic_id uuid,p_revoke boolean default false) returns text language plpgsql security definer set search_path='' as $$
declare token text;
begin
 perform 1 from public.forum_topics where id=p_topic_id and creator_id=auth.uid() and status in ('draft','published') for update;
 if not found then raise insufficient_privilege using message='FORUM_OWNER_REQUIRED'; end if;
 delete from public.forum_invite_links where topic_id=p_topic_id;
 if p_revoke then return null; end if;
 token:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.forum_invite_links(topic_id,token_hash,expires_at,created_by) values(p_topic_id,encode(extensions.digest(token,'sha256'),'hex'),now()+interval '7 days',auth.uid());
 return token;
end; $$;
create function public.accept_forum_invite(p_token text) returns uuid language plpgsql security definer set search_path='' as $$
declare target uuid; t public.forum_topics;
begin
 if auth.uid() is null then raise insufficient_privilege using message='FORUM_AUTH_REQUIRED'; end if;
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise check_violation using message='FORUM_INVITE_INVALID'; end if;
 select topic_id into target from public.forum_invite_links where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and expires_at>now();
 if target is null then raise check_violation using message='FORUM_INVITE_INVALID'; end if;
 select * into t from public.forum_topics where id=target for update;
 -- Check again after taking the same lock as revoke/rotate.
 if t.status not in ('draft','published') or not exists(select 1 from public.forum_invite_links where topic_id=target and token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and expires_at>now()) then raise check_violation using message='FORUM_INVITE_INVALID'; end if;
 if exists(select 1 from public.forum_edit_settings where topic_id=target and mode='owner') then raise check_violation using message='FORUM_INVITE_DISABLED'; end if;
 if auth.uid()<>t.creator_id then insert into public.forum_collaborators(topic_id,creator_id,added_by) values(target,auth.uid(),t.creator_id) on conflict do nothing; end if;
 return target;
end; $$;
create function public.search_forum_creators(p_topic_id uuid,p_query text) returns table(id uuid,handle text,display_name text,avatar_asset_id uuid) language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.forum_topics t where t.id=p_topic_id and t.creator_id=auth.uid()) then raise insufficient_privilege using message='FORUM_OWNER_REQUIRED'; end if;
 if char_length(btrim(p_query)) not between 2 and 60 then return; end if;
 return query select p.id,p.handle,p.display_name,p.avatar_asset_id from public.profiles p where p.id<>auth.uid()
 and (strpos(lower(p.handle),lower(trim(leading '@' from btrim(p_query))))>0 or strpos(lower(p.display_name),lower(btrim(p_query)))>0) order by p.handle limit 12;
end; $$;

-- Public editing allows one's own account/media, never arbitrary private assets.
create or replace function public.forum_account_allowed(p_topic_id uuid,p_account_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.forum_accounts a join public.forum_topics t on t.id=p_topic_id where a.id=p_account_id and
 (a.created_by=t.creator_id or (a.created_by=auth.uid() and public.can_edit_forum(t.id))
 or exists(select 1 from public.forum_collaborators c where c.topic_id=t.id and c.creator_id=a.created_by)
 or exists(select 1 from public.forum_topic_accounts p where p.topic_id=t.id and p.account_id=a.id)));
$$;
create or replace function public.sync_forum_message_media() returns trigger language plpgsql security definer set search_path='' as $$
declare line text; matched text[]; asset uuid; owner_id uuid;
begin
 select creator_id into owner_id from public.forum_topics where id=new.topic_id;
 delete from public.forum_message_media where message_id=new.id;
 foreach line in array string_to_array(replace(new.body,E'\r',''),E'\n') loop
  if position('![' in line)>0 then
   matched:=regexp_match(btrim(line),'^!\[([^]\r\n]*)\]\(/api/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)$','i');
   if matched is null then raise check_violation using message='FORUM_IMAGE_INVALID'; end if;
   asset:=matched[2]::uuid;
   if not exists(select 1 from public.media_assets m where m.id=asset and m.status='ready' and
    (m.uploader_id=owner_id or (m.uploader_id=auth.uid() and public.can_edit_forum(new.topic_id))
    or exists(select 1 from public.forum_collaborators c where c.topic_id=new.topic_id and c.creator_id=m.uploader_id)
    or exists(select 1 from public.forum_topic_edit_media p where p.topic_id=new.topic_id and p.asset_id=asset))) then raise check_violation using message='FORUM_IMAGE_INVALID'; end if;
   insert into public.forum_topic_edit_media values(new.topic_id,asset) on conflict do nothing;
   insert into public.forum_message_media values(new.id,asset) on conflict do nothing;
  end if;
 end loop; return new;
end; $$;

create table public.forum_checkpoints (
 id uuid primary key default extensions.gen_random_uuid(), topic_id uuid not null references public.forum_topics(id) on delete cascade,
 parent_id uuid, label text not null check(char_length(label) between 1 and 100),
 state text not null check(length(state) between 1 and 2800000), document_revision bigint not null,
 created_by uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now(),
 unique(topic_id,id), foreign key(topic_id,parent_id) references public.forum_checkpoints(topic_id,id)
);
create index forum_checkpoints_parent_idx on public.forum_checkpoints(topic_id,parent_id);
create index forum_checkpoints_creator_idx on public.forum_checkpoints(created_by);
create index forum_checkpoints_date_idx on public.forum_checkpoints(topic_id,created_at);
alter table public.forum_edit_settings add constraint forum_checkpoint_head foreign key(topic_id,head_id) references public.forum_checkpoints(topic_id,id);
create index forum_settings_head_idx on public.forum_edit_settings(topic_id,head_id);
alter table public.forum_checkpoints enable row level security;
grant select on public.forum_checkpoints to authenticated;
revoke insert,update,delete on public.forum_checkpoints from anon,authenticated;
create policy forum_checkpoint_read on public.forum_checkpoints for select to authenticated using(public.can_edit_forum(topic_id));
create function public.create_forum_checkpoint(p_topic_id uuid,p_expected_revision bigint,p_label text) returns uuid language plpgsql security definer set search_path='' as $$
declare d public.forum_edit_documents; parent uuid; result uuid;
begin
 perform 1 from public.forum_topics where id=p_topic_id for update;
 if not public.can_edit_forum(p_topic_id) then raise insufficient_privilege using message='FORUM_EDITOR_REQUIRED'; end if;
 select * into d from public.forum_edit_documents where topic_id=p_topic_id for update;
 if not found or d.revision is distinct from p_expected_revision then raise exception 'FORUM_EDIT_CONFLICT'; end if;
 if p_label is null or char_length(btrim(p_label)) not between 1 and 100 then raise check_violation using message='FORUM_CHECKPOINT_LABEL'; end if;
 insert into public.forum_edit_settings(topic_id) values(p_topic_id) on conflict do nothing;
 select head_id into parent from public.forum_edit_settings where topic_id=p_topic_id;
 insert into public.forum_checkpoints(topic_id,parent_id,label,state,document_revision,created_by) values(p_topic_id,parent,btrim(p_label),d.state,d.revision,auth.uid()) returning id into result;
 update public.forum_edit_settings set head_id=result where topic_id=p_topic_id;
 return result;
end; $$;
create function public.restore_forum_checkpoint(p_topic_id uuid,p_checkpoint_id uuid,p_expected_revision bigint,p_state text,p_first_id text,p_snapshot jsonb) returns void language plpgsql security definer set search_path='' as $$
declare d public.forum_edit_documents;
begin
 perform 1 from public.forum_topics where id=p_topic_id and creator_id=auth.uid() and status in ('draft','published') for update;
 if not found then raise insufficient_privilege using message='FORUM_OWNER_REQUIRED'; end if;
 if not exists(select 1 from public.forum_checkpoints where id=p_checkpoint_id and topic_id=p_topic_id) then raise check_violation using message='FORUM_CHECKPOINT_INVALID'; end if;
 -- Preserve the pre-restore working state on its original branch in the same transaction.
 perform public.create_forum_checkpoint(p_topic_id,p_expected_revision,'回退前自动存档');
 d:=public.commit_forum_edit(p_topic_id,p_expected_revision,p_state,p_first_id,p_snapshot,false);
 if d.publish_error is not null then raise check_violation using message='FORUM_RESTORE_INCOMPLETE'; end if;
 update public.forum_edit_settings set head_id=p_checkpoint_id where topic_id=p_topic_id;
end; $$;
revoke all on function public.set_forum_edit_mode(uuid,text),public.rotate_forum_invite(uuid,boolean),public.accept_forum_invite(text),public.search_forum_creators(uuid,text),public.create_forum_checkpoint(uuid,bigint,text),public.restore_forum_checkpoint(uuid,uuid,bigint,text,text,jsonb) from public,anon;
grant execute on function public.set_forum_edit_mode(uuid,text),public.rotate_forum_invite(uuid,boolean),public.accept_forum_invite(text),public.search_forum_creators(uuid,text),public.create_forum_checkpoint(uuid,bigint,text),public.restore_forum_checkpoint(uuid,uuid,bigint,text,text,jsonb) to authenticated;
notify pgrst,'reload schema';

-- Neighbours are independent of the first discovery page's 50-row limit.
create function public.forum_topic_neighbors(p_topic_id uuid,p_board text default null,p_tag text default null)
returns table(previous_id uuid,previous_title text,next_id uuid,next_title text)
language sql stable security invoker set search_path='' as $$
 with visible as (
  select t.id,t.title,t.published_at from public.forum_topics t where t.status='published'
  and (p_board is null or t.board=p_board)
  and (p_tag is null or exists(select 1 from public.forum_topic_hashtags l join public.hashtags h on h.id=l.hashtag_id where l.topic_id=t.id and h.normalized_name=lower(regexp_replace(btrim(p_tag),'[[:space:]]+',' ','g'))))
 ), ordered as (
  select id,lag(id) over w previous_id,lag(title) over w previous_title,lead(id) over w next_id,lead(title) over w next_title
  from visible window w as (order by published_at desc,id desc)
 ) select previous_id,previous_title,next_id,next_title from ordered where id=p_topic_id;
$$;
revoke all on function public.forum_topic_neighbors(uuid,text,text) from public;
grant execute on function public.forum_topic_neighbors(uuid,text,text) to anon,authenticated;
