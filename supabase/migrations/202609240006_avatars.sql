-- Stable media references for author and in-world account portraits.
alter table public.profiles add column avatar_asset_id uuid references public.media_assets(id) on delete set null;
alter table public.forum_accounts add column avatar_asset_id uuid references public.media_assets(id) on delete set null;
create index profiles_avatar_asset_idx on public.profiles(avatar_asset_id);
create index forum_accounts_avatar_asset_idx on public.forum_accounts(avatar_asset_id);
create function public.check_avatar_asset() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.avatar_asset_id is not null and (tg_op='INSERT' or new.avatar_asset_id is distinct from old.avatar_asset_id) then
  perform public.validate_content_image(new.avatar_asset_id);
 end if;
 return new;
end $$;
create trigger profiles_avatar_check before insert or update of avatar_asset_id on public.profiles for each row execute function public.check_avatar_asset();
create trigger forum_accounts_avatar_check before insert or update of avatar_asset_id on public.forum_accounts for each row execute function public.check_avatar_asset();
create policy media_avatar_read on public.media_assets for select using(status='ready' and (
 exists(select 1 from public.profiles p where p.avatar_asset_id=media_assets.id) or
 exists(select 1 from public.forum_accounts a where a.avatar_asset_id=media_assets.id)
));
revoke execute on function public.check_avatar_asset() from public,anon,authenticated;
