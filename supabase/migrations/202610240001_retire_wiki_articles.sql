-- Withdraw obsolete canon without destroying entity identities or revisions.
alter table public.wiki_articles add column retired_at timestamptz;

-- Restrictive policy also applies if another permissive read policy is added.
create policy "retired wiki articles are hidden"
on public.wiki_articles as restrictive for select to anon, authenticated
using (retired_at is null);

-- Revision RPCs are SECURITY DEFINER: protect withdrawn articles there too.
create function public.protect_retired_wiki_article()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.retired_at is not null and new.retired_at is not null then
    raise insufficient_privilege using message = 'WIKI_ARTICLE_RETIRED';
  end if;
  return new;
end;
$$;
revoke all on function public.protect_retired_wiki_article() from public, anon, authenticated;
create trigger wiki_articles_protect_retired before update on public.wiki_articles
for each row execute function public.protect_retired_wiki_article();

notify pgrst, 'reload schema';
