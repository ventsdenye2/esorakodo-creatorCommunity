import { WorkCommunity } from "../../../../../../src/features/community/work-community";
import { notFound } from "next/navigation";
import { EventShell } from "../../../../../../src/features/events/components/EventShell";
import { SupplementDetail } from "../../../../../../src/features/events/components/SupplementDetail";
import { getEvent, getEventSupplement } from "../../../../../../src/features/events/queries";
import { getEditorEntities } from "../../../../../../src/features/editor/queries";
import { getAuthenticatedCreatorId } from "../../../../../../src/features/wiki/queries";
export const dynamic = "force-dynamic";
export default async function SupplementPage({ params }: { params: Promise<{ id: string; supplementId: string }> }) { const { id, supplementId } = await params; const [archive, data, entities, creatorId] = await Promise.all([getEvent(id), getEventSupplement(supplementId), getEditorEntities(), getAuthenticatedCreatorId()]); if (!archive || !data || data.supplement.event_id !== id) notFound(); return <EventShell><SupplementDetail data={data} event={archive.event} node={archive.nodes.find((node) => node.id === data.supplement.timeline_node_id)} entities={entities} creatorId={creatorId} /><WorkCommunity kind="supplement" id={data.supplement.id} creatorId={data.supplement.creator_id} /></EventShell>; }
