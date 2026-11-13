-- A reusable anonymous speaker belongs to one real Creator, across their works.
-- Existing accounts and historic message references are not merged or deleted.
alter table public.forum_accounts add column is_default boolean not null default false;
alter table public.forum_accounts add constraint forum_default_account_shape check (
 not is_default or (display_name='momo' and account_type='unknown' and student_id is null
 and avatar_asset_id is null and avatar_key is null and signature is null)
);
create unique index forum_accounts_one_default_per_creator on public.forum_accounts(created_by) where is_default;

create function public.protect_default_forum_account() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
  if new.is_default and current_user in ('anon','authenticated') then
   raise insufficient_privilege using message='FORUM_DEFAULT_ACCOUNT_MANAGED';
  end if;
 elsif new.is_default is distinct from old.is_default or (old.is_default and
  (new.id,new.created_by,new.handle,new.display_name,new.account_type,new.student_id,new.avatar_asset_id,new.avatar_key,new.signature)
  is distinct from
  (old.id,old.created_by,old.handle,old.display_name,old.account_type,old.student_id,old.avatar_asset_id,old.avatar_key,old.signature)) then
  raise check_violation using message='FORUM_DEFAULT_ACCOUNT_IMMUTABLE';
 end if;
 return new;
end; $$;
create trigger forum_accounts_protect_default before insert or update on public.forum_accounts
 for each row execute function public.protect_default_forum_account();
revoke all on function public.protect_default_forum_account() from public,anon,authenticated;

create function public.get_or_create_default_forum_account(p_topic_id uuid)
returns public.forum_accounts language plpgsql security definer set search_path='' as $$
declare owner_id uuid := auth.uid(); result public.forum_accounts;
begin
 if owner_id is null or not public.can_edit_forum(p_topic_id) then
  raise insufficient_privilege using message='FORUM_EDITOR_REQUIRED';
 end if;
 -- Serialize creations from tabs and different topics without touching existing identities.
 perform 1 from public.profiles where id=owner_id for update;
 if not found then raise insufficient_privilege using message='FORUM_EDITOR_REQUIRED'; end if;
 select * into result from public.forum_accounts where created_by=owner_id and is_default;
 if found then return result; end if;
 insert into public.forum_accounts(created_by,handle,display_name,account_type,is_default)
 values(owner_id,'momo_'||replace(extensions.gen_random_uuid()::text,'-','')::varchar(27),'momo','unknown',true)
 returning * into result;
 return result;
end; $$;
revoke all on function public.get_or_create_default_forum_account(uuid) from public,anon;
grant execute on function public.get_or_create_default_forum_account(uuid) to authenticated;
notify pgrst,'reload schema';
