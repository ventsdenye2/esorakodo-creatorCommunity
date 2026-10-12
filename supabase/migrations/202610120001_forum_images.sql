-- Forum image references use stable media IDs inside standalone Markdown lines.
create table public.forum_message_media (
  message_id uuid not null references public.forum_messages(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  primary key (message_id, asset_id)
);
create index forum_message_media_asset_idx on public.forum_message_media(asset_id);
alter table public.forum_message_media enable row level security;
revoke all on public.forum_message_media from anon, authenticated;
grant select on public.forum_message_media to anon, authenticated;
grant all on public.forum_message_media to service_role;
create policy forum_message_media_read on public.forum_message_media for select
using (exists (select 1 from public.forum_messages m where m.id = message_id));
create policy media_forum_published_read on public.media_assets for select
using (status = 'ready' and exists (
  select 1 from public.forum_message_media fm
  join public.forum_messages m on m.id = fm.message_id
  join public.forum_topics t on t.id = m.topic_id
  where fm.asset_id = media_assets.id and t.status = 'published'
));

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
      if not exists (select 1 from public.media_assets where id = v_id and uploader_id = v_creator and status = 'ready') then
        raise exception 'FORUM_IMAGE_INVALID' using errcode = '23514';
      end if;
      insert into public.forum_message_media(message_id, asset_id) values(new.id, v_id) on conflict do nothing;
    end if;
  end loop;
  return new;
end;
$$;
revoke execute on function public.sync_forum_message_media() from public, anon, authenticated;
create trigger forum_messages_sync_media after insert or update of body on public.forum_messages
for each row execute function public.sync_forum_message_media();
-- Existing plain-text floors stay untouched. There is no content rewrite/backfill.
