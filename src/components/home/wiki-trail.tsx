import Link from 'next/link';
import {getCampusCards} from './campus-view-data';
import {ArrowIcon} from '../icons/arrow-icon';
export async function WikiTrail(){
 const {records}=await getCampusCards();const entities=records.filter(r=>r.kind.endsWith('档案')).slice(0,4);
 return <section className="wiki-trail" aria-labelledby="wiki-trail-title"><div className="home-section-heading wiki-heading"><div><h2 id="wiki-trail-title">人物与校园档案</h2><p>从一个名字、一处地点，认识空天。</p></div><Link className="section-link" href="/wiki">查阅档案<ArrowIcon/></Link></div><div className="wiki-trail-layout">{entities.length?<ol className="entity-path">{entities.map(entity=><li key={entity.id}><Link href={entity.href}>{entity.title}</Link><span>{entity.kind}</span></li>)}</ol>:<p className="home-empty">校园人物与地点资料将在这里陆续收录。</p>}<p className="wiki-statement">每一条记录，<br/>都通向另一段校园历史。</p></div></section>;
}
