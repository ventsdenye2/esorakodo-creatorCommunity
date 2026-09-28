import Link from "next/link";
import { StructuredBodyRenderer } from "../../editor/components/StructuredBodyRenderer";
import { parseBody, type EditorEntity } from "../../editor/types";
import type { getEventSupplement, EventRecord, EventNode } from "../queries";
import { supplementKinds } from "../schemas";
export function SupplementDetail({ data, event, node, entities, creatorId, preview = false }: { data: NonNullable<Awaited<ReturnType<typeof getEventSupplement>>>; event: EventRecord; node?: EventNode; entities: EditorEntity[]; creatorId?: string | null; preview?: boolean }) {
  const { supplement, creator } = data;
  return <article className="event-supplement"><nav className="event-crumb"><Link href="/events">校史事件</Link><span>/</span><Link href={`/events/${event.id}`}>{event.title}</Link></nav>{preview && <p className="event-notice">已保存版本预览 · {supplement.status === "published" ? "公开资料" : "仅作者可见"} <Link href={`/create/event/supplement/${supplement.id}`}>返回编辑</Link></p>}<header><p className="archive-label">ARCHIVE / SUPPLEMENT</p><span className="event-kind">{supplementKinds[supplement.kind as keyof typeof supplementKinds] ?? "补充材料"}</span><h1>{supplement.title}</h1><p>署名：{creator ? <Link href={`/creator/${creator.handle}`}>{creator.display_name}</Link> : "作者暂不可用"} · 修订版本 {supplement.version}</p>{node && <p>对应节点：<Link href={`/events/${event.id}#node-${node.id}`}>{node.label} · {node.title}</Link></p>}{creatorId === supplement.creator_id && <Link href={`/create/event/supplement/${supplement.id}`}>维护此份资料 →</Link>}</header><StructuredBodyRenderer body={parseBody(supplement.body)} entities={entities} /><footer>本资料独立署名，不直接改写主档案。<Link href={`/events/${event.id}`}>返回事件档案 →</Link></footer></article>;
}
