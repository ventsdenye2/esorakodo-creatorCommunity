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

## 2026-09-23 完整草稿事务与跨媒介关联

追加迁移 `202609240007_forum_links.sql`。论坛仍使用按楼层排序的纯文本BBS正文；新增的是主题级档案关联，不把正文转成校刊块编辑器，也不把论坛身份和Creator合并。

`forum_topic_entity_links` 保存 `topic_id` 与恰好一个非空的 `student_id / college_id / place_id / event_id`，全部为真实外键。各实体有反链索引，各Topic+实体有部分唯一索引。匿名仅可读父主题published的关联，作者仅额外可读本人draft关联，隐藏/移除主题关联不可读。客户端没有DML权限，统一由RPC维护。事件引用只允许已发布事件；人物、学院、地点从现有公开档案解析。界面用名称选择，但只保存UUID，公开页解析到现有slug链接，不可见目标不输出链接。

新的唯一应用保存入口为：

```text
save_forum_draft(
  p_topic_id uuid, p_expected_version bigint,
  p_title text, p_board text, p_messages jsonb,
  p_tags text[], p_links jsonb, p_publish boolean = false
) returns bigint
```

`p_links` 格式为最多30项的 `[{entity_type:'student'|'college'|'place'|'event',entity_id:uuid}]`。函数先锁父主题、校验登录/作者/draft及预期版本，随后在同一事务里调用楼层同步、标签同步，更新实体关联和标题版面，并按提交意图调用发布。任何后段错误回滚前面的楼层、标签、关联、标题及版本推进。原先多次HTTP请求的部分成功状态已移除。

`forum_topics.version` 为正bigint。父主题更新会推进版本，旧楼层或标签写入路径也触发父版本推进，避免旧RPC写入后新编辑器无法识别冲突。版本是单调修订标识，不等同于保存次数；一次保存可推进多次，客户端只使用RPC返回的最终值，绝不自行加一。`FORUM_VERSION_CONFLICT` 保留浏览器输入并提示复制后重新载入；发布后原有冻结规则继续生效。

应用变更覆盖 `DraftEditor`、保存action、schema、`getForumTopic`（新增`links`）、草稿恢复路由、公开主题关联阅读。专门的 `m3_forum_atomic.test.sql` 在一个最终rollback事务内覆盖20项授权、原子回滚、乐观锁、实体关系和发布冻结测试；没有向共享本地库发布浏览器测试主题。实际迁移执行与测试结果由本次数据库集成验收补记。

### 007 验收结果

- 数据库集成代理增量应用007成功，`m3_forum_atomic.test.sql` 20项全部通过，类型已同步生成。
- 论坛模块与两个相关路由ESLint通过。类型检查由最终整体校验记录。
- 本地API实测：带人物UUID和楼层的主题单事务保存成功，返回最终版本；重新读取还原关联且仍为draft；陈旧版本拒绝；故意传无效地点UUID导致后段错误，原标题/版本/草稿状态全部保留；匿名关联查询返回空数组。
- 同一临时作者的SSR会话读取实际编辑路由返回HTTP 200，并包含恢复后的关联人物、原楼层正文和关联选择界面。全过程p_publish固定false，无新增公开测试作品。
- 本轮浏览器工具失去可用连接（apps/browsers清单为空），因此007新增控件的实际点击和手机截图未验证；未用另一浏览器或API绕过此前发布动作拒绝。先前校刊手机验收不被误记作007手机验收。

主线最终浏览器复验：原有草稿移除人物后键盘Down选择、添加关联、保存成功、刷新关联和楼层保留；375×812截图发现复用楼层预览grid使人物名挤窄，已将关联选择器独立为forum-entity-picker样式，姓名自适应、移除按钮固定最小宽度。没有发布。
