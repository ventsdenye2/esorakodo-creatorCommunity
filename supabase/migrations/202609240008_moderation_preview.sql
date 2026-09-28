-- Moderators review a report's exact FK target without widening public content RLS.
-- This read-only RPC never accepts a table, work kind, or arbitrary work ID.
create function public.get_report_preview(p_report_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  r public.reports;
  target_id uuid;
  target_creator uuid;
  target_kind text;
  target_title text;
  target_status text;
  target_body jsonb;
  target_summary text;
  target_excerpt text;
  target_parent uuid;
  creator_name text;
  public_path text;
begin
  if auth.uid() is null or not public.is_moderator() then
    raise exception 'MODERATION_FORBIDDEN' using errcode='42501';
  end if;
  select * into r from public.reports where id=p_report_id;
  if not found then raise exception 'REPORT_NOT_FOUND' using errcode='P0002'; end if;

  if r.forum_topic_id is not null then
    target_kind:='forum'; target_id:=r.forum_topic_id;
    select title,status,creator_id into target_title,target_status,target_creator
      from public.forum_topics where id=target_id;
    select left(string_agg(part.text,E'\n\n' order by part.floor_no),12000) into target_excerpt
      from (select floor_no,'第'||floor_no::text||'楼 · '||left(body,2000) as text
            from public.forum_messages where topic_id=target_id order by floor_no limit 40) part;
    public_path:='/forum/'||target_id::text;
  elsif r.article_id is not null then
    target_kind:='article'; target_id:=r.article_id;
    select title,status,creator_id,summary,body into target_title,target_status,target_creator,target_summary,target_body
      from public.articles where id=target_id;
    public_path:='/press/'||target_id::text;
  elsif r.event_id is not null then
    target_kind:='event'; target_id:=r.event_id;
    select title,status,creator_id,left(concat_ws(E'\n\n',time_range,summary,causes,consequences),12000)
      into target_title,target_status,target_creator,target_excerpt from public.events where id=target_id;
    public_path:='/events/'||target_id::text;
  elsif r.supplement_id is not null then
    target_kind:='supplement'; target_id:=r.supplement_id;
    select title,status,creator_id,body,event_id into target_title,target_status,target_creator,target_body,target_parent
      from public.event_supplements where id=target_id;
    public_path:='/events/'||target_parent::text||'/supplements/'||target_id::text;
  else
    raise exception 'REPORT_TARGET_INVALID' using errcode='23514';
  end if;
  if target_title is null then raise exception 'REPORT_TARGET_NOT_FOUND' using errcode='P0002'; end if;
  if target_body is not null then
    select left(concat_ws(E'\n\n',nullif(target_summary,''),string_agg(part.text,E'\n\n' order by part.position)),12000)
      into target_excerpt
      from (select position,left(block->>'text',2000) as text
        from jsonb_array_elements(target_body->'blocks') with ordinality as b(block,position)
        where block->>'type' in ('paragraph','heading','quote') order by position limit 40) part;
  end if;
  select display_name into creator_name from public.profiles where id=target_creator;
  if not public.work_is_public(target_kind,target_id) then public_path:=null; end if;
  return jsonb_build_object('report_id',r.id,'target_id',target_id,'kind',target_kind,
    'title',target_title,'status',target_status,'creator_name',coalesce(creator_name,'作者暂不可用'),
    'excerpt',coalesce(target_excerpt,''),'public_path',public_path);
end; $$;
revoke execute on function public.get_report_preview(uuid) from public,anon,authenticated;
grant execute on function public.get_report_preview(uuid) to authenticated;
comment on function public.get_report_preview(uuid) is 'Moderator-only bounded plain-text review of the exact target of an existing report; does not grant public draft/hidden access.';
