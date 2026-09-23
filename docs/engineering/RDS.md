# KTU 平台需求设计 RDS

## 当前实现链路

| 入口或模块 | 当前职责 | 证据 | 设计判断 |
| --- | --- | --- | --- |
| `app/` | App Router 页面、Auth callback、Server Action 装配 | 首页、占位媒体路由、登录、注册、Creator 页面 | 保持路由薄，不在 page 中堆积业务写入 |
| `src/features/auth/` | Auth 表单校验与 Server Actions | `actions.ts`、`schemas.ts` | 作为后续 feature 的结构样板 |
| `src/lib/supabase/` | browser/server client 与环境配置 | `client.ts`、`server.ts`、`config.ts` | 所有 Supabase 初始化继续集中在此 |
| `supabase/migrations/` | 数据模型、函数、索引、grants、RLS | M0/M1、M2 Wiki、M2 Grants hardening 三条 migration | 后续只通过追加 migration 演进 |
| `src/types/database.ts` | 已从本地迁移后 schema 生成的数据库类型，末尾附应用别名 | 覆盖六张表与三个 Wiki RPC | schema 变更后重新生成并检查类型差异 |
| `tests/rendered-html.test.mjs` | 构建后公共路由、Auth 跳转与 Wiki 页面渲染检查 | 已兼容未配置与已配置 Supabase；不验证数据库行为 | 保留为 smoke test，配合 pgTAP、真实 API 与浏览器测试 |
| `tests/local-api.test.mjs` | 本地 GoTrue、Profile RLS、Wiki RPC 的双用户集成测试 | 已在本地 Auth/API 通过，测试数据由 service role 清理 | 仅允许本地 API URL；独立开发项目另行验证 |
| `app/globals.css` | M0 临时视觉令牌与页面样式 | Institutional / Editorial 初稿 | 迁移为分层令牌与语义组件，不绑定领域字段 |

## 目标模块与依赖方向

```text
app routes / route handlers
        │
        ▼
src/features/<domain>/actions + queries + schemas
        │
        ├────────► src/components/<domain> + src/components/ui
        │
        ├────────► src/lib/supabase
        │
        └────────► src/types (generated database + explicit domain view models)
                           │
                           ▼
                 Supabase PostgreSQL/Auth/RLS

M6 only: server upload service ─────► Cloudflare R2
```

依赖只能向下。UI 不直接承担授权；数据库 Row 类型不直接成为所有表单和页面的 View Model；R2 object key 不进入领域显示名称。

## 领域所有权与契约

| 需求 | 所属模块 | 设计决策 |
| --- | --- | --- |
| KTU-AUTH-* | `src/features/auth`、Supabase Auth、profiles | Auth 负责登录身份；profiles 负责公开 Creator 资料；session 在服务端确认 |
| KTU-WIKI-* | `src/features/wiki`、实体表、wiki_revisions | 所有修改调用数据库原子函数；回滚等同于以旧快照创建新修订 |
| KTU-LINK-* | `src/components/entity-link`、`src/features/entities` | 使用 `{entityType, entityId, label}` 契约；URL 由统一 resolver 生成 |
| KTU-FORUM-* | `src/features/forum`、forum_* 表 | Topic 是聚合根；Message 和 hashtag 的写权限继承 Topic Creator |
| KTU-PRESS-* | `src/features/press`、articles/tags | Article 使用版本化结构化正文；编辑器实现放在 adapter 后面 |
| KTU-EVENT-* | `src/features/events`、events/timeline/supplements | Event 与 Supplement 是不同所有权聚合，不共享写权限 |
| KTU-MEDIA-* | `src/features/media`、media_assets、R2 adapter | 服务端签发短时效上传凭证；数据库只记录元数据和 object key |
| KTU-MOD-* | `src/features/moderation`、reports/actions | 举报、可见性和审计分离；管理员授权来源必须可撤销 |
| KTU-SEARCH-* | `src/features/search`、数据库查询函数 | 先前缀/结构化查询，后按证据增加 PGroonga；前端契约保持稳定 |

## 数据与状态设计

### M1 账户

- `auth.users` 是认证来源；`profiles.id` 与其一一对应。
- 本地数据库应用 migration 后，已从 public schema 生成 `Database` 类型；后续 schema 变更应重新生成，独立开发库仍需核对迁移一致性。
- Auth 错误对用户使用稳定中文文案；日志中保留可诊断的服务端上下文，但不记录密钥和密码。

### M2 Wiki

- 保留 `students`、`colleges`、`places` 显式表，不抽象成万能实体表。
- 三类实体使用单调递增的 `version bigint` 做乐观锁；陈旧版本返回 `WIKI_VERSION_CONFLICT`，不自动合并。
- 第一版允许字段：Student 为 `name/college_id/signature/summary`，College 为 `name/summary`，Place 为 `name/college_id/summary`；`id/slug/created_by/created_at` 不可修改。
- `create_wiki_entity` 在同一事务创建实体与首个 Revision；`apply_wiki_revision(entity_type, entity_id, expected_version, patch, summary, source_work_id)` 完成身份验证 → 锁定实体 → 检查版本与字段白名单 → 更新实体 → 写 snapshot → 返回新版本。
- `wiki_revisions` 与三类实体撤销 authenticated 直接写权限；客户端只能通过 security-definer RPC 写入，RPC 仅授予 authenticated。
- Supabase 默认表权限可能先给 `anon` 和 `authenticated` DML；追加 migration 必须显式撤销默认 Grants，再授予公开 SELECT 和授权写入，RLS 负责行级判断。
- `rollback_wiki_revision` 读取历史快照，再调用同一修订链路写入新 Revision，不删除或覆盖历史。

### M3 Forum

- `forum_topics`：creator_id、title、board、status、published_at、created_at、updated_at。
- `forum_messages`：topic_id、forum_account_id、sort_order/floor_no、body、reply_to_message_id、in_world_time。
- `hashtags` 与 `forum_topic_hashtags` 分离；规范化名称唯一。
- 第一版 body 使用受限纯文本或安全的小型结构，不把 M4 富文本依赖提前带入。
- 状态：`draft → published → hidden/removed`。作者可编辑 draft；published 的编辑策略在实现前明确为生成版本或受限修改，不能静默重写历史作品。
- Topic 发布使用事务校验至少一个楼层、楼层顺序唯一、所用 Forum Account 归当前 Creator 所有。

### M4 Press

- `articles`、`tags`、`article_tags` 保持显式关系；有限标签数量由数据库约束函数和服务端共同执行。
- 正文 JSON 必须有 `schema_version`；解析器对未知节点安全降级。
- 编辑器库通过 adapter 映射到平台正文 schema，避免库升级等于数据迁移。
- `work_entity_links` 记录作品类型、作品 ID、实体类型、实体 ID、关系性质；写入与发布校验同步。

### M5 Events

- `events`、`event_timeline_nodes`、`event_supplements` 分表。
- Event Creator 拥有主档案和 Timeline；Supplement Creator 只拥有自己的补充。
- 时间节点使用 `(event_id, sort_order)` 唯一约束；展示时间可以是文本/日期/时间戳，但需要单独保存可排序字段或明确不可排序。
- Event、Timeline、Supplement 的实体关联复用 `work_entity_links` 的查询契约，但不合并领域表。

### M6 Media 与治理

- `media_assets` 保存 uploader、object_key、mime、byte_size、width/height、status 和时间。
- 上传状态建议为 `pending → uploaded → ready`，失败或违规进入 `rejected/hidden`；对象存在不代表作品已发布。
- R2 adapter 隔离 S3 API 细节；签名接口只返回单次所需字段并设置短时效。
- `reports` 保存目标类型/ID、举报人、原因、状态；`moderation_actions` 保存操作者、动作、原因和前后状态。
- 删除默认先做可审计的隐藏；物理清理是独立、可重试的后台任务。

### M7 Search

- UI 依赖稳定 `SearchResult` 契约，不依赖 PGroonga 特有返回格式。
- 第一阶段查询 handle、slug、名称、标题、hashtag；事件优先结构化过滤。
- PGroonga 只有在真实中文语料和查询样本证明需要时启用，并提供 migration、回滚和无扩展降级路径。

## 前端设计方案与门禁

### 设计命题

- 具体对象：一座仍在被共同书写的空天大学数字校园。
- 主要受众：阅读世界设定的访客，以及创建作品与实体的 Creator。
- 页面共同任务：让用户知道自己正在看哪一种校内媒介、内容由谁维护，以及可以沿哪个实体继续探索。

### 临时令牌方向

这些令牌用于形成一致的功能阶段基线，不代表最终美术冻结：

| 角色 | 名称 | 建议值 |
| --- | --- | --- |
| 背景 | Archive White | `#F8FAFD` |
| 主文字 | Orbital Navy | `#0A2147` |
| 交互 | Altitude Blue | `#296CB7` |
| 状态强调 | Signal Amber | `#C7662E` |
| 次级文字 | Graphite | `#536178` |
| 分隔 | Registry Line | `#CBD7E6` |

- Display：思源宋体或可合法自托管的中文宋体，用于标题与叙事入口。
- Body：思源黑体或系统中文无衬线，用于长文、表单和操作。
- Utility：IBM Plex Mono 或兼容等宽字体，用于档案编号、时间和版本；未确认字体分发前使用可靠 fallback。

### 布局语言

```text
┌─ 校级导航 ─────────────────────────────────────────┐
│ 媒介身份 / 页面标题                   Creator 操作 │
├───────────────────────────────┬────────────────────┤
│ 主内容：论坛 / 文章 / 档案专属结构 │ Campus Trace      │
│                               │ 实体、来源、修订、路径 │
└───────────────────────────────┴────────────────────┘
```

记忆点是 `Campus Trace`：一个克制的动态档案标签区，将档案编号、人物、机构、事件和论坛来源变成可切换、可继续探索的真实导航。轨道动效只反馈当前标签状态，并支持键盘和 reduced-motion；在校园建筑设定完成前，不展示任何具体建筑形象。移动端改为两列标签和单列内容。这是唯一重点视觉风险，其他区域保持安静、精确。

### 自我批评与修正

- 风险：白底、宋体、细线容易落入通用“编辑部报纸”模板。
- 修正：结构不靠仿报纸列线制造气质，而由真实的学院层级、档案编号、Revision、实体关系和媒介差异产生。
- 风险：空天主题容易变成深色霓虹 HUD。
- 修正：空间感来自尺度、轨迹与导航关系；不使用全站黑底、发光边框和无意义仪表盘。
- 风险：过早追求视觉会拖慢功能闭环。
- 修正：每个里程碑只做一次小型设计循环，先保证信息层级、状态和可用性；最终字体、插画和品牌资产在 M7 收敛。

### 每个 UI 任务的执行顺序

1. 调用 `frontend-design` skill，写明对象、受众和页面单一任务。
2. 形成 4–6 色令牌、字体角色、布局草图和一个记忆点。
3. 对照产品基线做“是否像通用 SaaS/报纸/HUD 模板”的自我批评并修正。
4. 先实现语义结构、状态、键盘与响应式，再补视觉细节。
5. 检查 loading、empty、error、unauthorized、conflict、success 状态和界面文案一致性。
6. 用真实浏览器截取桌面和移动端，检查焦点、对比度、溢出和 reduced motion。

## 修改围栏

| 类别 | 范围 | 规则 |
| --- | --- | --- |
| 允许修改 | `app/`、`src/components/`、`src/features/`、`src/lib/`、`src/types/`、`supabase/migrations/`、`tests/`、`docs/` | 按 DPS 和当前里程碑修改 |
| 禁止修改 | Creator/Student/Forum Account 三层边界、三种媒介独立模型、Event 主档案单一维护者、Git migration 原则 | 除非用户明确修改产品基线 |
| 禁止修改 | secrets、生产数据、未授权外部服务 | 不写入 Git，不以测试为由触碰生产 |
| 条件修改 | Vinext/Sites 运行时 | 只有标准 Next API 无法满足且有迁移评估时修改 |
| 条件修改 | 富文本编辑器、PGroonga、R2、管理员角色 | 到达对应决策门并有验证方案后引入 |
| 条件修改 | 现有 M0 视觉 | 可逐步重构，但保持 CSS 令牌与语义组件可替换，不阻塞核心功能 |

## 验证策略

| 层级 | 证明内容 | 建议入口 |
| --- | --- | --- |
| 静态 | 类型、Lint、模块边界 | `npm run lint`、`npm run typecheck` |
| 构建 | App Router/Vinext 编译与 Worker 输出 | `npm run build` |
| 单元 | schema、状态转换、实体 URL、正文 parser | Node test 或项目选定的轻量测试框架 |
| 数据库 | trigger、RPC、RLS、grants、约束、回滚 | 本地/开发 Supabase + SQL/pgTAP 测试 |
| 集成 | Server Action 到数据库的成功与失败路径 | 隔离测试用户与测试数据 |
| 浏览器 | 注册、编辑、发布、跨实体导航、权限反馈 | Playwright 或等价真实浏览器测试 |
| 视觉与可用性 | 桌面/移动、焦点、空错载、溢出、媒介差异 | 截图与人工检查，必要时加视觉回归 |
| 外部服务 | Auth 邮件、R2 上传、PGroonga 查询 | 对应开发项目的真实服务证据 |

## 兼容与迁移原则

- 每个 migration 可从上一提交顺序应用；不修改已在共享环境应用的历史 migration。
- 破坏性列变更采用 add → backfill → dual read/write（需要时）→ switch → remove 的分阶段策略。
- 内容 JSON 带 schema version 和迁移器；未知版本不静默损坏。
- 发布 URL 使用稳定 ID 或不可变 slug 策略；若允许改 slug，需保留 redirect/alias。
- 部署运行时特有代码保持隔离，标准 Next.js API 是默认兼容层。
