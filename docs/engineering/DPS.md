# KTU 平台开发计划 DPS

## 状态约定

- `已验证`：实现完成且验收证据已记录。
- `已实现待验证`：代码存在，但缺真实服务、数据库或浏览器证据。
- `进行中`：当前阶段正在修改。
- `待做`：依赖满足后可开始。
- `阻塞`：缺少明确决策、凭据或外部状态，必须写明恢复条件。

任务按依赖顺序执行。开始任务时更新本表，完成后把命令、环境和结果写入 `verification.md`，再决定是否标记为已验证。

## P0 计划与治理

| 任务 ID | 需求 ID | 文件或符号 | 实现意图 | 依赖 | 验收 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| KTU-P000 | KTU-OPS-001 | `docs/ROADMAP.md`（新建） | 建立 M0–M7 唯一路线图入口 | 产品基线、现有代码 | 里程碑、门禁、决策点和文档职责清楚 | 已验证 |
| KTU-P001 | KTU-OPS-001 | `docs/engineering/RAS.md`（新建） | 为跨阶段需求分配稳定 ID 与验收 | KTU-P000 | 所有里程碑至少关联一个可观察需求 | 已验证 |
| KTU-P002 | KTU-OPS-001 | `docs/engineering/RDS.md`（新建） | 记录模块所有权、契约、状态和围栏 | KTU-P001 | 设计能追踪到当前源码与未来文件 | 已验证 |
| KTU-P003 | KTU-OPS-001 | `docs/engineering/DPS.md`（新建） | 把路线图拆成依赖任务 | KTU-P002 | 每项含需求、位置、依赖与验收 | 已验证 |
| KTU-P004 | KTU-UX-002 | `AGENTS.md`、`docs/engineering/RDS.md` | 固化 frontend-design skill 和 UI 质量门 | 用户要求 | 新 UI 流程包含设计、批评、响应式和截图检查 | 已验证 |

## M0 工程骨架

| 任务 ID | 需求 ID | 文件或符号 | 实现意图 | 依赖 | 验收 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| KTU-M000 | KTU-FND-001 | `app/`、`src/`、构建配置 | 建立 App Router、TypeScript strict、Sites/Vinext 工程 | 无 | lint、typecheck、build 和公共路由渲染通过 | 已验证 |
| KTU-M001 | KTU-FND-002 | `supabase/config.toml`、首批 migration | 建立本地 Supabase 与可复现 schema | KTU-M000 | migration、RLS、grants 和索引进入 Git | 已实现待验证 |
| KTU-M002 | KTU-UX-002 | `app/globals.css`、Layout、首页 | 建立可替换的功能阶段视觉基线 | KTU-M000 | 桌面和移动骨架可用，视觉令牌与领域解耦 | 已验证 |

## M1 账户收尾

| 任务 ID | 需求 ID | 文件或符号 | 实现意图 | 依赖 | 验收 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| KTU-M100 | KTU-AUTH-001, KTU-FND-002 | 本地 Supabase 或独立 dev project、`.env.local` | 建立隔离开发环境和 Auth URL | M0 | 本地配置存在但不进入 Git；回调 URL 正确 | 已验证：本地 DB、Auth、REST、Kong 与 `.env.local` 可用；独立开发项目未配置 |
| KTU-M101 | KTU-FND-002 | `supabase/migrations/202608190001_m0_m1_core.sql` 及后续 migration | 将现有 migration 应用到空开发库 | KTU-M100 | 本地 `supabase db start` 或开发库 `supabase db push` 成功；库结构与 Git 一致 | 已验证：三条 migration 已应用于隔离本地库 |
| KTU-M102 | KTU-FND-001 | `src/types/database.ts` | 用实际 schema 生成完整数据库类型 | KTU-M101 | profiles、colleges、places、students、forum_accounts、wiki_revisions 均有类型 | 已验证：本地 schema 生成，TypeScript 检查通过 |
| KTU-M103 | KTU-AUTH-001, KTU-AUTH-002 | `supabase/tests/database/m1_auth.test.sql` | 测试 Profile trigger、唯一 handle 与基础 RLS | KTU-M101 | 正反权限用例在干净测试库通过 | 已验证：12/12 pgTAP 通过；真实 Auth 邮箱流程属 KTU-M104 |
| KTU-M104 | KTU-AUTH-001, KTU-AUTH-003 | `tests/local-api.test.mjs`、浏览器 Auth 验收 | 验证注册、确认、登录、退出、受保护页面 | KTU-M100, KTU-M103 | 真实会话通过；第二用户和未登录路径被拒绝 | 进行中：本地双用户注册/登录和浏览器注册/退出、未登录重定向已验；邮件确认与第二用户浏览器路径待验 |
| KTU-M105 | KTU-OPS-001 | `README.md`、`verification.md` | 记录开发库初始化与 Auth 验收 | KTU-M104 | 新开发者可重复步骤，未泄露凭据 | 进行中：本地启动、pgTAP、API 测试步骤与边界已记录；邮件确认步骤待验 |

## M2 Wiki 基础

| 任务 ID | 需求 ID | 文件或符号 | 实现意图 | 依赖 | 验收 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| KTU-M200 | KTU-WIKI-001 | `docs/design/wiki-foundation.md`（新建） | 调用 frontend-design skill 定义 Wiki 任务、令牌、线框和状态 | M1 | 通过非模板化批评；含桌面/移动与可访问性计划 | 已验证 |
| KTU-M201 | KTU-WIKI-001, KTU-WIKI-004 | 产品决策记录、Wiki 字段契约 | 确认可编辑字段和乐观锁策略 | M1 | 字段、来源、冲突文案与版本规则明确 | 已验证 |
| KTU-M202 | KTU-WIKI-002, KTU-WIKI-004 | Wiki RPC migration 与 Grants hardening migration | 原子更新实体并写 Revision，禁止无历史覆盖 | KTU-M201 | 成功/冲突/越权/回滚 SQL 测试通过 | 已验证：本地迁移与 19/19 Wiki pgTAP 通过 |
| KTU-M203 | KTU-WIKI-001 | `src/features/wiki/schemas.ts`、`queries.ts`、`actions.ts`（新建） | 建立服务端校验、读取与写入边界 | KTU-M202 | 无客户端直接 update；错误映射稳定 | 本地三类实体创建/编辑/回滚与冲突提示均已浏览器验证 |
| KTU-M204 | KTU-LINK-001 | `src/components/entity-link/`（新建） | 统一实体类型、URL 和可访问链接 | KTU-M201 | 所有支持类型正确解析；未知类型安全失败 | 已实现待验证：跨媒介接入留待后续里程碑 |
| KTU-M205 | KTU-WIKI-001 | `app/(public)/wiki/**`、`app/create/wiki/**`（新建） | 实现目录、详情、创建与编辑页面 | KTU-M200, KTU-M203, KTU-M204 | 可创建三类实体并从目录进入详情 | 已验证：Student、College、Place 本地浏览器页面与关联关系 |
| KTU-M206 | KTU-WIKI-003 | Revision 历史与回滚 action/page | 实现历史查看和回滚 | KTU-M202, KTU-M205 | 回滚产生新 Revision，历史不被删除 | 已验证：Student 浏览器回滚生成 REV 003，REV 001/002 历史保留；SQL 用例覆盖三类实体 |
| KTU-M207 | KTU-WIKI-001..004 | `supabase/tests/database/m2_wiki.test.sql`、应用测试 | 覆盖原子性、RLS、冲突、回滚和页面状态 | KTU-M206 | 双用户权限、陈旧版本和失败路径通过 | 本地 19/19 pgTAP、双用户 API、三类浏览器回滚及两标签陈旧冲突已验；线上待验 |
| KTU-M208 | KTU-UX-002 | 浏览器截图与键盘检查 | 验证 Wiki 桌面/移动、焦点和空错载状态 | KTU-M205 | 关键页面无溢出；操作名称和结果文案一致 | 已验证：375px Place 详情/编辑/4 条 Revision 历史无横向溢出 |

## Living Campus v2 前端轨道（首批已实施）

以下任务按 `docs/design/living-campus-v2.md` 顺序推进；现有首页仍是 `homepage-concept-v1.md`。前端文件工作可与 M3 数据库工作并行，领域和类型契约在集成时统一核对。

| 任务 ID | 需求 ID | 文件或符号 | 实现意图 | 依赖 | 验收 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| KTU-UXV2-01 | KTU-UX-001..002 | `app/globals.css`、`src/components/layout/` | 更新候选令牌、收紧页头并保留五类主导航 | v2 设计指导 | 桌面/移动路由、焦点和登录入口不退化 | 首批已验：五类导航、登录/Creator、移动页头；完整令牌迁移待后续 |
| KTU-UXV2-02 | KTU-UX-001..002 | `app/page.tsx`、`src/components/home/`、`src/features/campus/` | Hero 改为文案加轻量校园预览，Trace 移出 Hero | KTU-UXV2-01 | 不依赖 Three.js；真实路由可用；演示地点清楚标注 | 已验证：概念沙盘、真实入口、桌面/移动截图 |
| KTU-UXV2-03 | KTU-UX-002 | Campus Layer、地点列表/Peek、空间绑定接口 | 提供可选空间探索模式与未来模型替换边界 | KTU-UXV2-02 | Esc、焦点返回、触屏、移动 sheet、reduced motion 和 2D 降级通过 | 首批已验：Esc、焦点返回、移动 sheet 与 2D 路由；正式 Place 绑定待后续 |
| KTU-UXV2-04 | KTU-LINK-002, KTU-UX-002 | `CampusTrace` → Relation Field | 让关系线只表达实际可读数据 | KTU-UXV2-03 | 演示与真实关系不混淆，键盘可沿关系继续探索 | 待做 |
| KTU-UXV2-05 | KTU-LINK-001..002, KTU-UX-002 | `src/components/entity-link/` | 在普通档案链接上渐进增加 Peek | KTU-UXV2-04 | 无 JS/无数据仍可跳转；鼠标、键盘、触屏和 Esc 可用 | 待做 |
| KTU-UXV2-06 | KTU-UX-001..002 | 首页 Forum/Press/Event/Wiki 模块 | 按媒介差异收敛版式，不统一卡片化 | KTU-UXV2-05；真实 M3–M5 内容逐步接入 | 不展示假发布数据或不可用创作入口 | 待做 |
| KTU-UXV2-07 | KTU-UX-002 | 浏览器和性能记录 | 验收 v2 桌面/移动、键盘、动效与首屏 | KTU-UXV2-01..06 | 指定四种视口、焦点、无溢出、SSR、lint/typecheck/build 和真实截图通过 | 待做 |

## M3 校园论坛

| 任务 ID | 需求 ID | 文件或符号 | 实现意图 | 依赖 | 验收 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| KTU-M300 | KTU-FORUM-001..005 | `docs/design/forum.md`（新建） | 调用 frontend-design skill 设计论坛浏览与创作流 | M2 | 明确戏内楼层、Creator 操作和戏外区的视觉边界 | 已实现待浏览器视觉验证 |
| KTU-M301 | KTU-FORUM-001 | `src/features/forum-accounts/`（新建） | 创建、选择和编辑 Creator 自有 Forum Account | M2 | 可关联 Student 或保持非学生身份；他人不能修改 | 本地单 Creator 浏览器创建/编辑/关联 Student 已验；他人编辑由 RLS/pgTAP 断言 |
| KTU-M302 | KTU-FORUM-002..005 | 新 migration：forum_topics/messages/hashtags/join | 建立论坛聚合、顺序、状态、索引和 RLS | M2 | 楼层顺序唯一；草稿隔离；发布公开；越权测试通过 | 已验证：本地 M3 51/51 pgTAP、全库 82/82 |
| KTU-M303 | KTU-FORUM-002, KTU-FORUM-003 | `src/features/forum/schemas.ts`、`actions.ts`、`queries.ts`（新建） | 实现草稿保存、楼层编排和事务发布 | KTU-M301, KTU-M302 | 无效账号、空 Topic、重复楼层和越权被拒绝 | 已实现待验证：类型与 Lint 通过，真实流程待验 |
| KTU-M304 | KTU-FORUM-002 | `app/create/forum/**`（新建） | 实现功能优先的 Topic 编辑器 | KTU-M300, KTU-M303 | 可增加、重排、删除楼层并预览 | 本地保存、回复、发布与预览组件已实现；增删重排浏览器专项待补 |
| KTU-M305 | KTU-FORUM-003, KTU-FORUM-005 | `app/(public)/forum/**`（扩展） | 实现列表、标签、详情和 Forum Account 页面 | KTU-M303, KTU-M304 | published 可浏览；草稿不泄露；标签过滤有效 | 本地匿名列表、标签和详情已验；草稿隔离由 pgTAP 验 |
| KTU-M306 | KTU-LINK-002 | 论坛作品与 Wiki 反向关系查询 | 从 Forum Account/Topic 回到 Student Wiki | KTU-M305 | Student Wiki 自动显示相关论坛痕迹 | 已验证：本地浏览器 Student 详情自动显示关联已发布 Topic |
| KTU-M307 | KTU-FORUM-004 | SQL、集成与浏览器双用户测试 | 证明 Topic 所有权与草稿隔离 | KTU-M305 | A 不能读/改 B 草稿或改 B published 内容 | 数据库 51/51 含跨作者/匿名/发布后冻结；双用户浏览器待补 |
| KTU-M308 | 第一阶段系统验收 | 端到端垂直切片测试 | 跑通注册到 Student Wiki 的完整链路 | KTU-M306, KTU-M307 | RAS 第一阶段 8 项全部有实际证据 | 本地单用户主链路已验；邮件确认、双用户浏览器和线上待补 |

## M4 校刊与部刊

| 任务 ID | 需求 ID | 文件或符号 | 实现意图 | 依赖 | 验收 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| KTU-M400 | KTU-PRESS-001..003 | 真实创作样例、编辑器决策记录 | 决定正文块、JSON schema/version 和 adapter | M3 | 样例可表达；不把库私有格式当永久契约 | 待做 |
| KTU-M401 | KTU-PRESS-001, KTU-UX-002 | `docs/design/press.md`（新建） | 调用 frontend-design skill 设计阅读、编辑和预览 | KTU-M400 | 长文排版、实体链接和移动阅读可用 | 待做 |
| KTU-M402 | KTU-PRESS-001..003 | 新 migration：articles/tags/article_tags/work_entity_links | 建立内容、分类、引用、RLS 与索引 | KTU-M400 | 标签上限、所有权、引用有效性测试通过 | 待做 |
| KTU-M403 | KTU-PRESS-003 | `src/features/editor/`、正文 parser/renderer（新建） | 实现版本化正文与安全渲染 | KTU-M402 | 未知/恶意节点安全失败；实体 UUID 可解析 | 待做 |
| KTU-M404 | KTU-PRESS-001 | `src/features/press/`、`app/create/article/**`（新建） | 实现草稿、预览、发布 | KTU-M401, KTU-M403 | 编辑到发布闭环通过；作者边界正确 | 待做 |
| KTU-M405 | KTU-PRESS-001..003 | `app/(public)/press/**`（扩展） | 实现列表、标签页和文章详情 | KTU-M404 | published 可读；实体跳转和反向链接正确 | 待做 |
| KTU-M406 | KTU-PRESS-001..003, KTU-UX-002 | SQL/集成/浏览器/视觉测试 | 覆盖标签、正文兼容、权限和阅读体验 | KTU-M405 | 桌面与移动长文可用，越权和损坏正文被处理 | 待做 |

## M5 事件专题

| 任务 ID | 需求 ID | 文件或符号 | 实现意图 | 依赖 | 验收 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| KTU-M500 | KTU-EVENT-001..003 | `docs/design/events.md`（新建） | 调用 frontend-design skill 设计档案、时间线和补充 | M4 | Event 与 Article/Forum 信息结构明显不同 | 待做 |
| KTU-M501 | KTU-EVENT-001..003 | 新 migration：events/timeline/supplements/links | 建立所有权、顺序、状态、实体关联和 RLS | M4 | 主档案与补充的权限矩阵 SQL 测试通过 | 待做 |
| KTU-M502 | KTU-EVENT-001, KTU-EVENT-002 | `src/features/events/`、`app/create/event/**`（新建） | 实现 Event 与 Timeline 创建维护 | KTU-M500, KTU-M501 | 单一 Creator 可维护；他人写操作被拒绝 | 待做 |
| KTU-M503 | KTU-EVENT-003 | Supplement actions/pages | 实现补充创建、节点挂靠和独立发布 | KTU-M501, KTU-M502 | 非主创可补充但不能改主档案 | 待做 |
| KTU-M504 | KTU-EVENT-001..003 | `app/(public)/events/**`（扩展） | 实现事件浏览、档案、时间线和补充详情 | KTU-M503 | 时间线顺序、实体链接和多视角清晰 | 待做 |
| KTU-M505 | KTU-LINK-002 | Event 与 Wiki/作品反向查询 | 自动汇总人物、学院、地点和作品痕迹 | KTU-M504 | 关系从两侧可导航且重命名不破坏 | 待做 |
| KTU-M506 | KTU-EVENT-001..003, KTU-UX-002 | SQL/集成/浏览器/视觉测试 | 验证状态、权限、顺序、响应式与空状态 | KTU-M505 | 双用户权限与跨实体浏览证据齐全 | 待做 |

## M6 媒体与运营

| 任务 ID | 需求 ID | 文件或符号 | 实现意图 | 依赖 | 验收 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| KTU-M600 | KTU-MOD-001 | 产品决策记录 | 确认管理员授权、举报状态和处置规则 | M5 | 角色授予/撤销与审计要求明确 | 待做 |
| KTU-M601 | KTU-MEDIA-001, KTU-UX-002 | `docs/design/media-moderation.md`（新建） | 调用 frontend-design skill 设计上传、失败与审核状态 | KTU-M600 | 上传反馈和管理操作清晰，不用颜色单独表达状态 | 待做 |
| KTU-M602 | KTU-MEDIA-002, KTU-MOD-001 | 新 migration：media_assets/reports/moderation_actions | 建立媒体元数据、举报、动作、角色和 RLS | KTU-M600 | 权限、索引、状态转换和审计测试通过 | 待做 |
| KTU-M603 | KTU-MEDIA-001 | `src/lib/r2/`、`src/features/media/`（新建） | 实现 presigned PUT、完成确认和校验 | KTU-M602 | 浏览器无 R2 密钥；类型/大小/数量限制有效 | 待做 |
| KTU-M604 | KTU-MEDIA-002 | 各作品媒体关联与上传 UI | 把 ready asset 关联到作品并排序 | KTU-M603 | 未完成/他人 asset 不能发布到作品 | 待做 |
| KTU-M605 | KTU-MOD-001 | `src/features/moderation/`、管理页面（新建） | 实现举报、隐藏、恢复和审计查看 | KTU-M601, KTU-M602 | 隐藏对公开读生效且数据可恢复 | 待做 |
| KTU-M606 | KTU-MEDIA-001..002, KTU-MOD-001 | R2/SQL/浏览器安全测试 | 验证直传、越权、失败重试和审核动作 | KTU-M605 | 真实开发 bucket 和数据库证据齐全 | 待做 |

## M7 搜索与体验收敛

| 任务 ID | 需求 ID | 文件或符号 | 实现意图 | 依赖 | 验收 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| KTU-M700 | KTU-SEARCH-001, KTU-SEARCH-002 | 查询样本与性能基线 | 用真实语料定义相关性、延迟和降级要求 | M6 | 样本覆盖中文名称、别名、标题、hashtag 和过滤 | 待做 |
| KTU-M701 | KTU-SEARCH-001..002 | 新 migration：搜索函数/索引，条件启用 PGroonga | 建立稳定查询契约与回滚方案 | KTU-M700 | 有扩展与无扩展路径均有记录和测试 | 待做 |
| KTU-M702 | KTU-SEARCH-001 | `src/features/search/`、`app/search/**`（新建） | 实现分组搜索、筛选、分页和空状态 | KTU-M701 | 同名结果有类型信息，查询可取消且失败可恢复 | 待做 |
| KTU-M703 | KTU-LINK-002 | 关系推荐查询与 Campus Trace | 基于显式实体关系提供继续探索 | KTU-M701 | 推荐来源可解释，不泄露草稿/隐藏内容 | 待做 |
| KTU-M704 | KTU-UX-001, KTU-UX-002 | `docs/design/final-system.md`（新建） | 调用 frontend-design skill 收敛全站视觉系统 | KTU-M702 | 媒介差异、字体、令牌、组件和文案规范统一 | 待做 |
| KTU-M705 | KTU-UX-001 | 首页查询与策展配置 | 将静态示例替换为可控真实内容 | KTU-M703, KTU-M704 | 空库有明确引导；策展失败可降级 | 待做 |
| KTU-M706 | KTU-UX-002, KTU-OPS-001 | 浏览器、性能、无障碍与视觉回归 | 完成桌面/移动核心路径验收 | KTU-M705 | 无严重可访问性问题；性能预算和截图证据记录 | 待做 |
| KTU-M707 | 全部 | README、ROADMAP、verification、发布说明 | 完成上线前文档与恢复演练 | KTU-M706 | 新环境可部署；所有未验证外部边界明确 | 待做 |

## 每批改动的完成定义

1. 任务 ID 与对应需求在提交说明或变更说明中可见。
2. 代码、migration、类型、测试和文档在同一职责边界内同步更新。
3. `git diff --check`、lint、typecheck、build 通过；相关测试按风险执行。
4. 数据库、浏览器或外部服务未实际验证时，状态只能是“已实现待验证”。
5. 新 UI 已按 `frontend-design` skill 完成设计和自我批评，并检查桌面、移动、键盘、空错载状态。
6. `progress.md` 记录当前提交、证据、阻塞和下一任务。

## 2026-09-23 · KTU-UX-CAMPUS-VIEW

- 需求：首页质感优化、最新内容卡片堆、大学官网口吻。
- 完成：服务端有限查询、客户端轮播、纸张层次、桌面／移动布局、栏目文案和元数据、既有 SSR 测试断言更新。
- 状态：本地实现与构建／回归通过；不包含部署或新增发布业务。当前无真实内容环境下的导览状态已浏览器验收，真实数据排序与部分失败分支已代码核对，尚未用联网数据集做端到端验收。

## 全平台实现任务（2026-09-23）

| ID | 需求 | 所有者/范围 | 验收 | 状态 |
| --- | --- | --- | --- | --- |
| KTU-M4-FULL | PRESS/LINK | content_database+press | SQL权限、原子保存、发布及UI | 进行中 |
| KTU-M5-FULL | EVENT/LINK | content_database+events | 单维护者、补充归属、节点稳定与UI | 进行中 |
| KTU-M6-FULL | MEDIA/MOD | 主线 | 私有媒体权限、举报、隐藏审计 | 进行中 |
| KTU-M7-FULL | SEARCH/UX/AUTH | 主线 | 真实首页、反链、Creator、搜索与全站验收 | 进行中 |

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

2026-09-29：团队测试开放：移除本站Basic Auth；注册开启，邮件确认保留；上传Origin修复已部署；runtime Git交付准备。

## 2026-09-29 · 邮件内置浏览器回调提示

邮箱内置浏览器可能缺少注册浏览器保存的 PKCE verifier。回调仍严格执行 exchangeCodeForSession，不绕过 PKCE、不假定邮箱已确认；SDK pkce_code_verifier_not_found 或 AuthPKCECodeVerifierMissingError 转为中文普通提示，建议用注册邮箱和密码登录。其余回调失败及缺失 code 显示固定中文说明，不透传服务英文或错误细节。

app/auth/callback/route.ts 调用 callback-notice.mjs；auth-callback-notice.test.mjs 使用真实 SDK 错误类、独立 code/name 和普通/空错误验证提示映射，3/3 通过。本次不修改邮件模板，模板由主线单独整合。当前工作区待合并提交；完整构建/线上验收状态由后续记录更新。


## 2026-09-29 · 论坛树状创作与 Markdown 档案

用户确认：论坛 👍 / ？仅为创作者设置的剧情数据，读者端展示；修订采用线性历史、两版差异、恢复新版本，不做分支合并。补充确认所有论坛身份（包括学生类型）均可不关联人物档案创建。详情见 docs/design/forum-wiki-reading.md。

实现：阅读/编辑共用 ThreadTree，保留楼层编号、父节点链接、分支折叠、原位添加回复、上下移动、计数输入和阅读预览。档案在摘要外新增 50000 字 Markdown 正文，GFM 安全渲染与格式工具栏，历史显示版本、作者、提交说明、快照、行差异；超长差异有时间上限并退化为整段增删。追加迁移 202609290001，旧数据计数默认 0、旧快照缺 body 恢复为空；解除 student_accounts_require_student，FK、所有权和 RLS 保留。

验证完成：最终 lint、typecheck、Windows build 与 Linux 五阶段 build 全部通过。隔离 PostgreSQL 17 原样执行全部 14 个迁移，38 项域表/RPC/RLS 检查通过；Auth 请求声明使用测试函数复现，不等同完整 Supabase Auth/API 验收。浏览器组件覆盖创作交互、序列化、安全 Markdown 和修订恢复表单；action 边界为桩，保存事务另由 SQL 覆盖。云端迁移、推送、SSH 发布和线上真实内容读取验证均完成；没有创建线上测试作品，未声称真实登录发布端到端验收。

交付完成：deploy/backend 源码、deploy/runtime Linux standalone，服务器通过 /etc/ktu-community/update-runtime.sh 浅 fetch/archive 并切换 current，仅重启 ktu-community。功能源码为 72210ce853c6f81abf74e91e32da1c073d653b3c，线上产物为 94bd025a50f2ce48e1e1c5e24a3977cd52b6669a；后续提交仅同步交付文档。追加迁移 202609290001 已应用，六张受影响表原字段数量/指纹事务内一致。原运行版本 116d827 保留用于回滚。测试工具/数据库/截图在 Git 忽略的 output；没有导出云端业务数据。


### 2026-09-29 验证与迁移进展

最新 lint、typecheck、Windows build 全部通过。临时 PostgreSQL17 的 38 项检查通过，覆盖全部 14 个迁移、独立学生论坛身份、计数边界/原子回滚/越权/发布冻结、三类 Markdown 档案创建/修改/冲突/恢复，以及无 body 的旧快照。可复现命令：npm install --prefix output/pg-check embedded-postgres@17.10.0-beta.17；node tests/forum-wiki-database.mjs。

云端 202609290001 已通过管理 API 在事务中应用，5 个新列、身份可独立创建、匿名新 RPC 禁止执行、迁移记录均读回核验。事务内部比较受影响六张表迁移前后数量和既有字段 MD5，完全一致。完整业务数据导出被自动审批拒绝，已取消导出；仅使用服务端内部指纹比较，没有把云端业务内容下载到本机。旧运行版本仍兼容追加 schema。最终 Linux 产物已通过 SSH 发布，详见本页交付记录。

浏览器真实组件验收已覆盖折叠、新增子回复、两种计数、保存输入序列化、阅读预览、删除父节点提示、GFM 表格/粗斜体/列表、危险 URL/HTML 禁用、版本选择/恢复表单和 390px 页面无溢出。截图位于 output/playwright/forum-wiki-{desktop,mobile}.png。此处 action 边界使用隔离桩，SQL 权限事务验证与浏览器 UI 验证分别记录，不宣称真实用户线上创建/发布已全程验收。

## 2026-10-01 · 创作者站内教程

新增公开 /guide 操作手册：身份概念、论坛编排、Markdown 档案、修订恢复、校刊、事件和常见问题。练习区可切换回复关系、设置示例计数和练习 Markdown，完全在页面内运行，不保存或发布。创作中心与页脚提供总入口，各编辑器提供新标签页定位到对应章节的链接，保留当前输入。使用当前真实字段/按钮说明，明确无自动保存、论坛冻结与 Wiki 直接公开。设计见 docs/design/creator-guide.md。

当前状态：图解教程已上线。lint/typecheck、Windows/Linux build、浏览器桌面/手机验收和线上入口/图片/练习验证通过。功能源码 ba365ef，运行产物 1f4d089；已推送并通过 SSH 更新。无 schema/权限变更，部署证据见 engineering/progress.md 与 engineering/verification.md。
### 图解教程补充

用户进一步要求原界面截图与文案一一对应。/guide 现以 10 张原页面/编辑组件截图为主体，34 个编号框选对应 34 项说明；图片使用演示数据，可打开原图。截图位于 public/guide，来自现有表单 DOM/CSS 的实际浏览器渲染，未读取私人草稿或生成虚构界面。交互练习收进展开区域，保留目录和新标签页帮助入口。先前纯文字草案已调整，图解布局和最终构建均已验证。数据/权限没有变化，无新增迁移。

## 2026-10-01 创作 Markdown 导入（进行中）

论坛、校刊/部刊和事件草稿新增版本化 Markdown 导入、UTF-8 文件/粘贴入口、替换确认、严格领域校验与下载模板。论坛由服务器复核并复用本人身份，缺失身份通过单次批量 INSERT 创建；无迁移。事件公开后不整体替换节点。见 `docs/design/markdown-import.md`；图解教程新增格式与 AI 提示词。本地实现完成：lint、typecheck、Windows build 通过；26 项解析器回归、41 项真实 PostgreSQL 17 检查通过（含批量身份创建、冲突整批回滚、归属防伪）。浏览器真实组件校验三种文件导入、错误时保留内容、回复映射与节点数；390px 手机及教程无横向溢出。界面使用演示数据与替代保存边界，未对生产写入测试作品。Linux 产物构建与上线核对进行中。
