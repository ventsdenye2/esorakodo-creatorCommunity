-- Portraits remain ordinary, revisioned Markdown images in the student body.
-- Retain their media references because public Wiki history can restore older images.
create table public.student_portrait_media (
 student_id uuid not null references public.students(id) on delete cascade,
 asset_id uuid not null references public.media_assets(id) on delete restrict,
 primary key(student_id,asset_id)
);
create index student_portrait_media_asset_idx on public.student_portrait_media(asset_id);
alter table public.student_portrait_media enable row level security;
grant select on public.student_portrait_media to anon,authenticated;
revoke insert,update,delete on public.student_portrait_media from anon,authenticated;
create policy student_portrait_media_read on public.student_portrait_media for select using(true);
create policy student_portrait_image_read on public.media_assets for select using(status='ready' and exists(select 1 from public.student_portrait_media p where p.asset_id=media_assets.id));
create function public.register_student_portraits() returns trigger language plpgsql security definer set search_path='' as $$
declare line text; matched text[]; asset uuid;
begin
 foreach line in array string_to_array(replace(new.body,E'\r',''),E'\n') loop
  matched:=regexp_match(btrim(line),'^!\[([^]\r\n]*)\]\(/api/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)$','i');
  if matched is not null then
   asset:=matched[2]::uuid;
   if not exists(select 1 from public.media_assets m where m.id=asset and m.status='ready' and
     (m.uploader_id=auth.uid() or exists(select 1 from public.student_portrait_media p where p.student_id=new.id and p.asset_id=asset))) then
    raise check_violation using message='WIKI_PORTRAIT_INVALID';
   end if;
   insert into public.student_portrait_media values(new.id,asset) on conflict do nothing;
  end if;
 end loop;
 return new;
end; $$;
create trigger students_register_portraits after insert or update of body on public.students for each row execute function public.register_student_portraits();
revoke all on function public.register_student_portraits() from public,anon,authenticated;
notify pgrst,'reload schema';
