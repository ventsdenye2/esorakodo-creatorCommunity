# M3 校园论坛数据契约（公开测试版）

## 边界与归属

- `auth.users` 认证现实作者；`profiles.id` 是 `forum_topics.creator_id`。`forum_accounts.created_by` 也是现实作者 ID，但 Forum Account 是戏内发言身份，不是登录账号。一个 Creator 可创建多个 Forum Account，可选关联 `students.id`。
- 一个 Topic 是一位 Creator 完整编排的论坛体作品；真实读者不写入 `forum_messages`。戏外评论属于以后的独立模型。
- 草稿 Topic、楼层与 Topic 标签关联仅其 Creator 可读；发布后任何人可读。`hashtags` 是全局公开词表，单独创建的标签名可能在关联的草稿发布前可见，Topic 与楼层不会随之曝光。需要完全保密的标签文案不要在草稿阶段创建。
- 首发版本发布后冻结标题、楼层、标签与状态；`hidden/removed` 预留给未来带审计的管理员工作流，没有授予客户端状态转换。未来的修订不直接覆盖已发布作品。

## 表与索引

| 表 | 关键字段 | 写入约束 |
| --- | --- | --- |
| `forum_topics` | `id uuid`、`creator_id uuid`、`title text`（去首尾空白后 1–160 字符）、`board text`（小写字母/数字/连字符，2–32）、`status text`（`draft/published/hidden/removed`）、`published_at timestamptz`、`created_at/updated_at` | 插入仅作者自己的 `draft`；客户端只可更新本人 `draft`，且保留 `draft`；发布只能用 RPC。`board,published_at,id` 有 published 部分索引。 |
| `forum_messages` | `id uuid`、`topic_id uuid`、`forum_account_id uuid`、`floor_no int`、`body text`（去首尾空白后 1–10000 字符）、`reply_to_message_id uuid?`、`in_world_time text?`（最多 100 字符）、`created_at/updated_at` | `(topic_id,floor_no)` 唯一；楼层号正整数；Forum Account 必须由 Topic Creator 创建；回复仅指向同一 Topic 更早楼层；draft 可改，published 冻结。 |
| `hashtags` | `id uuid`、`name text`、生成列 `normalized_name text`、`created_at` | 显示名 1–64 字符，不包含 `#`；去首尾空白、合并内部空白并小写后的名称唯一。只允许已登录 Creator 新建，不允许直接更新或删除。 |
| `forum_topic_hashtags` | `topic_id uuid`、`hashtag_id uuid` | 复合主键去重；仅本人 draft 可增删；发布后冻结；按 `hashtag_id,topic_id` 索引浏览。 |

## 写入 RPC

### 一次保存所有楼层

`public.replace_forum_draft_messages(p_topic_id uuid, p_messages jsonb) returns setof public.forum_messages`

`p_messages` 是最多 100 项的 JSON 数组。数组顺序决定 `floor_no`，从 1 起连续编号；可以传 `[]` 清空草稿。每项仅允许：

```json
{
  "forum_account_id": "the-author-owned-account-uuid",
  "body": "楼层纯文本",
  "reply_to_floor_no": 1,
  "in_world_time": "2187-09-23 20:30"
}
```

`reply_to_floor_no` 与 `in_world_time` 可省略或填 `null`，回复必须指向数组内更早楼层。RPC 锁住 Topic，确认 `auth.uid()` 等于 `creator_id` 且状态为 `draft`，删除旧楼层，逐层写入并返回新楼层（按楼层号排序）。任一项失败，整次 RPC 在 PostgreSQL 事务内回滚，旧楼层不丢失。应用层仍须先校验表单并显示对应错误；不要把保存拆成一组独立客户端请求。

### 一次同步草稿标签

`public.replace_forum_draft_hashtags(p_topic_id uuid, p_names text[]) returns setof public.hashtags`

`p_names` 是最多 8 个标签名的数组，可传 `[]` 清空草稿标签。RPC 锁住本人草稿 Topic，按去首尾空白、合并内部空白、小写后的键去重，创建不存在的标签，原子替换 Topic 的标签关联并返回按规范化名称排序的标签行。调用失败时原有关联保留；已发布 Topic、别人的草稿、匿名用户均不能调用。标签名不含 `#`，且每项去首尾空白后长度 1–64。全局标签词表独立保留，解除某个 Topic 关联不会删除标签。
### 发布

`public.publish_forum_topic(p_topic_id uuid) returns public.forum_topics`

RPC 锁住作者草稿，校验至少一层、楼层从 1 连续、所有 Forum Account 属于该 Creator、回复位于同一 Topic 且早于当前层，然后在同一事务设置 `status='published'` 和 `published_at`。重复发布失败，发布时间不会重写。客户端不具有直接将 Topic 改为 published 的 RLS 权限。

### 错误契约

| SQLSTATE | 文本 | 含义 |
| --- | --- | --- |
| `42501` | `FORUM_AUTH_REQUIRED`、`FORUM_TOPIC_NOT_OWNED` | 未登录或不是 Topic 作者；查询也受 RLS 限制。 |
| `23514` | `FORUM_TOPIC_NOT_DRAFT`、`FORUM_TOPIC_EMPTY`、`FORUM_FLOOR_SEQUENCE_INVALID`、`FORUM_ACCOUNT_NOT_OWNED`、`FORUM_REPLY_INVALID` | 状态或楼层、账号、引用不符合发布/保存约束。 |
| `23514` | `FORUM_MESSAGES_INVALID`、`FORUM_MESSAGE_INVALID`、`FORUM_HASHTAGS_INVALID`、`FORUM_HASHTAG_INVALID` | 整组 JSON、某一楼层格式或标签数组/标签名不合法。 |
| `23505` | 唯一键冲突 | 重复楼层号或规范化后重复的 Hashtag。 |
| `42501` / `23514` | PostgreSQL/RLS 错误 | 直接越权写表或草稿引用不可见；应用层统一映射为无权/不可操作，不依赖细节泄露存在性。 |

## 读取与上线边界

- 公共列表限定 `status='published'`；数据库 RLS 已隔离草稿，但查询仍应显式按状态、`published_at desc` 排序。楼层显式 `order by floor_no`，不依赖插入时间。
- Topic 与 Student 的首发反向关系可由公开楼层 `forum_account_id → forum_accounts.student_id` 查询；Forum Account 是关系桥梁，不将 Creator 与 Student 合并。
- 标签页先查 `hashtags.normalized_name` 与 `forum_topic_hashtags.hashtag_id`，再只展示 published Topic。`hashtags.name` 是展示文字，`normalized_name` 是精确去重/查询键。
- `forum_messages.body` 为纯文本，渲染时保持文本转义；不引入富文本 HTML、媒体附件或戏外读者评论。
- 迁移为 `202609230002_m3_forum.sql` 与追加的 `202609230003_m3_forum_tag_rpc.sql`，测试是 `m3_forum.test.sql`。本地 `supabase migration up --local` 增量应用成功；`supabase test db --local` 通过 M1/M2/M3 共 82 项，M3 为 51 项。没有对本地数据库执行 reset。
