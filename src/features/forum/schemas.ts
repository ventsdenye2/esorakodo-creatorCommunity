import { z } from "zod";

export const forumBoards = [
  { id: "campus", label: "校园日常" },
  { id: "academic", label: "课程与学术" },
  { id: "clubs", label: "社团活动" },
  { id: "stories", label: "校园传闻" },
] as const;

export function boardLabel(board: string) {
  return forumBoards.find((item) => item.id === board)?.label ?? board;
}

export const forumTopicSchema = z.object({
  title: z.string().trim().min(1, "请填写主题标题。").max(160, "标题不能超过 160 字。"),
  board: z.enum(forumBoards.map((board) => board.id) as ["campus", "academic", "clubs", "stories"]),
});

export const forumMessageSchema = z.object({
  forum_account_id: z.string().uuid("请选择发言账号。"),
  body: z.string().trim().min(1, "楼层正文不能为空。").max(10000, "单层不能超过 10000 字。"),
  in_world_time: z.string().trim().max(100, "戏内时间不能超过 100 字。"),
  reply_to_floor_no: z.number().int().positive().nullable(),
});

export const forumDraftSchema = forumTopicSchema.extend({
  messages: z.array(forumMessageSchema).max(100, "最多编排 100 层。"),
  tags: z.array(z.string().trim().min(1).max(64)).max(8, "最多添加 8 个标签。"),
});

export type ForumDraftInput = z.infer<typeof forumDraftSchema>;
