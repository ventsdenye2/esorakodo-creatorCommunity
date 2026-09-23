import { z } from "zod";

export const forumAccountSchema = z.object({
  handle: z.string().trim().regex(/^[A-Za-z0-9_]{2,32}$/, "账号标识须为 2–32 位英文字母、数字或下划线。"),
  displayName: z.string().trim().min(1, "请填写显示名称。").max(60, "显示名称不能超过 60 字。"),
  accountType: z.enum(["student", "unknown", "organization", "bot"]),
  studentId: z.preprocess((value) => value === "" ? null : value, z.string().uuid().nullable()),
  signature: z.preprocess((value) => value === "" ? null : value, z.string().trim().max(280).nullable()),
}).refine((value) => value.accountType !== "student" || value.studentId !== null, {
  message: "学生身份必须关联人物档案。", path: ["studentId"],
});
