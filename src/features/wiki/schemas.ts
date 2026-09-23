import { z } from "zod";
import { wikiEntityTypes } from "./types";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable().optional(),
  );

const optionalUuid = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().uuid("关联学院无效。").nullable().optional(),
);

const commonFields = {
  entityType: z.enum(wikiEntityTypes),
  name: z.string().trim().min(1, "请填写档案名称。").max(100, "档案名称不能超过 100 个字符。"),
  summary: optionalText(4000),
  collegeId: optionalUuid,
  signature: optionalText(280),
};

export const createWikiEntitySchema = z.object({
  ...commonFields,
  slug: z
    .string()
    .trim()
    .min(2, "Slug 至少需要 2 个字符。")
    .max(64, "Slug 不能超过 64 个字符。")
    .regex(/^[a-z0-9-]+$/, "Slug 仅可使用小写字母、数字和连字符。"),
});

export const updateWikiEntitySchema = z.object({
  ...commonFields,
  entityId: z.string().uuid("档案 ID 无效。"),
  slug: z.string().min(1),
  expectedVersion: z.coerce.number().int().positive(),
  editSummary: z.string().trim().min(1, "请填写本次修改说明。").max(280, "修改说明不能超过 280 个字符。"),
});

export const rollbackWikiRevisionSchema = z.object({
  revisionId: z.string().uuid("Revision ID 无效。"),
  entityType: z.enum(wikiEntityTypes),
  slug: z.string().min(1),
  expectedVersion: z.coerce.number().int().positive(),
});
