import { randomUUID } from "node:crypto";
import * as Y from "yjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../types/database";
import { ForumAccessError } from "./collaboration-server";
import { isForumDocumentComplete } from "./collaboration-sync";
import { publishableSnapshot, readForum, seedForum } from "./collaboration-document";

export async function restoreCheckpoint(db: SupabaseClient<Database>, topicId: string, checkpointId: string, revision: number) {
  const { data, error } = await db.from("forum_checkpoints").select("state").eq("topic_id", topicId).eq("id", checkpointId).single();
  if (error || !data) throw new ForumAccessError("存档不可用，请重新打开版本记录。", 404);
  const old = new Y.Doc();
  try {
    Y.applyUpdate(old, Buffer.from(data.state, "base64"));
    if (!isForumDocumentComplete(old)) throw new ForumAccessError("这个存档的同步内容不完整，无法恢复。", 400);
    const value = readForum(old), snapshot = publishableSnapshot(value);
    if (!snapshot.success) throw new ForumAccessError("这个存档含有尚未完成的正文，无法直接回退。", 400);
    const rebuilt = seedForum(value);
    try {
      rebuilt.getMap("meta").set("recoveryEpoch", randomUUID());
      const result = await db.rpc("restore_forum_checkpoint", { p_topic_id: topicId, p_checkpoint_id: checkpointId, p_expected_revision: revision,
        p_state: Buffer.from(Y.encodeStateAsUpdate(rebuilt)).toString("base64"), p_first_id: value.floors[0]?.id ?? null, p_snapshot: snapshot.data as unknown as Json });
      if (result.error) throw managementError(result.error.message);
    } finally { rebuilt.destroy(); }
  } finally { old.destroy(); }
}
export function managementError(message: string) {
  if (message.includes("OWNER_REQUIRED")) return new ForumAccessError("只有原作者可以执行这个操作。");
  if (message.includes("CONFLICT")) return new ForumAccessError("帖子刚被更新，请检查最新内容后重试。", 409);
  if (message.includes("RESTORE_INCOMPLETE")) return new ForumAccessError("存档中的身份或图片目前不可用，未回退任何内容。", 400);
  return new ForumAccessError("操作未完成，请检查权限后重试。", 400);
}
