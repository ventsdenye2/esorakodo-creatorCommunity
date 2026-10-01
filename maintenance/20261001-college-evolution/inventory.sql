-- Read-only snapshot of public wiki content relevant to the authorized canon correction.
select jsonb_build_object(
  'colleges', (select coalesce(jsonb_agg(to_jsonb(c) order by c.slug), '[]'::jsonb) from public.colleges c),
  'students', (select coalesce(jsonb_agg(to_jsonb(s) order by s.slug), '[]'::jsonb) from public.students s),
  'places', (select coalesce(jsonb_agg(to_jsonb(p) order by p.slug), '[]'::jsonb) from public.places p),
  'maintenance_actor', (select jsonb_build_object('id',p.id,'handle',p.handle) from public.profiles p where p.handle='test'),
  'functions', (select jsonb_agg(jsonb_build_object('name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('create_wiki_entity_with_body','apply_wiki_revision'))
) as snapshot;
