import * as Y from "yjs";
import type { EditableFloor } from "./draft-model";
import { serializeFloors } from "./draft-model";
import { forumDraftSchema, type ForumEntityReference } from "./schemas";

export type SharedForum = { title: string; board: string; tags: string; links: ForumEntityReference[]; floors: EditableFloor[] };
export const REMOTE = "remote";
export const MAX_DOCUMENT_BYTES = 2_000_000;

export function replaceText(text: Y.Text, next: string) {
  const before = text.toString();
  if (before === next) return;
  let start = 0, end = 0;
  while (start < before.length && start < next.length && before[start] === next[start]) start++;
  while (end < before.length - start && end < next.length - start && before[before.length - end - 1] === next[next.length - end - 1]) end++;
  if (start > 0 && /[\uD800-\uDBFF]/.test(before[start - 1])) start--;
  if (end > 0 && /[\uDC00-\uDFFF]/.test(before[before.length - end])) end--;
  if (before.length - start - end) text.delete(start, before.length - start - end);
  if (next.length - start - end) text.insert(start, next.slice(start, next.length - end));
}

export function seedForum(value: SharedForum) {
  const doc = new Y.Doc();
  doc.transact(() => {
    doc.getText("title").insert(0, value.title); doc.getText("tags").insert(0, value.tags);
    doc.getMap("meta").set("board", value.board);
    doc.getMap("meta").set("firstId", value.floors[0]?.id ?? null);
    for (const link of value.links) doc.getMap("links").set(link.entity_type + ":" + link.entity_id, link);
    writeFloors(doc, value.floors);
  }, REMOTE);
  return doc;
}

export function floorText(doc: Y.Doc, id: string) { return doc.getMap<Y.Map<unknown>>("floors").get(id)?.get("body") as Y.Text | undefined; }

export function writeFloors(doc: Y.Doc, next: EditableFloor[]) {
  const map = doc.getMap<Y.Map<unknown>>("floors"), order = doc.getArray<string>("order");
  const ids = new Set(next.map(floor => floor.id));
  doc.transact(() => {
    for (const [id, row] of map) if (!ids.has(id) && !row.get("deleted")) row.set("deleted", true);
    for (let i = 0; i < next.length; i++) {
      const floor = next[i]; let row = map.get(floor.id);
      if (!row) {
        row = new Y.Map(); map.set(floor.id, row);
        row.set("body", new Y.Text(floor.body));
        const after = next.slice(i + 1).find(item => order.toArray().includes(item.id));
        order.insert(after ? order.toArray().indexOf(after.id) : order.length, [floor.id]);
      }
      for (const field of ["forum_account_id", "in_world_time", "like_count", "question_count", "replyToId"] as const) if (row.get(field) !== floor[field]) row.set(field, floor[field]);
      replaceText(row.get("body") as Y.Text, floor.body);
    }
    if (!doc.getMap("meta").get("firstId") && next.length) doc.getMap("meta").set("firstId", next[0].id);
  });
}

export function readForum(doc: Y.Doc): SharedForum {
  const map = doc.getMap<Y.Map<unknown>>("floors"), meta = doc.getMap("meta");
  const first = meta.get("firstId");
  const order = [...new Set(doc.getArray<string>("order").toArray())];
  if (typeof first === "string") { const index = order.indexOf(first); if (index >= 0) order.splice(index, 1); order.unshift(first); }
  const floors = order.flatMap<EditableFloor>(id => {
    const row = map.get(id); if (!(row instanceof Y.Map) || row.get("deleted")) return [];
    const body = row.get("body"); if (!(body instanceof Y.Text)) throw new Error("论坛正文结构不可用。");
    return [{ id, body: body.toString(), forum_account_id: row.get("forum_account_id") as string, in_world_time: row.get("in_world_time") as string,
      like_count: row.get("like_count") as number, question_count: row.get("question_count") as number, replyToId: row.get("replyToId") as string | null }];
  });
  if (first && !floors.some(floor => floor.id === first)) throw new Error("首楼不能删除。");
  // Concurrent deletion or insertion never retargets an old quote to another message.
  const positions = new Map(floors.map((floor, index) => [floor.id, index]));
  for (const floor of floors) if (floor.replyToId && (!positions.has(floor.replyToId) || positions.get(floor.replyToId)! >= positions.get(floor.id)!)) floor.replyToId = null;
  if (floors.length > 200 || map.size > 2000 || order.length > 2000) throw new Error("协作文档过大，请保留内容后联系维护者。");
  return { title: doc.getText("title").toString(), tags: doc.getText("tags").toString(), board: meta.get("board") as string, links: Array.from(doc.getMap<ForumEntityReference>("links").values()).sort((a, b) => (a.entity_type + a.entity_id).localeCompare(b.entity_type + b.entity_id)), floors };
}

export function publishableSnapshot(value: SharedForum) {
  return forumDraftSchema.safeParse({ ...value, tags: value.tags.split(/[,，]/).map(tag => tag.replace(/^#/, "").trim()).filter(Boolean), messages: serializeFloors(value.floors) });
}
