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

- 实施契约和错误码以 `docs/design/forum-data-contract.md` 为准；`docs/design/forum.md` 记录 BBS 阅读与编排页面。Forum Account 仍由独立的现实 Creator 拥有，可选关联 Student。
- `forum_topics`：creator_id、title、board、status、published_at、created_at、updated_at。
- `forum_messages`：topic_id、forum_account_id、sort_order/floor_no、body、reply_to_message_id、in_world_time。
- `hashtags` 与 `forum_topic_hashtags` 分离；规范化名称唯一。
- 第一版 body 使用受限纯文本或安全的小型结构，不把 M4 富文本依赖提前带入。
- 状态：本版只提供 `draft → published`；`hidden/removed` 保留字段值但客户端没有转换权限。作者可编辑 draft，published 冻结。未来版本化修改和审核另立迁移。
- Topic 发布使用事务校验至少一个楼层、楼层顺序唯一、所用 Forum Account 归当前 Creator 所有。
- `replace_forum_draft_messages` 按 JSON 数组原子替换所有楼层，`replace_forum_draft_hashtags` 原子同步至多八个标签；Topic 标题/版面是第三个独立写请求。跨三个 HTTP 请求没有统一事务，失败后 UI 须提示部分保存并重新载入。
- 公开列表按 board 与标签查询已发布 Topic；Student Wiki 由 `forum_accounts.student_id → forum_messages → forum_topics` 只反查 published 作品。

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

- 当前首页的概念沙盘和 Campus Layer 首批已实施，证据见 `docs/design/living-campus-implementation.md`。`homepage-concept-v1.md` 是旧基线，`living-campus-v2.md` 的真实关系图、Peek 与正式 3D 仍是拟实施范围。
- 对象是一座仍在被共同书写的空天大学数字校园。访客能沿人物、地点、论坛讨论和档案探索；Creator 能识别创作入口及本人管理的内容。
- v2 的 Entity / Relation / Space / Time 是前端浏览维度，不能据此新建通用 Entity 表或将模型 objectName 当作 Place 的主键。当前 2D 路由与普通链接始终是完整路径。

### 视觉与媒介契约

- 保留 Institutional × Editorial × Spatial × Living Archive；用大学、校刊、档案和建筑沙盘的真实结构形成识别度，避免统一卡片、全站霓虹 HUD、玻璃拟态和装饰性关系线。
- `docs/design/living-campus-v2.md` 中的纸面、海军蓝、航空蓝、信号橙及夜间令牌是候选值，实施前后都要与真实渲染对照。字体仍区分宋体标题、无衬线操作、少量等宽元数据。
- 主导航保留五类现有路由。Campus Layer 是可选空间探索模式；Forum 保持 BBS 行和有序楼层，Press 保持出版物版式，Event 保持档案/时间线与克制的夜间区，Wiki 保持修订档案感。
- 未完成的业务入口、假搜索、假实时动态不得伪装成可用产品；演示地点、坐标和关系不能被写成已确认 Canon。

### 空间与关系所有权

- 首版 Campus Layer 只用轻量 SVG/CSS 场景。未来 3D 的 `CampusSpatialBinding` 只把稳定 Place ID/slug 映射到模型 objectName、锚点与相机预设；业务事实依旧由数据库和各媒介拥有。
- `EntityLink` 保持可直接访问的 `<a href>`，Peek 只做渐进增强；Relation Field 的连线只反映已有可读关系。用户浏览 Trace 与数据库事实明确分开。
- 3D 不能成为登录、阅读、创作或导航的唯一入口。移动端首页保持轻量，打开 Layer 后才加载较重场景；未来模型到位后再评估 Three.js、资产预算与性能。

### 自我批评与修正

- 白底、宋体、细线容易成为通用报纸模板：只用承载真实顺序、来源与关系的结构线。
- 空间场景容易成为科技噱头：Campus Layer 只承担地点探索，维持清楚的 2D 阅读主线和键盘路径。
- 未确认的建筑示意容易固化错误世界观：演示点位必须标识，待 Place 与校园模型定义后才建立正式绑定。
- 大型视觉重构容易拖慢首发：按 `living-campus-v2.md` 的七阶段实施，每阶段单独验证，M1–M3 的可用与权限证据仍是上线条件。

### 每个 UI 任务的执行顺序

1. 调用 `frontend-design` skill，写明对象、受众和页面单一任务。
2. 形成 4–6 色令牌、字体角色、布局草图和一个记忆点。
3. 对照产品基线做“是否像通用 SaaS/报纸/HUD 模板”的自我批评并修正。
4. 先实现语义结构、状态、键盘与响应式，再补视觉细节。
5. 检查 loading、empty、error、unauthorized、conflict、success 状态和界面文案一致性。
6. 用真实浏览器截取桌面和移动端，检查焦点、对比度、溢出和 reduced motion。
7. 同批更新设计记录、DPS 状态、`progress.md` 与 `verification.md`；未实施的 v2 事项持续标为 Proposed。

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

## 2026-09-23 · Campus View 实现

- `campus-hero.tsx` 服务端读取，`campus-view-data.ts` 使用现有 Supabase SSR/RLS 客户端；论坛 published_at、Wiki created_at 跨来源降序合并前 6 条，每个源限 6 条。局部失败保留成功源并显示错误提示。
- `campus-card-stack.tsx` 只承担客户端展示与 5.5 秒轮播，首卡为最新内容。inert 隔离底层卡片，暂停、悬停、焦点、页面隐藏及 reduced-motion 控制自动切换。
- 无数据库迁移。无客户端权限扩大；没有实时订阅，新内容在重新加载首页时读取。校刊／事件发布源留待 M4/M5。
- 视觉和文案约定见 `docs/design/campus-view-stack.md`。

## 2026-09-23 完整平台契约补充

- 当前用户授权扩展至M4–M7完整前后端，先本地实现/验收，再微调、部署。详细分工、视觉与修改围栏见 `docs/design/full-platform.md`。
- 正文使用版本化原生块schema（段落、标题、引文、UUID实体、受控图片）；校刊采用固定分类至多3项；事件补充显式标注细节、人物视角、余波、传闻和不同观点。
- M6管理员来自可撤销的`moderators`表，仅数据库管理端授予。上传R2保持私有，服务端验证大小、MIME和文件签名，浏览器无密钥。
- 搜索采用有界中文名称/标题包含匹配与trigram索引，不提前启用PGroonga。
- 收藏/点赞/评论以真实Creator为主体，独立于戏内论坛正文楼层；关联使用真实FK。

## 2026-09-23 全平台实现更新

本批按 full-platform.md 完成 M4–M7 及跨域集成：新增迁移 202609240001–008，包含内容/RPC/RLS、媒体/运营、社区互动、内容细化、搜索、头像、论坛原子实体引用、定向审核预览。所有新迁移只应用本地并重新生成数据库类型。Node/Worker 共用 aws4fetch 媒体签名；会话刷新位于请求边界，仍由 server actions 与 RLS 执行授权。

首页卡片堆与栏目取真实公开数据；人物/学院/地点和事件详情提供 UUID 反向作品关联。校园导览保留示意性质，文案改为大学栏目导览，未宣称建筑与真实坐标绑定。Creator 公共资料与真实作者身份不与 Student / Forum Account 混同。

执行状态：实现与集成完成，最终检查见 verification.md，未提交、未部署。187/187 数据库事务测试与 MinIO 私有媒体链路通过。浏览器新文章发布曾被自动审核拒绝，未绕过；已做草稿、预览、SQL 回滚事务及权限验证。授权许可方式尚待决定，不标记现有作品为 CC 授权。外部 R2/CORS、SMTP、云数据库与宿主 HTTPS 为部署阶段条件。

## 2026-09-28 · lax01 部署准备

用户授权本机SSH密钥连接ventsdenye及root@lax01.ventsdenye.com；保留现有Supabase项目，不干扰其他网站。已只读核对原站/端口/Nginx，并安装独立Node22.23.3、ktu系统用户与本项目空目录，未启用应用或代理。采用deploy/lax01独立配置：回环3107、版本目录、受限HTTPS预览及注册开关。现有主站与作品集配置hash和200基线保存在deploy/lax01/README.md。

下一步需要用户本机Supabase CLI登录与项目用途确认，然后只读云schema/迁移/备份审计。R2与SMTP尚未配置，具体用户操作见该README；没有迁移云库或公开应用。Cloudflare域名已解析到代理IP（旧NXDOMAIN记录已过时），源站配置仍待核实。

## 2026-09-29 · 反向代理媒体同源校验修复

线上验收发现公开 HTTPS Origin 与应用内部 HTTP Request URL 不同，原同源比较误拒绝上传。生产媒体 POST 现只信任部署配置 NEXT_PUBLIC_SITE_URL 的 origin；缺失、非 HTTP(S)、带凭据或非根路径/query/hash 的配置拒绝请求，不回退 Host，不信任 Forwarded/X-Forwarded-*。开发仍使用 Request URL 的 origin。配置必须是完整站点根 URL；本地 standalone 媒体测试显式覆盖为 http://127.0.0.1:3005。

对应实现为 src/features/media/same-origin.mjs 与 server.ts；测试 tests/media-origin.test.mjs 覆盖内部 HTTP/外部 HTTPS、异源/缺失/opaque Origin、伪造转发头、非法/缺失配置和开发/本地 standalone。直接 node tests/media-origin.test.mjs 执行 6/6 通过，typecheck 与定向 ESLint 通过；node --test 在 Windows 沙箱遇到 spawn EPERM，因此改为单进程测试执行。当前为 deploy/backend 工作区增量，Linux 构建及线上复验由主线继续，本记录不代表已部署成功。

2026-09-29：团队入口使用team-beta.nginx.conf，无Basic Auth，保留Supabase身份与RLS、noindex/no-store；源码与runtime分支分开。

## 2026-09-29 · 邮件内置浏览器回调提示

邮箱内置浏览器可能缺少注册浏览器保存的 PKCE verifier。回调仍严格执行 exchangeCodeForSession，不绕过 PKCE、不假定邮箱已确认；SDK pkce_code_verifier_not_found 或 AuthPKCECodeVerifierMissingError 转为中文普通提示，建议用注册邮箱和密码登录。其余回调失败及缺失 code 显示固定中文说明，不透传服务英文或错误细节。

app/auth/callback/route.ts 调用 callback-notice.mjs；auth-callback-notice.test.mjs 使用真实 SDK 错误类、独立 code/name 和普通/空错误验证提示映射，3/3 通过。本次不修改邮件模板，模板由主线单独整合。当前工作区待合并提交；完整构建/线上验收状态由后续记录更新。

2026-09-29中文注册邮件：用户要求确认邮件中文化，已新增deploy/auth-email模板。CLI config push被自动审核拒绝（默认Auth覆盖风险），未执行；改用官方API仅PATCH确认邮件subject/content两字段并GET精确核对。其他设置未改变，只有供应商确认模板custom_contents标志自动变true。旧邮件不变，新邮件中文；未发额外测试邮件。保留ConfirmationURL和PKCE，仅优化回调提示，不把缺verifier当已验证成功。

2026-09-29：专用Nginx精确proxy_redirect仅将http://campus.kongtian.university/改为https同域，避免应用内部HTTP回调Location降级；公开HTTPS验收已通过。


## 2026-09-29 · 论坛树状创作与 Markdown 档案

用户确认：论坛 👍 / ？仅为创作者设置的剧情数据，读者端展示；修订采用线性历史、两版差异、恢复新版本，不做分支合并。补充确认所有论坛身份（包括学生类型）均可不关联人物档案创建。详情见 docs/design/forum-wiki-reading.md。

实现：阅读/编辑共用 ThreadTree，保留楼层编号、父节点链接、分支折叠、原位添加回复、上下移动、计数输入和阅读预览。档案在摘要外新增 50000 字 Markdown 正文，GFM 安全渲染与格式工具栏，历史显示版本、作者、提交说明、快照、行差异；超长差异有时间上限并退化为整段增删。追加迁移 202609290001，旧数据计数默认 0、旧快照缺 body 恢复为空；解除 student_accounts_require_student，FK、所有权和 RLS 保留。

验证完成：最终 lint、typecheck、Windows build 与 Linux 五阶段 build 全部通过。隔离 PostgreSQL 17 原样执行全部 14 个迁移，38 项域表/RPC/RLS 检查通过；Auth 请求声明使用测试函数复现，不等同完整 Supabase Auth/API 验收。浏览器组件覆盖创作交互、序列化、安全 Markdown 和修订恢复表单；action 边界为桩，保存事务另由 SQL 覆盖。云端迁移、推送、SSH 发布和线上真实内容读取验证均完成；没有创建线上测试作品，未声称真实登录发布端到端验收。

交付完成：deploy/backend 源码、deploy/runtime Linux standalone，服务器通过 /etc/ktu-community/update-runtime.sh 浅 fetch/archive 并切换 current，仅重启 ktu-community。功能源码为 72210ce853c6f81abf74e91e32da1c073d653b3c，线上产物为 94bd025a50f2ce48e1e1c5e24a3977cd52b6669a；后续提交仅同步交付文档。追加迁移 202609290001 已应用，六张受影响表原字段数量/指纹事务内一致。原运行版本 116d827 保留用于回滚。测试工具/数据库/截图在 Git 忽略的 output；没有导出云端业务数据。
