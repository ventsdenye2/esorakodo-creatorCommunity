import Link from "next/link";
import { redirect } from "next/navigation";
import { EventShell } from "../../../src/features/events/components/EventShell";
import { EventForm } from "../../../src/features/events/components/EventForm";
import { listOwnEvents, listOwnSupplements } from "../../../src/features/events/queries";
import { getAuthenticatedCreatorId, listWikiEntities } from "../../../src/features/wiki/queries";
export const dynamic = "force-dynamic";
export const metadata = { title: "建立事件档案" };
export default async function CreateEventPage() { const creatorId = await getAuthenticatedCreatorId(); if (!creatorId) redirect("/login?next=/create/event"); const [events, supplements, entities] = await Promise.all([listOwnEvents(), listOwnSupplements(), listWikiEntities()]); return <EventShell><div className="event-edit-page"><nav className="event-crumb"><Link href="/events">校史事件</Link><span>/</span>档案管理</nav><p className="archive-label">ARCHIVE / EDITOR</p><h1>建立事件档案</h1><p>你将作为主档案维护者。其他作者可独立署名提交补充材料。</p><details className="event-own-list" open={events.length + supplements.length > 0}><summary>我的档案与补充资料（{events.length + supplements.length}）</summary>{events.map((event) => <Link key={event.id} href={`/create/event/${event.id}`}>{event.title}<span>{event.status === "published" ? "公开档案" : "草稿"}</span></Link>)}{supplements.map((item) => <Link key={item.id} href={`/create/event/supplement/${item.id}`}>{item.title}<span>{item.status === "published" ? "公开补充" : "补充草稿"}</span></Link>)}</details><EventForm entities={entities} /></div></EventShell>; }
