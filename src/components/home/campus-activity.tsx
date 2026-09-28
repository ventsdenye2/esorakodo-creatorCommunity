import Link from 'next/link';
import {ArrowIcon} from '../icons/arrow-icon';
import {getCampusCards} from './campus-view-data';
export async function CampusActivity(){
 const {records,failed}=await getCampusCards();
 return <section className="activity-rail" aria-labelledby="activity-title"><div className="activity-heading"><div><span>AROUND THE CAMPUS</span><h2 id="activity-title">校园快讯</h2></div><Link href="/search">检索校园<ArrowIcon/></Link></div>{records.length?<div className="activity-list">{records.slice(0,3).map(record=><Link key={record.id} href={record.href}><span>{record.kind}</span><strong>{record.title}</strong><small>{record.date?new Date(record.date).toLocaleDateString('zh-CN'):''}</small></Link>)}</div>:<div className="activity-empty"><p>{failed?'校园资讯暂时无法加载，请稍后刷新。':'关注校园日常，参与交流讨论，了解课堂内外的新鲜事。'}</p><Link href="/forum">进入论坛<ArrowIcon/></Link></div>}</section>;
}
