import { z } from "zod";
import { structuredBodySchema } from "../editor/types";
export const articleTags = ["校园怪谈", "个人见闻", "校园生活", "人物故事", "历史", "悬疑", "科幻", "旅行", "随笔"] as const;

export const articleSchema = z.object({
  id: z.uuid().nullable(), version: z.number().int().positive().nullable(),
  title: z.string().trim().min(1, "请填写标题。").max(160, "标题最多 160 字。"),
  summary: z.string().trim().max(500, "摘要最多 500 字。"),
  body: structuredBodySchema,
  tags: z.array(z.enum(articleTags)).max(3, "最多选择 3 个标签。"),
  publish: z.boolean(),
}).refine((value) => !value.publish || value.body.blocks.some((block) => !("text" in block) || block.text.trim().length > 0), { message: "请先写入正文、图片或档案引用再发布。", path: ["body"] });
