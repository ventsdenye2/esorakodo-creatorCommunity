-- A repeatable character creator, preserving the Wiki revision transaction.
create table public.student_character_cards (
  student_id uuid primary key references public.students(id) on delete cascade,
  creator_id uuid not null references public.profiles(id),
  request_id uuid not null,
  portrait_asset_id uuid not null references public.media_assets(id),
  card_asset_id uuid not null references public.media_assets(id),
  appearance jsonb not null default '{}'::jsonb check (jsonb_typeof(appearance) = 'object' and octet_length(appearance::text) <= 16384),
  student_number text not null,
  created_at timestamptz not null default now(),
  unique (creator_id, request_id)
);
create index student_character_portrait_idx on public.student_character_cards(portrait_asset_id);
create index student_character_card_idx on public.student_character_cards(card_asset_id);
alter table public.student_character_cards enable row level security;
revoke all on public.student_character_cards from anon, authenticated;
grant select on public.student_character_cards to anon, authenticated;
grant all on public.student_character_cards to service_role;
create policy student_character_read on public.student_character_cards for select using (true);
create policy media_student_character_read on public.media_assets for select using (
  status = 'ready' and exists (
    select 1 from public.student_character_cards c
    where c.portrait_asset_id = media_assets.id or c.card_asset_id = media_assets.id
  )
);

create function public.create_student_character(
  p_request_id uuid,
  p_portrait_asset_id uuid,
  p_card_asset_id uuid,
  p_name text default '',
  p_college_id uuid default null,
  p_ability text default '',
  p_traits text default '',
  p_appearance jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_existing public.student_character_cards;
  v_student jsonb;
  v_name text := coalesce(nullif(btrim(p_name), ''), '未命名同学');
  v_ability text := coalesce(btrim(p_ability), '');
  v_traits text := coalesce(btrim(p_traits), '');
  v_number text;
  v_body text := '';
begin
  if v_user is null then raise insufficient_privilege using message = 'AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.profiles where id = v_user) then
    raise foreign_key_violation using message = 'CREATOR_PROFILE_REQUIRED';
  end if;
  if p_request_id is null then raise check_violation using message = 'CHARACTER_REQUEST_REQUIRED'; end if;
  -- Concurrent double-clicks/retries return the already created archive.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text || p_request_id::text, 0));
  select * into v_existing from public.student_character_cards where creator_id = v_user and request_id = p_request_id;
  if found then
    return jsonb_build_object('slug', (select slug from public.students where id = v_existing.student_id), 'id', v_existing.student_id);
  end if;
  if char_length(v_name) > 32 or char_length(v_ability) > 2000 or char_length(v_traits) > 4000 then
    raise check_violation using message = 'CHARACTER_INPUT_TOO_LONG';
  end if;
  if p_college_id is not null and not exists(select 1 from public.colleges where id = p_college_id) then
    raise check_violation using message = 'CHARACTER_COLLEGE_INVALID';
  end if;
  if p_appearance is null or jsonb_typeof(p_appearance) <> 'object' or octet_length(p_appearance::text) > 16384 then
    raise check_violation using message = 'CHARACTER_APPEARANCE_INVALID';
  end if;
  if p_portrait_asset_id is null or p_card_asset_id is null then
    raise check_violation using message = 'CHARACTER_IMAGES_REQUIRED';
  end if;
  perform public.validate_content_image(p_portrait_asset_id);
  perform public.validate_content_image(p_card_asset_id);
  v_number := 'KTU-' || upper(substr(replace(p_request_id::text, '-', ''), 1, 12));
  -- Skipped answers remain absent; no invented personality or power.
  if v_ability <> '' then v_body := '## 特殊能力' || E'\n\n' || v_ability; end if;
  if v_traits <> '' then v_body := v_body || case when v_body = '' then '' else E'\n\n' end || '## 记忆点' || E'\n\n' || v_traits; end if;
  v_student := public.create_wiki_entity_with_body(
    p_entity_type => 'student', p_slug => 'student-' || p_request_id::text,
    p_name => v_name, p_college_id => p_college_id,
    p_summary => nullif(left(v_traits, 200), ''), p_body => v_body
  );
  insert into public.student_character_cards(student_id, creator_id, request_id, portrait_asset_id, card_asset_id, appearance, student_number)
  values ((v_student->>'id')::uuid, v_user, p_request_id, p_portrait_asset_id, p_card_asset_id, p_appearance, v_number);
  return jsonb_build_object('slug', v_student->>'slug', 'id', v_student->>'id');
end;
$$;
revoke all on function public.create_student_character(uuid, uuid, uuid, text, uuid, text, text, jsonb) from public, anon;
grant execute on function public.create_student_character(uuid, uuid, uuid, text, uuid, text, text, jsonb) to authenticated;
