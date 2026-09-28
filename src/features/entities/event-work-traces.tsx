import Link from 'next/link';
import {relatedRecords} from './queries';
export async function EventWorkTraces({id}:{id:string}){
 const result=await relatedRecords('event',id);
 return <section className="event-linked-works"><h2>相关作品与记录</h2>{result.failed&&<p role="alert">部分关联作品暂时无法加载。</p>}{result.items.length?<ul>{result.items.map(item=><li key={item.id}><Link href={item.href}>{item.title} ↗</Link><span>{item.kind}</span></li>)}</ul>:<p>暂时没有引用此事件的其他作品。</p>}</section>;
}
