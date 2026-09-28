import Link from 'next/link';
import {ArrowIcon} from '../icons/arrow-icon';
import {getCampusCards} from './campus-view-data';
import {getEvent} from '../../features/events/queries';
export async function EventArchive(){
 const {records}=await getCampusCards();const latest=records.find(r=>r.kind==='校史事件');const result=latest?await getEvent(latest.id).catch(()=>null):null;
 return <section className="event-archive" aria-labelledby="event-title"><div className="event-archive-inner"><div className="event-heading-row"><span>UNIVERSITY ARCHIVES / 校史档案</span><Link href="/events">查阅校史<ArrowIcon/></Link></div><div className="event-intro"><div><h2 id="event-title">{result?.event.title??'回望来路，读懂空天。'}</h2><p>{result?.event.summary??'人物、地点与时间的交汇，构成这所大学的记忆。校史资料将陆续在此收录。'}</p></div><blockquote>{result?.event.time_range??'以档案保存记忆，以记录连接过去。'}{result&&<cite>{result.nodes.length} 个时间节点 · {result.supplements.length} 份补充</cite>}</blockquote></div>{result&&<ol className="event-timeline">{result.nodes.slice(0,3).map((node,index)=><li className={index===0?'is-signal':undefined} key={node.id}><time>{node.label}</time><h3><Link href={`/events/${result.event.id}#node-${node.id}`}>{node.title}</Link></h3><p>{node.description}</p></li>)}</ol>}</div></section>;
}
