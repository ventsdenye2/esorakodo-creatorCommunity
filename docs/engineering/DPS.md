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
| KTU-M203 | KTU-WIKI-001 | `src/features/wiki/schemas.ts`、`queries.ts`、`actions.ts`（新建） | 建立服务端校验、读取与写入边界 | KTU-M202 | 无客户端直接 update；错误映射稳定 | 进行中：Student 创建、编辑、回滚的 Server Action 已经真实浏览器验证；其他实体与错误页面待验 |
| KTU-M204 | KTU-LINK-001 | `src/components/entity-link/`（新建） | 统一实体类型、URL 和可访问链接 | KTU-M201 | 所有支持类型正确解析；未知类型安全失败 | 已实现待验证：跨媒介接入留待后续里程碑 |
| KTU-M205 | KTU-WIKI-001 | `app/(public)/wiki/**`、`app/create/wiki/**`（新建） | 实现目录、详情、创建与编辑页面 | KTU-M200, KTU-M203, KTU-M204 | 可创建三类实体并从目录进入详情 | 进行中：Student 创建、详情、编辑已在浏览器验证；College/Place 页面待验 |
| KTU-M206 | KTU-WIKI-003 | Revision 历史与回滚 action/page | 实现历史查看和回滚 | KTU-M202, KTU-M205 | 回滚产生新 Revision，历史不被删除 | 已验证：Student 浏览器回滚生成 REV 003，REV 001/002 历史保留；SQL 用例覆盖三类实体 |
| KTU-M207 | KTU-WIKI-001..004 | `supabase/tests/database/m2_wiki.test.sql`、应用测试 | 覆盖原子性、RLS、冲突、回滚和页面状态 | KTU-M206 | 双用户权限、陈旧版本和失败路径通过 | 进行中：19/19 pgTAP、真实 API 双用户/陈旧冲突和 Student 浏览器主路径通过；浏览器失败反馈待验 |
| KTU-M208 | KTU-UX-002 | 浏览器截图与键盘检查 | 验证 Wiki 桌面/移动、焦点和空错载状态 | KTU-M205 | 关键页面无溢出；操作名称和结果文案一致 | 进行中：空库桌面/移动、Student 桌面主路径已验；移动端有数据页待验 |

## M3 校园论坛

| 任务 ID | 需求 ID | 文件或符号 | 实现意图 | 依赖 | 验收 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| KTU-M300 | KTU-FORUM-001..005 | `docs/design/forum.md`（新建） | 调用 frontend-design skill 设计论坛浏览与创作流 | M2 | 明确戏内楼层、Creator 操作和戏外区的视觉边界 | 待做 |
| KTU-M301 | KTU-FORUM-001 | `src/features/forum-accounts/`（新建） | 创建、选择和编辑 Creator 自有 Forum Account | M2 | 可关联 Student 或保持非学生身份；他人不能修改 | 待做 |
| KTU-M302 | KTU-FORUM-002..005 | 新 migration：forum_topics/messages/hashtags/join | 建立论坛聚合、顺序、状态、索引和 RLS | M2 | 楼层顺序唯一；草稿隔离；发布公开；越权测试通过 | 待做 |
| KTU-M303 | KTU-FORUM-002, KTU-FORUM-003 | `src/features/forum/schemas.ts`、`actions.ts`、`queries.ts`（新建） | 实现草稿保存、楼层编排和事务发布 | KTU-M301, KTU-M302 | 无效账号、空 Topic、重复楼层和越权被拒绝 | 待做 |
| KTU-M304 | KTU-FORUM-002 | `app/create/forum/**`（新建） | 实现功能优先的 Topic 编辑器 | KTU-M300, KTU-M303 | 可增加、重排、删除楼层并预览 | 待做 |
| KTU-M305 | KTU-FORUM-003, KTU-FORUM-005 | `app/(public)/forum/**`（扩展） | 实现列表、标签、详情和 Forum Account 页面 | KTU-M303, KTU-M304 | published 可浏览；草稿不泄露；标签过滤有效 | 待做 |
| KTU-M306 | KTU-LINK-002 | 论坛作品与 Wiki 反向关系查询 | 从 Forum Account/Topic 回到 Student Wiki | KTU-M305 | Student Wiki 自动显示相关论坛痕迹 | 待做 |
| KTU-M307 | KTU-FORUM-004 | SQL、集成与浏览器双用户测试 | 证明 Topic 所有权与草稿隔离 | KTU-M305 | A 不能读/改 B 草稿或改 B published 内容 | 待做 |
| KTU-M308 | 第一阶段系统验收 | 端到端垂直切片测试 | 跑通注册到 Student Wiki 的完整链路 | KTU-M306, KTU-M307 | RAS 第一阶段 8 项全部有实际证据 | 待做 |

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
