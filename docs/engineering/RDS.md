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

## 2026-10-01 · 创作者站内教程

新增公开 /guide 操作手册：身份概念、论坛编排、Markdown 档案、修订恢复、校刊、事件和常见问题。练习区可切换回复关系、设置示例计数和练习 Markdown，完全在页面内运行，不保存或发布。创作中心与页脚提供总入口，各编辑器提供新标签页定位到对应章节的链接，保留当前输入。使用当前真实字段/按钮说明，明确无自动保存、论坛冻结与 Wiki 直接公开。设计见 docs/design/creator-guide.md。

当前状态：图解教程已上线。lint/typecheck、Windows/Linux build、浏览器桌面/手机验收和线上入口/图片/练习验证通过。功能源码 ba365ef，运行产物 1f4d089；已推送并通过 SSH 更新。无 schema/权限变更，部署证据见 engineering/progress.md 与 engineering/verification.md。
### 图解教程补充

用户进一步要求原界面截图与文案一一对应。/guide 现以 10 张原页面/编辑组件截图为主体，34 个编号框选对应 34 项说明；图片使用演示数据，可打开原图。截图位于 public/guide，来自现有表单 DOM/CSS 的实际浏览器渲染，未读取私人草稿或生成虚构界面。交互练习收进展开区域，保留目录和新标签页帮助入口。先前纯文字草案已调整，图解布局和最终构建均已验证。数据/权限没有变化，无新增迁移。

## 2026-10-01 创作 Markdown 导入（进行中）

论坛、校刊/部刊和事件草稿新增版本化 Markdown 导入、UTF-8 文件/粘贴入口、替换确认、严格领域校验与下载模板。论坛由服务器复核并复用本人身份，缺失身份通过单次批量 INSERT 创建；无迁移。事件公开后不整体替换节点。见 `docs/design/markdown-import.md`；图解教程新增格式与 AI 提示词。本地实现完成：lint、typecheck、Windows build 通过；26 项解析器回归、41 项真实 PostgreSQL 17 检查通过（含批量身份创建、冲突整批回滚、归属防伪）。浏览器真实组件校验三种文件导入、错误时保留内容、回复映射与节点数；390px 手机及教程无横向溢出。界面使用演示数据与替代保存边界，未对生产写入测试作品。Linux build 与 standalone 启动/Origin/中文回调冒烟通过。源码 `75e29ecc15f3ee28031fcdc17a62753ca7adc522` 已推送；runtime `4bef03f08062362ce117f4126c3bdcfc8a7097f1` 已经既有 SSH 脚本部署，current 指向匹配版本，服务 active。线上 `/guide#import` 内容、三份模板、原始截图全部 HTTP 200；真实浏览器完成图像载入与模板展开检查。无新迁移、无生产测试作品写入。当前批次完成；后续真实创作者可用自己的草稿完成首次导入保存。


## 2026-10-12 · 论坛多图与直接引用

用户确认多图、选择上传、粘贴图片，并同步 Markdown 导入/编辑；仅展开直接回复目标。已实现平铺楼层、引用正文和图片缩略图、完整图片弹窗、首楼论坛身份的楼主标识。图片格式为独立行 `![说明](/api/media/UUID)`，媒体关联与 RLS 由 `202610120001_forum_images.sql` 追加。详见 [设计与契约](../design/forum-images.md)。历史树状缩进/折叠说明由本需求取代。当前为本地待交付工作区，未部署或应用生产迁移。


## 2026-10-13 · 功能测试修复

表单使用返回错误的 Action 与客户端手动 dispatch；上传状态从组件上报；保存提示比较内容基线。历史换行归一化并采用确定性 diff 上限。评论使用双字段游标及原 RLS。追加发布触发器与索引，无数据回填。详见 ../design/bugfixes-20261013.md。


## 2026-10-13 · 修复交付完成

功能修复完成并上线。源码修复提交 20b29f4、2c87c39、eb3d6d3 均已推送 deploy/backend；Linux runtime 5cab52dced83ab49947205627a63666889bc3f4b 已推送 deploy/runtime，并通过既有 SSH 更新脚本上线。current 指向同名版本，ktu-community active，前版 403d56d 保留。追加迁移 202610130001 已事务应用，三张既有表数量/内容指纹不变；无生产合成作品、评论或媒体创建。

逐项验收及边界见 verification.md 最新记录。上传锁使用同步 ref，覆盖状态提交前的窗口；无未完成修复或待部署步骤。


## 2026-10-15 · 官网与校园站共享维基（本地验收中）

用户要求官网只读、修改跳转校园站、数据互通和官网冲突优先，并补充“其他”类别。实现与发布契约见 [shared-wiki](../design/shared-wiki.md)。追加迁移 202610150001；新增独立 wiki_articles、官网基线映射、操作员专用原子同步、匿名公开接口与官网读取/检索/回退。保留现有 UUID、人物关联和修订历史，官网工程学院对应既有 engineering 身份。

当前工作区：校园站 deploy/backend 与官网 main，变更未提交/未部署；原有官网未跟踪 output/.playwright-cli 未动。124 项隔离 PostgreSQL 检查、lint、typecheck 通过；Windows 五阶段 build 已通过，standalone 补全 121 包。浏览器与公开接口验收进行中，生产迁移及两站发布尚未执行。下一步完成桌面/390px、公开 feed 与跨站编辑跳转验证，再按先 schema/内容、校园站运行时、官网静态产物顺序发布并回读。

### 生产交付门禁（未上线）

功能源码提交 b8ef879，官网源码提交 c5aa34f。生产正式迁移执行请求被自动审批明确拒绝：新增 schema 与导入/覆盖 21 词条属于持久生产变更，审批要求用户显式授权。已停止生产变更，不改用其他连接或工具绕过。ROLLBACK 演练已结束；正式 schema、词条内容和两站运行版本均未更改。等待用户批准：应用已审阅迁移与官网优先导入，发布校园站 Linux runtime，再发布官网静态产物。校验、发布包及本地提交可继续准备，不能据此称已上线互通。


## 2026-10-15 · 共享维基已获授权并上线

用户在本会话明确回复“授权”，批准正式迁移、19 条新词条、2 个学院官网优先覆盖及两站发布；此前自动审批门禁已据此解除。本节取代上方待授权/未上线状态。

- 生产迁移 202610150001 已事务提交并读回：migration=1、官网对应关系=21、其他档案=19、普通 Creator 无权执行官网同步。2 学院保持 UUID 与稳定地址，当前 version=3，历史 1/2/3 全部保留。事务中其他学院/人物/地点内容指纹核对通过，无无关内容改写。
- 校园站已推送源码 deploy/backend 与 Linux runtime deploy/runtime，部署 runtime 为 020a810074e2cb808cc6b5e31fe8c68ad861adb6。/srv/ktu-community/current 指向同名 git release，ktu-community active；原 5cab52d 运行目录保留。更新使用既有 /etc/ktu-community/update-runtime.sh，服务器没有安装依赖或构建。
- 官网 main=c5aa34f，deploy=c67587363ecb3bc2e675337fa67cb71f40cc956a，均已推送。服务器 deploy 从 652630e 快进到 c675873，git archive 覆盖静态发布目录；8 个维基文件 SHA-256 与 Git 一致，nginx -t 通过。该快进也包含原 deploy 分支已有、此前未在服务器发布的院系展示修复。站点备份：/var/backups/kongtian-university/pre-shared-wiki-20261015T125806Z.tar.gz。
- 真实浏览器（独立 Playwright CLI 会话，无测试桩）核验：校园站其他标题存在；公开 API 200、CORS *、47 条档案，其中其他 19、官网关联 21，Chrome fetch 实测约 2010ms。服务器核对官网基线 hash/标题/摘要 21/21 一致。官网原始 URL /wiki.html 显示 ready=true、47 条、最新词条状态及只读界面；关键词“校训”只返回 1 条，详情正确渲染正文，修改按钮实际跳转校园站 /wiki。390px 词条与历史页无横向溢出。
- 线上学院历史页保留 v3/v2/v1，选择最旧版本后显示 v1 → v3 差异。其他类别 /wiki/article/motto 的编辑入口对游客实际跳转 /login 并显示中文登录提示。最后浏览器控制台 0 错误/0 警告。未登录真实 Creator 创建/保存/恢复生产内容；这些写入与冲突/回滚语义由本地 124 项 PostgreSQL 检查覆盖，不能将其表述为真实账号生产保存回流测试。
- 证据位于 D:/esorakodo/tmp/wiki-production-{campus-desktop,official-desktop,official-detail-desktop,official-mobile,history-mobile}.png，已查看官网桌面与手机实际截图。最初详情检查读到异步占位，已改为等待校训标题和 section 完整渲染后复验通过；Playwright API 客户端一次收齐 body 超时、历史页一次连接关闭，Chrome 页内真实 fetch 与后续历史页交互重试通过。过严 label 定位改用实际版本 select 后成功；这些属于验收工具/网络过程，没有新增产品代码变更。

Windows/Linux 构建、lint/typecheck、124 项隔离数据库检查沿用本批已通过证据；本次批准后的交付没有修改功能代码。官网和校园站均已上线，无待部署步骤。后续校园站编辑在官网下次刷新时读取；官网原文有新稿时，仍按 shared-wiki 设计中的导出、审阅、事务同步、发布顺序处理。


## 2026-10-15 · 校园组件动效

使用显式 data-motion 标记、IntersectionObserver 和原生 Web Animations API；根布局无 DOM 客户端增强支持流式与客户端路由，CSS 管理悬停与 dialog 动效；不增加依赖或改变数据契约。 设计契约见 [campus-motion](../design/campus-motion.md)。


## 2026-10-15 · 官网视觉主题

根布局增加 campus-theme 作用域和独立 CSS；官网 8/18/28px 几何尺度、浅天蓝/纸白/深海蓝配色映射到公共组件及现有领域令牌；不新增客户端逻辑、依赖、数据库迁移或图片。 详见 [official-campus-theme](../design/official-campus-theme.md)。


## 2026-10-17 · 自然式论坛创作（本地完成，未上线）

需求 KTU-FORUM-NATURAL：首帖优先、成品样式内创作；点击消息弹出回复/编辑/删除/反应数/设为楼主/向上插楼/身份选择。回复追加末尾并直接引用；默认生成可修改昵称与头像；首楼禁止删除或向上插入；底部常驻发言输入。沿用原子草稿保存、权限与发布冻结，无 schema 变更。设计见 [自然式创作](../design/forum-natural-authoring.md)。基线 deploy/backend=27b2e1b，初始工作树干净；本批改动保留在未提交工作区，未推送、未部署。验收使用实际组件配隔离 action/media 桩，见 engineering/verification.md（本目录使用 verification.md）。


## 2026-10-17 · 发布后改写与实时协作（本地完成，未上线）

用户已确认：范围先落实当前论坛体；已发布作品可重新编辑，有效改动及时同步公开阅读页；作者按创作者@账号增删协作者，协作者可共同编辑，作者保留首次发布与成员管理权限。前端明确使用 frontend-design skill，保留自然回帖，新增轻量在线成员/正在编辑位置/同步状态及作者管理面板。实现采用 Yjs 文本/结构合并、认证HTTP增量写入和SSE通知，编辑状态与公开关系表分开。本批重新执行迁移、权限、并发、撤权与浏览器验收，实际证据见 engineering/verification.md。

实现、教程与本地验收已完成；未提交、未推送、未上线。新契约取代前一节发布冻结和手动保存说明。详见 [forum-collaboration](../design/forum-collaboration.md) 与 verification.md。Yjs 合并通过认证 HTTP+SSE；仅作者首次发布/管理成员，协作者有效改写直接公开。新增迁移文件为 202610170001_forum_collaboration.sql（迁移总数18），新增 yjs 依赖。


## 2026-10-17 · 论坛自然创作与实时协作已上线

用户明确授权上线及2个临时Auth账号的创建/验收后清理。功能源码2db0eda已推送deploy/backend；运行包8175c71e425281322d1227040cd056b6269d0741已推送deploy/runtime，并通过既有update-runtime.sh上线。追加迁移202610170001和202610170002均已云端事务演练/正式应用，云迁移总数19。旧runtime ab0f844保留回滚，Nginx和其他网站未改动。

真实HTTPS双账号14项、匿名公开页5项均通过：首帖/默认身份、按Creator handle邀请、作者首次发布、发布后重返编辑、同楼并发合并、已打开匿名阅读页自动更新、新回复、390px布局、移除后立即锁定与403、匿名私有状态401、刷新后改写保留。并发SQLSTATE修复后量测两次提交2079/2777ms、双方3932ms收敛。首次40001超时和验收工具HTTP直连超时均保留证据；后者改用浏览器fetch后通过。首轮401/403是刻意权限检查，未描述全会话零错误。

生产验收临时帖子/楼层/论坛身份/共享文档及2个Auth账号已删除；最终临时Auth/Profiles/Topics/Accounts计数均0，服务器和本地临时凭据文件已删除、本机凭据夹具服务已停止。原32张表在迁移事务中指纹不变；验收后29张整表仍一致，3张论坛表存在期间新增的非临时账号内容，按审计前created_at核对原有行数量/指纹均与发布前一致，未删除这些新增正式内容。

运行包实际Git发布清单6872文件/67931094字节，服务器逐个SHA256一致、0额外文件；本地供应包另有lib0/.claude/settings.local.json被Git忽略，未发布，验证清单已按实际Git内容生成。Linux五阶段编译完成；Windows挂载I/O拖慢重复Linux lint及依赖复制，停止重复静态检查（同源Windows lint/typecheck通过），用Windows文件接口完整复制Linux依赖124包；Linux本地磁盘启动/媒体同源/中文回调冒烟通过。第一次挂载盘冷启动30秒阈值超时，改为Linux本地临时磁盘后通过。该批不重新构建JS的SQLSTATE追加修复经32项数据库（含P0001断言）、124项既有数据库回归通过；最终lint通过。运行包未包含环境文件、凭据或本地测试数据。

截图D:/esorakodo/tmp/forum-collaboration-production-mobile.png已目视复核，生产教程五张新图全部decode成功；公网/forum、/wiki及匿名创作跳转通过。本轮没有真实R2图片上传或邮件注册测试，不能将既有媒体/邮件部署证据当作本轮新验收。此前本地“未上线”说明均为阶段历史，当前无待部署或测试清理步骤。

## 2026-10-17 · 角色创建实现

/create/character 服务端并行读取学院、能力示例和登录状态；非必要资料读取设置6秒取消信号，失败保留自由创作。前端以五个问题屏幕和档案留影预览组成，短纸页转场、能力轮播可暂停，支持减少动效。捏脸使用 public/character-maker 的原工具副本（63份 PNG 保留原字节），独立 localStorage、禁用打印网络、严格同源及窗口校验；大素材仅打开捏脸时加载。首页缩略图约10KB。校园卡1016×638，保留原底图，只绘入姓名/学号与照片。上传照片居中裁为720×960，限定 PNG/JPEG/WebP、10MB、4000万像素；服务端沿用已有媒体所有权、ready、文件大小与魔数验证。

新 student_character_cards 显式关联 Student、Creator、portrait/card 媒体，记录外观与幂等请求UUID。create_student_character 认证后以事务级锁串行同一创建请求，校验所有者媒体及学院，调用 create_wiki_entity_with_body 产生 Student 和初始 Revision，再写关联，同事务提交。公开仅可读已关联 ready 媒体；客户端无表写权限。卡片是创建时的留档，之后 Wiki 名称/学院修订以正文为准，不悄悄改动历史卡片。相关类型、源文件及迁移均在同批 Git 中。

## 2026-10-17 · 首页官网风格与聚焦入口

已读取 https://kongtian.university/ 实际首屏，并核对官方 main.css/orbital.css。首页使用同色板、宋体校名、浅天空留白及官网原始群像/校徽副本（字节一致，官网只读）。CampusHero改为纯Server Component，首页不再读取资讯feed或挂载轮播客户端。独立home-welcome.css以专用选择器限定首页；SiteHeader新增compact变体，仅在首页显示中文品牌、五栏目、检索与登录/创作中心，其他页面保持默认导航。手机人物图contain以保全五人，两个入口390px并排、320px竖排。只保留静态页脚官网和指南导航。

创建入口分别直达/create/character及/create/forum；后者现有匿名保护增加next=/create/forum，登录动作沿用已有安全返回路径验证，无权限变化。修改既有SSR首页断言以覆盖新入口和去除旧标签，不新增镜像式单元测试。
