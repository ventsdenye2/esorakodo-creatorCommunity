"use client";
import { useActionState, useState, useRef, startTransition, type FormEvent } from "react";
import Link from "next/link";
import { GuideLink } from "../../guide/guide-link";
import { saveSupplement } from "../actions";
import { supplementKinds } from "../schemas";
import type { EventNode, EventSupplement } from "../queries";
import { BlockEditor } from "../../editor/components/BlockEditor";
import { StructuredBodyRenderer } from "../../editor/components/StructuredBodyRenderer";
import { emptyBody, parseBody, type EditorEntity } from "../../editor/types";
export function SupplementForm({ eventId, nodes, supplement, entities, saved = false }: { eventId: string; nodes: EventNode[]; supplement?: EventSupplement; entities: EditorEntity[]; saved?: boolean }) {
  const intentRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(saveSupplement, { error: null });
  const [body, setBody] = useState(supplement ? parseBody(supplement.body) : emptyBody);
  const [preview, setPreview] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => action(data)); }
  return <form action={action} onSubmit={submit} className="event-form"><GuideLink section="events">查看事件档案与补充材料教程</GuideLink><input type="hidden" name="intent" defaultValue="save" ref={intentRef} /><input type="hidden" name="id" value={supplement?.id ?? ""} /><input type="hidden" name="version" value={supplement?.version ?? ""} /><input type="hidden" name="event_id" value={eventId} /><input type="hidden" name="body" value={JSON.stringify(body)} />{state.error && <p className="event-alert" role="alert">{state.error}</p>}{saved && !state.error && <p className="event-notice" role="status">资料已保存。</p>}<fieldset disabled={pending}><legend>补充材料</legend><label>资料标题<input name="title" required maxLength={160} defaultValue={supplement?.title} /></label><div className="event-form-pair"><label>资料性质<select name="kind" defaultValue={supplement?.kind ?? "detail"}>{Object.entries(supplementKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>对应时间节点<select name="timeline_node_id" defaultValue={supplement?.timeline_node_id ?? ""}><option value="">整个事件</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.label} · {node.title}</option>)}</select></label></div></fieldset><BlockEditor value={body} onChange={setBody} entities={entities} disabled={pending} /><div className="event-actions"><button disabled={pending} type="submit" onClick={() => { if (intentRef.current) intentRef.current.value = "save"; }}>保存{supplement?.status === "published" ? "更新" : "草稿"}</button><button type="button" onClick={() => setPreview(!preview)} aria-expanded={preview}>预览正文</button><button disabled={pending} type="submit" className="button button-primary" onClick={() => { if (intentRef.current) intentRef.current.value = "publish"; }}>{supplement?.status === "published" ? "更新公开资料" : "发布资料"}</button></div>{supplement && <Link href={`/create/event/supplement/${supplement.id}/preview`}>打开完整已保存预览 →</Link>}{preview && <section className="event-preview"><h2>正文预览</h2><StructuredBodyRenderer body={body} entities={entities} /></section>}</form>;
}
