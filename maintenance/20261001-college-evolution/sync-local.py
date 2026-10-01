"""Synchronize maintained archive exports from the verified after snapshot.

Original supplied references and historical maintenance records are not rewritten.
"""
from pathlib import Path
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
HERE=Path(__file__).resolve().parent
WORKSPACE=HERE.parents[2]
BASE=WORKSPACE/'学生档案整理'
raw=json.loads((HERE/'after.json').read_text(encoding='utf-8-sig'))
after=(raw[0] if isinstance(raw,list) else raw)['snapshot']
colleges={r['slug']:r for r in after['colleges']}
students={r['slug']:r for r in after['students']}
college_slugs={r['id']:r['slug'] for r in after['colleges']}
old=json.loads((BASE/'档案录入内容.json').read_text(encoding='utf-8-sig'))
for item in old['records']:
    row=students[item['suggestedSlug']]
    item.update(action='update-existing',summary=row['summary'],body=row['body'],collegeSlug=college_slugs[row['college_id']],expectedVersion=row['version'],publishedVersion=row['version'],entityId=row['id'])
    (BASE/item['sourceFile']).write_text('# '+row['name']+'\n\n## 档案摘要\n\n'+row['summary']+'\n\n'+row['body']+'\n',encoding='utf-8')
old['source']='绘空事原始资料、官网人物目录及2026-10-01用户确认的院系名称和发展沿革'
old['status']='published-and-verified'
old['revisionNote']='机械工程学院与此前工程学院为同一院系；计算机学院由其分出；飞行学院由军事学院演化。'
(BASE/'档案录入内容.json').write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(BASE/'学生档案合集.md').write_text('\n\n---\n\n'.join((BASE/r['sourceFile']).read_text(encoding='utf-8').strip() for r in old['records'])+'\n',encoding='utf-8')

directory=BASE/'学院档案'
college_file=directory/'学院录入内容.json'
catalog=json.loads(college_file.read_text(encoding='utf-8-sig'))
catalog['source']='创校院系官网名单与2026-10-01用户确认的院系名称及发展沿革'
catalog['status']='published-and-verified'
catalog['foundingCollegeCount']=16
catalog['recordedCollegeCount']=18
catalog['note']='当前收录18个院系，不代表世界观现有学院的完整上限。engineering沿用原档案ID和地址，统一名称为机械工程学院。'
existing=directory/'08-工程学院.md'
renamed=directory/'08-机械工程学院.md'
if existing.exists():
    assert not renamed.exists(), 'Review duplicate files before renaming'
    existing.rename(renamed)
for i,item in enumerate(catalog['records'][:16],1):
    row=colleges[item['slug']]
    name=row['name']
    item.update(name=name,summary=row['summary'],body=row['body'],version=row['version'],entityId=row['id'],stage='创校院系',sourceFile=f'{i:02d}-{name}.md')
    if item['slug']=='engineering':item['derivedCollegeSlugs']=['computer-science']
    if item['slug']=='military':item['derivedCollegeSlugs']=['aviation']
    (directory/item['sourceFile']).write_text('# '+name+'\n\n'+row['body']+'\n',encoding='utf-8')
for number,slug,parent in [(17,'computer-science','engineering'),(18,'aviation','military')]:
    row=colleges[slug]
    filename=f'{number:02d}-{row["name"]}.md'
    record={'slug':slug,'name':row['name'],'summary':row['summary'],'body':row['body'],'version':row['version'],'entityId':row['id'],'stage':'后续发展学院','sourceCollegeSlug':parent,'sourceFile':filename}
    previous=next((r for r in catalog['records'] if r['slug']==slug),None)
    if previous:previous.update(record)
    else:catalog['records'].append(record)
    (directory/filename).write_text('# '+row['name']+'\n\n'+row['body']+'\n',encoding='utf-8')
college_file.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert len(catalog['records'])==18 and len(old['records'])==10
assert len({r['entityId'] for r in catalog['records']})==18
print(json.dumps({'collegeExports':18,'studentExports':10,'originalReferenceFiles':'unchanged','engineeringFilename':renamed.name},ensure_ascii=False))
