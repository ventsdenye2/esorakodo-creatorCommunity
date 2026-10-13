-- Match JavaScript String.trim whitespace without changing existing snapshots.
create or replace function public.content_body_has_content(p_body jsonb)
returns boolean language sql immutable set search_path='' as $$
 select exists (
  select 1 from jsonb_array_elements(case when jsonb_typeof(p_body->'blocks')='array' then p_body->'blocks' else '[]'::jsonb end) b
  where b->>'type' in ('image','entity') or (
   b->>'type' in ('paragraph','heading','quote') and
   length(btrim(coalesce(b->>'text',''), E' \t\n\r\f' || chr(11) || chr(160) || chr(5760) ||
    chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)||chr(8202)||
    chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279))) > 0
  )
 );
$$;
revoke all on function public.content_body_has_content(jsonb) from public, anon;
grant execute on function public.content_body_has_content(jsonb) to authenticated;

create or replace function public.guard_published_body()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='published' and not public.content_body_has_content(new.body) then
  raise exception 'CONTENT_INVALID_BODY' using errcode='23514';
 end if;
 return new;
end $$;
revoke all on function public.guard_published_body() from public, anon, authenticated;
create trigger articles_published_body_guard before insert or update on public.articles
 for each row execute function public.guard_published_body();
create trigger supplements_published_body_guard before insert or update on public.event_supplements
 for each row execute function public.guard_published_body();

-- Stable keyset pages for every supported work kind.
create index work_comments_forum_page on public.work_comments(forum_topic_id,created_at desc,id desc) where forum_topic_id is not null;
create index work_comments_article_page on public.work_comments(article_id,created_at desc,id desc) where article_id is not null;
create index work_comments_event_page on public.work_comments(event_id,created_at desc,id desc) where event_id is not null;
create index work_comments_supplement_page on public.work_comments(supplement_id,created_at desc,id desc) where supplement_id is not null;
