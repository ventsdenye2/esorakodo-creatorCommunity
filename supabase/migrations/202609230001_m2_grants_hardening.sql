-- Supabase's default privileges grant DML on newly created public tables to
-- anon and authenticated. Replace those inherited grants with the intended
-- API surface. RLS remains the row-level ownership check.

revoke all privileges on table
  public.profiles,
  public.colleges,
  public.places,
  public.students,
  public.forum_accounts,
  public.wiki_revisions
from anon, authenticated;

grant select on table
  public.profiles,
  public.colleges,
  public.places,
  public.students,
  public.forum_accounts,
  public.wiki_revisions
to anon, authenticated;

grant insert, update on table public.profiles, public.forum_accounts
to authenticated;
