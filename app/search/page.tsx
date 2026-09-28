import Link from 'next/link';
import {SiteHeader} from '../../src/components/layout/site-header';
import {SiteFooter} from '../../src/components/layout/site-footer';
import {searchCampus,searchKinds} from '../../src/features/search/queries';
import '../../src/features/creator/portal.css';
export const dynamic='force-dynamic';export const metadata={title:'校园检索'};
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string;kind?:string}>}){
 const params=await searchParams;const q=(params.q??'').trim().slice(0,80);const kind=searchKinds.some(([key])=>key===params.kind)?params.kind??'':'';
 const {groups,failed}=await searchCampus(q,kind);const total=groups.reduce((n,g)=>n+g.items.length,0);
 return <div><SiteHeader/><main id="main-content" className="portal-page search-page"><header className="portal-heading"><p className="archive-label">CAMPUS DIRECTORY</p><h1>在空天，找到你想了解的。</h1><p>查找人物、学院、地点与校园里的作品。</p></header><form className="campus-search" action="/search"><label><span>关键词</span><input name="q" maxLength={80} defaultValue={q} placeholder="人物、标题或话题名称" required/></label><label><span>内容类型</span><select name="kind" defaultValue={kind}><option value="">全部类型</option>{searchKinds.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><button className="button button-primary">检索</button></form>{failed&&<p role="alert">部分检索结果暂时无法加载，请稍后重试。</p>}{!q?<p className="portal-empty">输入名字或标题，开始探索校园。</p>:!total?<p className="portal-empty">没有找到“{q}”。试试更短的关键词或其他内容类型。</p>:<><p className="portal-meta">“{q}” 的检索结果 · 各类别最多显示12条，缩小关键词可查找更多内容。</p>{groups.filter(group=>group.items.length).map(group=><section key={group.kind} className="search-group"><h2>{group.label}<span>{group.items.length}</span></h2><ul className="portal-list">{group.items.map(item=><li key={item.id}><Link href={item.href}>{item.title}<span aria-hidden="true">↗</span></Link><p>{item.summary}</p></li>)}</ul></section>)}</>}</main><SiteFooter/></div>;
}
