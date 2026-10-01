"""Prepare a version-guarded wiki content correction; never connects to production.

Run with the bundled Python runtime. Database writes use existing revision RPCs;
apply.sql and dry-run.sql differ only in COMMIT versus ROLLBACK.
"""
from pathlib import Path
import copy
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
HERE=Path(__file__).resolve().parent
raw=json.loads((HERE/'before.json').read_text(encoding='utf-8-sig'))
before=(raw[0] if isinstance(raw,list) else raw)['snapshot']
actor=before['maintenance_actor']
assert actor['handle']=='test'
old_colleges={r['slug']:r for r in before['colleges']}
assert old_colleges['engineering']['name']=='工程学院'
assert len(before['places'])==0, 'Review any new place archives before preparing'
assert 'computer-science' not in old_colleges and 'aviation' not in old_colleges
parent_name='机械工程学院'
new_colleges=copy.deepcopy(before['colleges'])

for row in new_colleges:
    if row['slug']=='engineering':
        row['name']=parent_name
    for field in ('summary','body'):
        if row[field]:
            row[field]=re.sub(r'(?<!机械)工程学院',parent_name,row[field])
    row['body']=row['body'].replace('空天大学十六学院环轨','空天大学创校十六院系环轨')
    row['body']=row['body'].replace('| 学院序位 |','| 创校院系序位 |')
    evolution='空天大学创校之初拥有十六个院系，随后在发展中逐步分化、增设更多学院。本院是创校院系之一。'
    if row['slug']=='engineering':
        evolution+='\n\n随着学科发展，[计算机学院](https://campus.kongtian.university/wiki/college/computer-science)从机械工程学院分出。两者是具有发展沿革关系的不同学院。'
    if row['slug']=='military':
        evolution+='\n\n[飞行学院](https://campus.kongtian.university/wiki/college/aviation)由军事学院演化而来，是大学发展中形成的学院。'
    row['body']+='\n\n## 院系沿革\n\n'+evolution

additions=[
 {'slug':'computer-science','name':'计算机学院','summary':'由机械工程学院分出的学院，承载计算机学科的教学与校园生活。',
  'body':'## 学院概况\n\n计算机学院是空天大学在发展过程中，由机械工程学院分出的学院。\n\n## 院系沿革\n\n空天大学创校之初拥有十六个院系，随后逐步分化、增设更多学院。计算机学院不属于创校十六院系，其发展来源是[机械工程学院](https://campus.kongtian.university/wiki/college/engineering)。\n\n## 校园生活\n\n学院有浓厚的学习氛围，学生参与程序设计学习与交流。不同性格与经历的人在这里相遇，留下课堂内外的校园故事。'},
 {'slug':'aviation','name':'飞行学院','summary':'由军事学院演化而来的学院，是空天大学后续发展形成的院系之一。',
  'body':'## 学院概况\n\n飞行学院由军事学院演化而来，是空天大学在发展过程中形成的学院。\n\n## 院系沿革\n\n空天大学创校之初拥有十六个院系，随后逐步分化、增设更多学院。飞行学院不属于创校十六院系，其发展来源是[军事学院](https://campus.kongtian.university/wiki/college/military)。\n\n## 校园人物\n\n[端木拓](https://campus.kongtian.university/wiki/student/duanmutuo)是飞行学院学生，也是战斗科特长生。'}
]
new_colleges.extend(additions)
old_slug_by_id={r['id']:r['slug'] for r in before['colleges']}
students=copy.deepcopy(before['students'])
computer_students={'test','chishuiye','tiantian','chengxu'}
for row in students:
    original_college=old_slug_by_id.get(row['college_id'])
    row['college_slug']=original_college
    replacement=None
    if row['slug'] in computer_students:
        replacement='计算机学院'
        row['college_slug']='computer-science'
    elif original_college=='engineering':
        replacement=parent_name
    if replacement:
        for field in ('summary','body'):
            row[field]=re.sub(r'(?<!机械)工程学院',replacement,row[field] or '')
    if row['slug']=='duanmutuo':
        row['college_slug']='aviation'
        for field in ('summary','body'):
            row[field]=(row[field] or '').replace('军事学院飞行方向','飞行学院').replace('军事学院','飞行学院')
        row['body']=row['body'].replace('| 方向 | 飞行方向 |\n','')

changes=[]
expected=[]
for kind,old_rows,new_rows in [('college',before['colleges'],new_colleges),('student',before['students'],students)]:
    old={r['slug']:r for r in old_rows}
    for row in new_rows:
        fields={k:row.get(k) for k in ('name','summary','body')}
        if kind=='student':fields['college_slug']=row['college_slug']
        previous=old.get(row['slug'])
        if previous is None:
            changes.append({'kind':kind,'action':'create','slug':row['slug'],'fields':fields})
            version=1
        else:
            old_fields={k:previous.get(k) for k in ('name','summary','body')}
            if kind=='student':old_fields['college_slug']=old_slug_by_id.get(previous['college_id'])
            changed=fields!=old_fields
            version=previous['version']+int(changed)
            if changed:changes.append({'kind':kind,'action':'update','slug':row['slug'],'id':previous['id'],'before':previous,'expected_version':previous['version'],'fields':fields})
        expected.append({'kind':kind,'slug':row['slug'],'id':None if previous is None else previous['id'],'version':version,'fields':fields})

plan={'reason':'统一创校院系名称为机械工程学院；计算机学院由机械工程学院分出，飞行学院由军事学院演化；按原角色设定修正学院关联。','actor':actor,'changes':changes,'expected':expected}
(HERE/'changes.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
literal=lambda tag,obj:'$'+tag+'$'+json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'$'+tag+'$::jsonb'
checks=f"""
create temporary table college_evolution_expected on commit drop as
select value as item from jsonb_array_elements({literal('expected',expected)});
create temporary table college_evolution_checks on commit drop as
with current_entities as (
 select 'college'::text as kind,c.slug,c.id,c.version,c.name,c.summary,c.body,null::text as college_slug,to_jsonb(c) as snapshot from public.colleges c
 union all
 select 'student',s.slug,s.id,s.version,s.name,s.summary,s.body,c.slug,to_jsonb(s) from public.students s left join public.colleges c on c.id=s.college_id
)
select e.item->>'kind' as kind,e.item->>'slug' as slug,c.name,c.version,
 coalesce(c.id is not null
 and (e.item->>'id' is null or c.id=(e.item->>'id')::uuid)
 and c.version=(e.item->>'version')::bigint
 and c.name is not distinct from e.item->'fields'->>'name'
 and c.summary is not distinct from e.item->'fields'->>'summary'
 and c.body is not distinct from e.item->'fields'->>'body'
 and (e.item->>'kind'='college' or c.college_slug is not distinct from e.item->'fields'->>'college_slug'),false) as content_matches,
 exists(select 1 from public.wiki_revisions r where r.entity_type=c.kind and r.entity_id=c.id and r.snapshot=c.snapshot) as revision_matches
from college_evolution_expected e left join current_entities c on c.kind=e.item->>'kind' and c.slug=e.item->>'slug';
do $verify$ begin
 if exists(select 1 from college_evolution_checks where not content_matches or not revision_matches) then raise exception 'COLLEGE_EVOLUTION_VERIFICATION_FAILED'; end if;
 if (select count(*) from college_evolution_checks) <> 28 then raise exception 'EXPECTED_28_CHECKS'; end if;
 if exists(select 1 from public.colleges where name='工程学院') then raise exception 'OLD_COLLEGE_NAME_REMAINS'; end if;
end $verify$;
select * from college_evolution_checks order by kind,slug;
"""
prefix=f"""-- Authorized content-only maintenance, 2026-10-01. No schema edits or direct entity writes.
-- Uses the previously verified maintenance Creator; all writes preserve wiki revisions.
begin;
set local statement_timeout = '30s';
do $actor$ begin
 if not exists(select 1 from public.profiles where id='{actor['id']}' and handle='test') then raise exception 'MAINTENANCE_CREATOR_MISMATCH'; end if;
end $actor$;
select set_config('request.jwt.claim.sub','{actor['id']}',true);
select set_config('request.jwt.claims','{{"sub":"{actor['id']}","role":"authenticated"}}',true);
set local role authenticated;
do $revise$
declare item jsonb; current_snapshot jsonb; patch jsonb; target_college uuid; result jsonb;
begin
 for item in select value from jsonb_array_elements({literal('changes',changes)}) loop
  patch:=item->'fields';
  if item->>'action'='create' then
   if exists(select 1 from public.colleges where slug=item->>'slug' or name=patch->>'name') then raise exception 'NEW_COLLEGE_ALREADY_EXISTS'; end if;
   result:=public.create_wiki_entity_with_body('college',item->>'slug',patch->>'name',patch->>'summary',null,null,patch->>'body');
  else
   if item->>'kind'='college' then
    select to_jsonb(c) into strict current_snapshot from public.colleges c where id=(item->>'id')::uuid;
   else
    select to_jsonb(s) into strict current_snapshot from public.students s where id=(item->>'id')::uuid;
    select id into strict target_college from public.colleges where slug=patch->>'college_slug';
    patch:=(patch-'college_slug')||jsonb_build_object('college_id',target_college);
   end if;
   -- PowerShell's JSON transport normalizes timestamps to the host offset.
   -- Compare timestamp instants, while preserving exact checks on all other fields.
   if (current_snapshot-'created_at'-'updated_at') is distinct from ((item->'before')-'created_at'-'updated_at')
      or (current_snapshot->>'created_at')::timestamptz is distinct from (item->'before'->>'created_at')::timestamptz
      or (current_snapshot->>'updated_at')::timestamptz is distinct from (item->'before'->>'updated_at')::timestamptz
   then raise exception 'CONTENT_CHANGED_SINCE_SNAPSHOT: %',item->>'slug'; end if;
   result:=public.apply_wiki_revision(item->>'kind',(item->>'id')::uuid,(item->>'expected_version')::bigint,patch,'统一院系名称与沿革：机械工程学院；计算机学院由其分出；飞行学院由军事学院演化。按角色设定修正学院关联。',null);
  end if;
 end loop;
end $revise$;
"""
(HERE/'dry-run.sql').write_text(prefix+checks+'\nrollback;\n',encoding='utf-8')
(HERE/'apply.sql').write_text(prefix+checks+'\ncommit;\n',encoding='utf-8')
(HERE/'verify.sql').write_text('begin;\n'+checks+'\nrollback;\n',encoding='utf-8')
print(json.dumps({'updates':sum(x['action']=='update' for x in changes),'creates':sum(x['action']=='create' for x in changes),'verification_rows':len(expected),'changes':[(x['action'],x['kind'],x['fields']['name'],x['fields'].get('college_slug')) for x in changes]},ensure_ascii=False))
