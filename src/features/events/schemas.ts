import { z } from "zod";
export const supplementKinds = { detail: "补全细节", perspective: "人物视角", aftermath: "后续影响", rumor: "传闻·未证实", interpretation: "不同观点", article: "专题文章", testimony: "亲历记述", document: "文献资料" } as const;
const date = z.string().refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, "日期格式无效");
export const eventSchema = z.object({
  id: z.uuid().nullable(), version: z.number().int().positive().nullable(),
  title: z.string().trim().min(1, "请填写档案标题").max(160),
  summary: z.string().trim().max(2000), time_range: z.string().trim().max(160),
  causes: z.string().trim().max(10000), consequences: z.string().trim().max(10000),
  starts_on: date, ends_on: date,
  nodes: z.array(z.object({ id: z.uuid(), label: z.string().trim().max(120), title: z.string().trim().min(1, "请填写节点标题").max(160), description: z.string().trim().max(10000) })).max(100),
  links: z.array(z.object({ entity_type: z.enum(["student", "college", "place"]), entity_id: z.uuid() })).max(100),
}).refine((value) => !value.ends_on || !!value.starts_on, "填写结束日期时，请同时填写开始日期").refine((value) => !value.starts_on || !value.ends_on || value.starts_on <= value.ends_on, "结束日期不能早于开始日期").refine((value) => new Set(value.nodes.map((node) => node.id)).size === value.nodes.length, "时间节点不能重复");
