import { z } from "zod";

const credentials = z.object({
  email: z.string().email("请输入有效邮箱。"),
  password: z.string().min(8, "密码至少需要 8 个字符。"),
});

export const signInSchema = credentials;

export const signUpSchema = credentials.extend({
  handle: z
    .string()
    .min(3, "用户名至少需要 3 个字符。")
    .max(32, "用户名不能超过 32 个字符。")
    .regex(/^[a-z0-9_]+$/, "用户名仅可使用小写字母、数字和下划线。"),
  displayName: z.string().min(1, "请填写显示名称。").max(60),
});
