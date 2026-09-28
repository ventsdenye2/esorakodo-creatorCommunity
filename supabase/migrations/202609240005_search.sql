-- Bounded substring search for Chinese names/titles. No tokenizer dependency.
create extension if not exists pg_trgm with schema extensions;
create index students_name_search_idx on public.students using gin(name extensions.gin_trgm_ops);
create index colleges_name_search_idx on public.colleges using gin(name extensions.gin_trgm_ops);
create index places_name_search_idx on public.places using gin(name extensions.gin_trgm_ops);
create index articles_title_search_idx on public.articles using gin(title extensions.gin_trgm_ops) where status='published';
create index events_title_search_idx on public.events using gin(title extensions.gin_trgm_ops) where status='published';
create index forum_topics_title_search_idx on public.forum_topics using gin(title extensions.gin_trgm_ops) where status='published';
create index event_supplements_title_search_idx on public.event_supplements using gin(title extensions.gin_trgm_ops) where status='published';
create index forum_accounts_name_search_idx on public.forum_accounts using gin(display_name extensions.gin_trgm_ops);
create index profiles_name_search_idx on public.profiles using gin(display_name extensions.gin_trgm_ops);
create index hashtags_name_search_idx on public.hashtags using gin(name extensions.gin_trgm_ops);
