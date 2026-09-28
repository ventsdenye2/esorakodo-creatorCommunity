import Link from "next/link";
import {SiteHeader} from "../../src/components/layout/site-header";
import {SiteFooter} from "../../src/components/layout/site-footer";
import {getModerationClient,reportStatusLabels,moderationActionLabels,contentStatusLabels} from "../../src/features/moderation/queries";
import "../../src/features/creator/portal.css";
import "../../src/features/moderation/moderation.css";
export const dynamic="force-dynamic";
export const metadata={title:"内容管理"};
export default async function ModerationPage(){
 const db=await getModerationClient();
 const [reports,audit]=await Promise.all([db.from("reports").select("*").order("created_at",{ascending:false}).limit(100),db.from("moderation_actions").select("*,profiles!moderation_actions_moderator_id_fkey(display_name)").order("created_at",{ascending:false}).limit(50)]);
 if(reports.error||audit.error)throw new Error("管理记录加载失败，请稍后刷新。");
 return <div><SiteHeader/><main id="main-content" className="portal-page moderation-page"><header className="portal-heading"><p className="archive-label">CONTENT STEWARDSHIP</p><h1>内容管理</h1><p>先审阅举报与内容片段，再记录处置说明。隐藏保留内容和历史。</p></header><section><h2>最近举报</h2>{!reports.data?.length&&<p>暂无举报。</p>}{reports.data?.map(report=><article className="portal-record" key={report.id}><div className="portal-meta"><span>{reportStatusLabels[report.status]??report.status}</span><time>{new Date(report.created_at).toLocaleString("zh-CN")}</time></div><p>{report.reason}</p><p className="portal-meta">记录编号 {report.id}</p><Link className="text-link" href={`/moderation/${report.id}`}>审阅举报与内容 →</Link></article>)}</section><section><h2>最近处置记录</h2>{!audit.data?.length&&<p>暂无处置记录。</p>}<ol className="portal-list">{audit.data?.map(item=><li key={item.id}><Link href={`/moderation/${item.report_id}`}><strong>{moderationActionLabels[item.action]??item.action} · {contentStatusLabels[item.previous_status]??item.previous_status} → {contentStatusLabels[item.next_status]??item.next_status}</strong><span>审阅记录 ↗</span></Link><p>{item.reason}</p><small>{item.profiles?.display_name??"管理员"} · {new Date(item.created_at).toLocaleString("zh-CN")}</small></li>)}</ol></section></main><SiteFooter/></div>;
}
