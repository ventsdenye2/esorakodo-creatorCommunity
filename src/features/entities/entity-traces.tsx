import Link from 'next/link';
import type {WikiEntityType} from '../wiki/types';
import {createClient} from '../../lib/supabase/server';
import {relatedRecords} from './queries';
export async function EntityTraces({type,id}:{type:WikiEntityType;id:string}){
 const db=await createClient();const [records,accounts,students,places]=await Promise.all([
  relatedRecords(type,id),
  type==='student'?db.from('forum_accounts').select('id,display_name,handle').eq('student_id',id).limit(30):null,
  type==='college'?db.from('students').select('id,name,slug').eq('college_id',id).limit(30):null,
  type==='college'?db.from('places').select('id,name,slug').eq('college_id',id).limit(30):null,
 ]);
 return <section className="forum-wiki-traces" aria-label="相关档案与作品"><div><p className="archive-label">PEOPLE / PLACES / RECORDS</p><h2>在校园留下的记录</h2></div>{records.failed&&<p role="alert">部分关联记录暂时无法加载。</p>}<ul>{students?.data?.map(r=><li key={r.id}><Link href={`/wiki/student/${r.slug}`}>{r.name}</Link><span>所属人物</span></li>)}{places?.data?.map(r=><li key={r.id}><Link href={`/wiki/place/${r.slug}`}>{r.name}</Link><span>所属地点</span></li>)}{accounts?.data?.map(r=><li key={r.id}><Link href={`/forum/accounts/${r.handle}`}>{r.display_name}</Link><span>论坛身份</span></li>)}{records.items.map(r=><li key={r.id}><Link href={r.href}>{r.title}</Link><span>{r.kind}</span></li>)}</ul>{!records.items.length&&!accounts?.data?.length&&!students?.data?.length&&!places?.data?.length&&<p>暂无关联作品或档案。</p>}</section>;
}
