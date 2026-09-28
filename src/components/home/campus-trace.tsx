import Link from 'next/link';
import {ArrowIcon} from '../icons/arrow-icon';
import {getCampusCards} from './campus-view-data';
import {getEvent} from '../../features/events/queries';
import {getEditorEntities} from '../../features/editor/queries';
export async function CampusTrace(){
 const {records}=await getCampusCards();const latest=records.find(record=>record.kind==='校史事件');
 const event=latest?await getEvent(latest.id).catch(()=>null):null;
 const entities=event?.links.length?await getEditorEntities().catch(()=>[]):[];
 const linked=event?.links.flatMap(link=>{const entity=entities.find(item=>item.id===link.entity_id&&item.type===link.entity_type);return entity?[entity]:[];})??[];
 return <section className="campus-trace" aria-labelledby="campus-trace-title"><div className="trace-heading"><h2 id="campus-trace-title">Campus Trace</h2><span>人物 / 地点 / 校园记忆</span></div><div className="campus-relation-layout"><div><p className="archive-label">{event?'FROM THE ARCHIVES':'EXPLORE KONGTIAN'}</p><h3>{event?.event.title??'校园的每一处，都有它的来历。'}</h3><p>{event?.event.summary??'沿着人物、学院与地点，查阅与他们相关的文章、讨论和校史记录。'}</p><Link className="trace-action" href={event?`/events/${event.event.id}`:'/wiki'}>{event?'阅读事件档案':'走进校园档案'}<ArrowIcon/></Link></div><div className="campus-relation-list">{linked.length?linked.slice(0,6).map(entity=><details key={`${entity.type}-${entity.id}`}><summary><span>{({student:'人物',college:'学院',place:'地点',event:'事件'} as const)[entity.type]}</span>{entity.label}</summary><p>这份档案与左侧事件存在已记录的关联。</p><Link href={entity.href}>打开完整档案 ↗</Link></details>):<><Link href="/wiki?type=student"><span>PEOPLE</span><strong>空天人物</strong><ArrowIcon/></Link><Link href="/wiki?type=college"><span>COLLEGES</span><strong>学院与学术</strong><ArrowIcon/></Link><Link href="/wiki?type=place"><span>PLACES</span><strong>校园地点</strong><ArrowIcon/></Link></>}</div></div></section>;
}
