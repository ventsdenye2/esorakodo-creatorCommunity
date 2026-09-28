import Link from "next/link";
import { SiteHeader } from "../../../src/components/layout/site-header";
import { SiteFooter } from "../../../src/components/layout/site-footer";
import { getReportReview, contentStatusLabels, reportStatusLabels, workKindLabels, moderationActionLabels } from "../../../src/features/moderation/queries";
import { ModerationForm } from "../../../src/features/moderation/moderation-form";
import "../../../src/features/creator/portal.css";
import "../../../src/features/moderation/moderation.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "举报审阅" };
export default async function ReportReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { report, preview, audit } = await getReportReview(id);
  return <div><SiteHeader /><main id="main-content" className="portal-page moderation-page"><Link href="/moderation">← 返回内容管理</Link><header className="portal-heading"><p className="archive-label">CONTENT STEWARDSHIP / REVIEW</p><h1>举报审阅</h1><p>{workKindLabels[preview.kind]} · {reportStatusLabels[report.status] ?? report.status}</p><p className="portal-meta">记录编号 {report.id} · {new Date(report.created_at).toLocaleString("zh-CN")}</p></header><section className="moderation-report"><h2>举报说明</h2><p>{report.reason}</p></section><section className="moderation-target"><div className="portal-meta">{contentStatusLabels[preview.status] ?? preview.status} · 作者：{preview.creator_name}</div><h2>{preview.title}</h2><p>以下为该举报对应内容的纯文本片段，最多 12,000 字；图片不在此展开。</p><details open><summary>审阅正文片段</summary>{preview.excerpt ? <div className="moderation-excerpt">{preview.excerpt}</div> : <p className="portal-empty">此内容没有可显示的文字片段。</p>}</details>{preview.public_path ? <Link className="text-link" href={preview.public_path}>打开公开阅读页 ↗</Link> : <p className="portal-meta">此内容当前不向公众开放。片段仅在管理审阅页可见。</p>}</section><section><h2>处置与说明</h2><ModerationForm id={id} contentStatus={preview.status} /></section><section><h2>本次举报的处置记录</h2>{audit.length ? <ol className="portal-list">{audit.map((item) => <li key={item.id}><strong>{moderationActionLabels[item.action] ?? item.action} · {contentStatusLabels[item.previous_status] ?? item.previous_status} → {contentStatusLabels[item.next_status] ?? item.next_status}</strong><p>{item.reason}</p><small>{item.profiles?.display_name ?? "管理员"} · {new Date(item.created_at).toLocaleString("zh-CN")}</small></li>)}</ol> : <p className="portal-empty">尚无处置记录。</p>}</section></main><SiteFooter /></div>;
}
