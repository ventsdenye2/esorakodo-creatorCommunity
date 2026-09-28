import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventShell } from "../../../../../src/features/events/components/EventShell";
import { SupplementForm } from "../../../../../src/features/events/components/SupplementForm";
import { getEvent, getEventSupplement } from "../../../../../src/features/events/queries";
import { getEditorEntities } from "../../../../../src/features/editor/queries";
import { getAuthenticatedCreatorId } from "../../../../../src/features/wiki/queries";
export const dynamic = "force-dynamic";
export default async function EditSupplementPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) { const { id } = await params; const creatorId = await getAuthenticatedCreatorId(); if (!creatorId) redirect(`/login?next=/create/event/supplement/${id}`); const data = await getEventSupplement(id, true); if (!data || data.supplement.creator_id !== creatorId) notFound(); const [archive, entities, query] = await Promise.all([getEvent(data.supplement.event_id), getEditorEntities(), searchParams]); if (!archive) notFound(); return <EventShell><div className="event-edit-page"><nav className="event-crumb"><Link href="/create/event">档案管理</Link><span>/</span>维护补充资料</nav><h1>{data.supplement.title}</h1><p>版本 {data.supplement.version} · 对应事件：{archive.event.title}</p><SupplementForm key={`${data.supplement.id}:${data.supplement.version}`} eventId={archive.event.id} nodes={archive.nodes} supplement={data.supplement} entities={entities} saved={query.saved === "1"} /></div></EventShell>; }
