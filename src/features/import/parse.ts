import { z } from "zod";
import { forumDraftSchema } from "../forum/schemas";
import { articleSchema } from "../press/schemas";
import { eventSchema } from "../events/schemas";
import type { ContentBlock } from "../editor/types";

export type ImportKind = "forum" | "article" | "event";
export const MAX_IMPORT_BYTES = 512 * 1024;
const placeholderId = "00000000-0000-4000-8000-000000000001";
const identitySchema = z.object({ handle: z.string().regex(/^[A-Za-z0-9_]{2,32}$/, "账号须为 2–32 位英文字母、数字或下划线"), display_name: z.string().trim().min(1).max(60) });
function checked<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("；"));
  return result.data;
}
function metadata(lines: string[], allowed: string[], offset = 0) {
  const result: Record<string, string> = {};
  lines.forEach((line, i) => {
    const match = /^([a-z_]+|账号|昵称|回复|时间|赞同|疑惑|标题):\s*(.*)$/.exec(line);
    if (!match || !allowed.includes(match[1])) throw new Error(`第 ${offset + i + 1} 行：未知字段或格式错误。`);
    if (Object.hasOwn(result, match[1])) throw new Error(`第 ${offset + i + 1} 行：字段 ${match[1]} 重复。`);
    result[match[1]] = match[2].trim();
  });
  for (const key of allowed) if (!Object.hasOwn(result, key)) throw new Error(`缺少字段 ${key}。空值也请保留字段行。`);
  return result;
}
function document(raw: string, kind: ImportKind, fields: string[]) {
  if (typeof raw !== "string" || new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES) throw new Error("文件最多 512 KiB。");
  const lines = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  if (lines[0] !== "---") throw new Error("第 1 行必须是 ---，请使用对应模板。");
  const end = lines.indexOf("---", 1);
  if (end < 0) throw new Error("缺少元数据结束行 ---。");
  const meta = metadata(lines.slice(1, end), ["format", ...fields], 1);
  if (meta.format !== `ktu-${kind}-v1`) throw new Error(`格式必须为 ktu-${kind}-v1。`);
  return { meta, body: lines.slice(end + 1).join("\n").trim() };
}
function sections(body: string, pattern: RegExp) {
  const matches = [...body.matchAll(pattern)];
  if (!matches.length || body.slice(0, matches[0].index).trim()) throw new Error("正文缺少规定的分节标题，或标题前存在未归属内容。");
  return matches.map((m, i) => ({ name: m[1], body: body.slice(m.index! + m[0].length, matches[i + 1]?.index ?? body.length).trim() }));
}
function item(body: string, fields: string[]) {
  const lines = body.split("\n"); const end = lines.indexOf("---");
  if (end < 0) throw new Error("分节字段后缺少 --- 分隔线。");
  return { meta: metadata(lines.slice(0, end), fields), text: lines.slice(end + 1).join("\n").trim() };
}
const tags = (value: string) => value ? value.split(/[,，]/).map(s => s.trim()) : [];
const count = (value: string) => { if (!/^\d+$/.test(value)) throw new Error("回复、赞同和疑惑须为非负整数。"); return Number(value); };

export function parseForum(raw: string) {
  const { meta, body } = document(raw, "forum", ["title", "board", "tags"]);
  const identities = new Map<string, { handle: string; display_name: string }>();
  const floors = sections(body, /^## 楼层 (.+)$/gm).map((section, index) => {
    if (section.name !== String(index + 1)) throw new Error("楼层须从 1 开始连续编号。");
    const { meta: m, text } = item(section.body, ["账号", "昵称", "回复", "时间", "赞同", "疑惑"]);
    const identity = checked(identitySchema, { handle: m.账号.replace(/^@/, ""), display_name: m.昵称 });
    if (identities.has(identity.handle) && identities.get(identity.handle)!.display_name !== identity.display_name) throw new Error(`账号 ${identity.handle} 的昵称不一致。`);
    identities.set(identity.handle, identity);
    const reply = count(m.回复);
    if (reply > index) throw new Error(`楼层 ${index + 1} 的回复必须为 0 或此前楼层编号。`);
    return { handle: identity.handle, forum_account_id: placeholderId, body: text, in_world_time: m.时间, reply_to_floor_no: reply || null, like_count: count(m.赞同), question_count: count(m.疑惑) };
  });
  const data = checked(forumDraftSchema, { title: meta.title, board: meta.board, tags: tags(meta.tags), messages: floors, links: [] });
  return { ...data, floors: data.messages.map((floor, i) => ({ ...floor, handle: floors[i].handle })), identities: [...identities.values()] };
}

export function parseArticle(raw: string) {
  const { meta, body } = document(raw, "article", ["title", "summary", "tags"]);
  const blocks: ContentBlock[] = [];
  for (const chunk of body.split(/\n\s*\n/).filter(Boolean)) {
    if (/^(#{1,6}) [^\n]+$/.test(chunk)) blocks.push({ type: "heading", text: chunk.replace(/^#{1,6} /, "") });
    else if (chunk.split("\n").every(line => line.startsWith("> "))) blocks.push({ type: "quote", text: chunk.replace(/^> /gm, "") });
    else {
      if (/^(?:#{1,6} |> ?|[-*+] |\d+\. |\||```|~~~|---)/m.test(chunk)) throw new Error("校刊仅支持空行分段、独立标题和引用；列表、表格、代码块请先改为普通段落。");
      blocks.push({ type: "paragraph", text: chunk });
    }
  }
  if (blocks.some(b => "text" in b && /\*|`|!\[|\[[^\]]*\]\(|<\/?[a-z][^>]*>|~~|__/.test(b.text))) throw new Error("校刊不支持行内 Markdown、HTML 或图片语法。请转为纯文本，图片和档案引用在导入后添加。");
  if (!blocks.length) throw new Error("请填写文章正文。");
  return checked(articleSchema, { id: null, version: null, title: meta.title, summary: meta.summary, tags: tags(meta.tags), body: { schema_version: 1, blocks }, publish: false });
}

export function parseEvent(raw: string) {
  const { meta, body } = document(raw, "event", ["title", "summary", "time_range", "starts_on", "ends_on"]);
  const parts = sections(body, /^## (.+)$/gm);
  if (parts.map(s => s.name).join("|") !== "事件背景|后续影响|时间线") throw new Error("须依次包含 ## 事件背景、## 后续影响、## 时间线，且各一次。");
  const nodes = parts[2].body ? sections(parts[2].body, /^### 时间节点 (.+)$/gm).map((section, index) => {
    if (section.name !== String(index + 1)) throw new Error("时间节点须从 1 开始连续编号。");
    const { meta: m, text } = item(section.body, ["时间", "标题"]);
    return { id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, label: m.时间, title: m.标题, description: text };
  }) : [];
  return checked(eventSchema, { ...meta, id: null, version: null, causes: parts[0].body, consequences: parts[1].body, nodes, links: [] });
}
export const parsers = { forum: parseForum, article: parseArticle, event: parseEvent };
