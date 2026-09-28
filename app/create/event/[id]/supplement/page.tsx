import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventShell } from "../../../../../src/features/events/components/EventShell";
import { SupplementForm } from "../../../../../src/features/events/components/SupplementForm";
import { getEvent } from "../../../../../src/features/events/queries";
import { getEditorEntities } from "../../../../../src/features/editor/queries";
import { getAuthenticatedCreatorId } from "../../../../../src/features/wiki/queries";
export const dynamic = "force-dynamic";
export default async function CreateSupplementPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; if (!await getAuthenticatedCreatorId()) redirect(`/login?next=/create/event/${id}/supplement`); const [archive, entities] = await Promise.all([getEvent(id), getEditorEntities()]); if (!archive) notFound(); return <EventShell><div className="event-edit-page"><nav className="event-crumb"><Link href={`/events/${id}`}>{archive.event.title}</Link><span>/</span>补充资料</nav><h1>提交补充资料</h1><p>材料将以你的作者身份独立署名，可对应事件整体或某个时间节点。</p><SupplementForm eventId={id} nodes={archive.nodes} entities={entities} /></div></EventShell>; }
