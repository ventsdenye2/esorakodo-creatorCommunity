import { notFound, redirect } from "next/navigation";
import { EventShell } from "../../../../../src/features/events/components/EventShell";
import { EventDetail } from "../../../../../src/features/events/components/EventDetail";
import { getEvent } from "../../../../../src/features/events/queries";
import { getAuthenticatedCreatorId, listWikiEntities } from "../../../../../src/features/wiki/queries";
export const dynamic = "force-dynamic";
export default async function PreviewEventPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const creatorId = await getAuthenticatedCreatorId(); if (!creatorId) redirect("/login"); const [archive, entities] = await Promise.all([getEvent(id, true), listWikiEntities()]); if (!archive || archive.event.creator_id !== creatorId) notFound(); return <EventShell><EventDetail archive={archive} entities={entities} creatorId={creatorId} preview /></EventShell>; }
