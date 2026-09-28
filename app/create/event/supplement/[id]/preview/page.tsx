import { notFound, redirect } from "next/navigation";
import { EventShell } from "../../../../../../src/features/events/components/EventShell";
import { SupplementDetail } from "../../../../../../src/features/events/components/SupplementDetail";
import { getEvent, getEventSupplement } from "../../../../../../src/features/events/queries";
import { getEditorEntities } from "../../../../../../src/features/editor/queries";
import { getAuthenticatedCreatorId } from "../../../../../../src/features/wiki/queries";
export const dynamic = "force-dynamic";
export default async function PreviewSupplementPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const creatorId = await getAuthenticatedCreatorId(); if (!creatorId) redirect("/login"); const data = await getEventSupplement(id, true); if (!data || data.supplement.creator_id !== creatorId) notFound(); const [archive, entities] = await Promise.all([getEvent(data.supplement.event_id), getEditorEntities()]); if (!archive) notFound(); return <EventShell><SupplementDetail data={data} event={archive.event} node={archive.nodes.find((node) => node.id === data.supplement.timeline_node_id)} entities={entities} creatorId={creatorId} preview /></EventShell>; }
