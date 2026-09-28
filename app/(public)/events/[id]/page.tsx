import { EventWorkTraces } from "../../../../src/features/entities/event-work-traces";
import { WorkCommunity } from "../../../../src/features/community/work-community";
import { notFound } from "next/navigation";
import { EventShell } from "../../../../src/features/events/components/EventShell";
import { EventDetail } from "../../../../src/features/events/components/EventDetail";
import { getEvent } from "../../../../src/features/events/queries";
import { getAuthenticatedCreatorId, listWikiEntities } from "../../../../src/features/wiki/queries";
export const dynamic = "force-dynamic";
export default async function EventPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const [archive, entities, creatorId] = await Promise.all([getEvent(id), listWikiEntities(), getAuthenticatedCreatorId()]); if (!archive) notFound(); return <EventShell><EventDetail archive={archive} entities={entities} creatorId={creatorId} /><EventWorkTraces id={archive.event.id} /><WorkCommunity kind="event" id={archive.event.id} creatorId={archive.event.creator_id} /></EventShell>; }

