-- Version mismatch is an application conflict. SQLSTATE 40001 would trigger
-- unbounded PostgREST transaction retries with the same stale arguments.
create or replace function public.commit_forum_edit(p_topic_id uuid,p_expected_revision bigint,p_state text,p_first_id text,p_snapshot jsonb default null,p_publish boolean default false) returns public.forum_edit_documents language plpgsql security definer set search_path='' as $$
declare t public.forum_topics; d public.forum_edit_documents; v bigint; err text; published boolean; a uuid;
begin
 select * into t from public.forum_topics where id=p_topic_id for update;
 if not public.can_edit_forum(p_topic_id) then raise insufficient_privilege using message='FORUM_EDITOR_REQUIRED'; end if;
 if p_publish and t.creator_id<>auth.uid() then raise insufficient_privilege using message='FORUM_OWNER_REQUIRED'; end if;
 select * into d from public.forum_edit_documents where topic_id=p_topic_id for update;
 if not found or d.revision is distinct from p_expected_revision then raise exception using message='FORUM_EDIT_CONFLICT'; end if;
 if d.first_id is not null and d.first_id is distinct from p_first_id then raise check_violation using message='FORUM_FIRST_POST_REQUIRED'; end if;
 published:=t.status='published';
 perform set_config('app.forum_edit_commit',p_topic_id::text,true);
 if p_snapshot is not null then
  begin
   for a in select (e->>'forum_account_id')::uuid from jsonb_array_elements(p_snapshot->'messages') e loop
    if not public.forum_account_allowed(p_topic_id,a) then raise check_violation using message='FORUM_ACCOUNT_NOT_OWNED'; end if;
    insert into public.forum_topic_accounts values(p_topic_id,a) on conflict do nothing;
   end loop;
   -- No reader can observe this temporary draft: the whole replacement is one transaction.
   if published then update public.forum_topics set status='draft',published_at=null where id=p_topic_id; end if;
   select version into v from public.forum_topics where id=p_topic_id;
   perform public.save_forum_draft(p_topic_id,v,p_snapshot->>'title',p_snapshot->>'board',p_snapshot->'messages',array(select jsonb_array_elements_text(p_snapshot->'tags')),p_snapshot->'links',false);
   if published then
    if jsonb_array_length(p_snapshot->'messages')=0 then raise check_violation using message='FORUM_TOPIC_EMPTY'; end if;
    update public.forum_topics set status='published',published_at=t.published_at where id=p_topic_id;
   elsif p_publish then perform public.publish_forum_topic(p_topic_id); end if;
  exception when check_violation or foreign_key_violation or invalid_text_representation or not_null_violation then
   get stacked diagnostics err=MESSAGE_TEXT;
   if p_publish then raise; end if;
  end;
 elsif p_publish then raise check_violation using message='FORUM_CONTENT_INCOMPLETE';
 end if;
 update public.forum_edit_documents set state=p_state,first_id=coalesce(first_id,p_first_id),revision=revision+1,updated_by=auth.uid(),updated_at=now(),publish_error=coalesce(err,case when p_snapshot is null then 'FORUM_CONTENT_INCOMPLETE' end),public_revision=case when p_snapshot is not null and err is null then revision+1 else public_revision end where topic_id=p_topic_id returning * into d;
 return d;
end; $$;
notify pgrst,'reload schema';
