import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventShell } from "../../../../src/features/events/components/EventShell";
import { EventForm } from "../../../../src/features/events/components/EventForm";
import { getEvent } from "../../../../src/features/events/queries";
import { getAuthenticatedCreatorId, listWikiEntities } from "../../../../src/features/wiki/queries";
export const dynamic = "force-dynamic";
export default async function EditEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) { const { id } = await params; const creatorId = await getAuthenticatedCreatorId(); if (!creatorId) redirect(`/login?next=/create/event/${id}`); const [archive, entities, query] = await Promise.all([getEvent(id, true), listWikiEntities(), searchParams]); if (!archive) notFound(); if (archive.event.creator_id !== creatorId) return <EventShell><div className="event-empty"><h1>此档案由其他维护者管理</h1><p>你可以独立署名提交补充材料。</p><Link href={`/create/event/${id}/supplement`}>提交补充资料 →</Link></div></EventShell>; return <EventShell><div className="event-edit-page"><nav className="event-crumb"><Link href="/create/event">档案管理</Link><span>/</span>维护档案</nav><h1>{archive.event.title}</h1><p>主档案 · 版本 {archive.event.version} · {archive.event.status === "published" ? "公开" : "草稿"}</p><EventForm key={`${archive.event.id}:${archive.event.version}`} event={archive.event} initialNodes={archive.nodes} initialLinks={archive.links} entities={entities} saved={query.saved === "1"} /></div></EventShell>; }
