# KTU 平台验收证据

## 2026-09-21 工程路线图批次

本批只修改工程治理与路线图文档，没有改变运行时代码、数据库 schema 或外部服务状态。

| 验收项 | 方法或命令 | 实际结果 | 证据 | 未验证边界 |
| --- | --- | --- | --- | --- |
| 路线图覆盖 M0–M7 | 人工对照产品基线、现有 M0/M1 计划和源码地图 | 通过 | `docs/ROADMAP.md` 含里程碑、依赖、质量门和决策门 | 未来产品决策仍需在对应里程碑确认 |
| 需求可追踪 | 检查 RAS ID 与 DPS 引用 | 通过 | RAS 覆盖基础、Auth、Wiki、Link、Forum、Press、Event、Media、Moderation、Search、UX、Ops | 尚未建立自动 traceability 检查脚本 |
| 设计边界明确 | 检查当前模块证据、目标所有权、数据状态与修改围栏 | 通过 | `docs/engineering/RDS.md` | 真实 Supabase/R2 行为未在本批验证 |
| 任务可执行 | 检查每个 DPS 项的需求、位置、依赖、意图、验收和状态 | 通过 | `docs/engineering/DPS.md` | 文件路径为计划目标，开始实现时需再次核对源码 |
| 前端设计门禁 | 对照 `frontend-design` skill 检查主题、受众、任务、令牌、字体、布局、记忆点、自我批评和 QA | 通过 | RDS 前端设计章节；`AGENTS.md` 长期约束 | 本批没有新增页面，因此没有新的运行时截图 |
| Markdown 与 Git 空白错误 | `git diff --check` | 通过 | 命令退出码 0 | Git 提示 Windows 将来可能转换 LF/CRLF，不是内容错误 |
| Lint | `npm run lint` | 通过 | ESLint 退出码 0 | 仅静态检查 |
| TypeScript | `npm run typecheck` | 通过 | `tsc --noEmit` 退出码 0 | 不证明外部服务行为 |
| 生产构建 | `npm run build` | 通过 | Vinext 五阶段构建完成，路由输出成功 | 首次沙箱运行因 `spawn EPERM` 失败；在获准的沙箱外环境重跑通过 |
| 现有渲染测试 | `npm test` | 通过 | 3/3：主页、四个公共媒介入口、Auth 骨架与密钥防泄漏 | 未连接真实 Supabase，未覆盖数据库与真实 Auth |

## 修改边界检查

- 未修改应用运行时代码和现有 migration。
- 未创建或写入 `.env.local`，未接触生产/开发 Supabase 或 R2。
- 未改变 Creator、Student、Forum Account、三种创作媒介或 Event 所有权规则。
- 已把用户要求的 frontend-design skill 使用方式写入长期项目约束，但保留当前视觉可替换。

## 未验证与恢复条件

- M1 的 Profile trigger、RLS、邮箱确认和服务端会话仍需要独立 Supabase 开发项目。
- 提供开发项目 URL、public anon key 与 project ref 后，从 DPS 的 KTU-M100 继续。
- 任何数据库相关任务在真实/本地 Supabase 测试通过前只能标记为“已实现待验证”。

## 2026-09-22 Campus Trace 与 M2 Wiki 批次

| 验收项 | 方法或命令 | 实际结果 | 证据 | 未验证边界 |
| --- | --- | --- | --- | --- |
| Campus Trace 语义与内容 | Playwright snapshot；点击“人物”；焦点标签按 ArrowRight | 通过 | 人物显示 `林若岚 / PER-00427 / 02`，键盘切换后机构显示 `玄学院 / ORG-0003 / 03` | 静态示例尚未连接真实实体查询 |
| Campus Trace 减弱动效 | Playwright `emulateMedia({ reducedMotion: 'reduce' })` 与 computed style | 通过 | 查询命中；轨道与面板 `animationDuration` 均为 `1e-05s` | 未覆盖不同浏览器引擎 |
| Wiki 未配置/空状态 | Playwright `1440x900` 与 `375x812`；`npm test` | 通过 | 目录显示开发库提示和空状态；创建页按钮 disabled；移动页面 `scrollWidth=innerWidth=375` | 真实数据详情/编辑/历史页待开发库 |
| 浏览器控制台 | Playwright `console error` | 通过 | Wiki 桌面页 0 error、0 warning | 仅覆盖本批访问页面 |
| Wiki 写入边界源码契约 | migration 人工审查与 Node 契约测试 | 通过 | 直接写 grant 被撤销；RPC public/anon execute 被撤销；expected version 与非空 patch 检查存在 | 未证明 SQL 可执行、RLS 或事务行为 |
| Lint | `npm run lint` | 通过 | ESLint 退出码 0 | 仅静态检查 |
| TypeScript | `npm run typecheck` | 通过 | `tsc --noEmit` 退出码 0 | 不证明数据库返回值与手工类型完全一致 |
| 生产构建与回归测试 | `npm test` | 通过 | Vinext 五阶段构建完成；5/5 测试成功 | Vinext 提示部分路由静态分类未知，不影响构建 |
| Git 空白错误 | `git diff --check` | 通过 | 退出码 0 | LF/CRLF 提示不是内容错误 |

### 修改边界检查

- Creator、Student 与 Forum Account 仍是分离概念。
- Student、College 与 Place 保持显式表，没有引入万能 JSON 实体表。
- Wiki 所有写入通过服务端 Action 调用 RPC；浏览器组件没有直接更新数据库。
- 创建、编辑和回滚都要求生成 Revision；历史记录没有删除路径。
- 当前 Wiki 与首页 CSS 使用现有语义令牌，未让领域逻辑依赖临时视觉实现。
- 未写入 `.env.local`，未接触任何生产或开发 Supabase/R2 凭据。

### 截图证据

- 仓库外桌面截图：`D:/esorakodo/site build/ktu-wiki-desktop.png`
- 仓库外移动截图：`D:/esorakodo/site build/ktu-wiki-create-mobile.png`

### 恢复条件

- 提供独立 Supabase 开发项目 URL、public anon key 与 project ref 后，应用 migration 并建立 `supabase/tests/wiki*`。
- 数据库层至少验证：无 Profile 拒绝、三类创建、字段白名单、陈旧版本冲突、Revision 原子性、回滚产生新 Revision、anon/跨用户越权拒绝。

## 2026-09-23 本地数据库验收

| 验收项 | 方法或命令 | 实际结果 | 未验证边界 |
| --- | --- | --- | --- |
| 首次 pgTAP | `npx supabase test db --local` | M1 7/8、M2 18/18；匿名 Profile UPDATE 未抛权限错误 | 揭示 Supabase 默认 Grants 与预期不一致 |
| Grants 修复 | 应用 `202609230001_m2_grants_hardening.sql`；查询本地 `has_table_privilege` | 六张表的 `anon` 均只保留 SELECT；authenticated 仅对 profiles/forum_accounts 有 INSERT/UPDATE | 本地隔离数据库证据，独立开发库尚未部署 |
| 最终 pgTAP | `npx supabase test db --local` | 2 个测试文件、31/31 通过；用例事务回滚 | 不覆盖真实 GoTrue 邮箱流程、Server Action 和浏览器页面；这些分别另验 |
| 本地 CLI | 隔离 `npm_config_cache` 和 `SUPABASE_HOME` 后运行 `npx supabase --version` | 输出 `2.117.0` | CLI 可运行不等于 Docker 或 PostgreSQL 可用 |
| 本地数据库启动与迁移 | Docker daemon 启动后 `npx supabase db start`、`npx supabase migration up --local` | 本地数据库健康；M0/M1、M2 Wiki、M2 Grants 三条 migration 已应用 | 此行是数据库阶段结果；后续 Auth/API 已启动 |
| 数据库类型 | `npx supabase gen types typescript --local --schema public`，替换 `src/types/database.ts` 主体 | 六张表与三个 Wiki RPC 均来自实际 schema；Wiki 可选 RPC 参数调用已匹配，typecheck 通过 | 独立开发库 schema 尚未比对 |
| Lint | `npm run lint` | 通过 | 静态检查 |
| TypeScript | `npm run typecheck` | 通过 | 仅证明生成类型与当前调用在编译期一致 |
| 生产构建 | `npm run build` | 在允许子进程的环境通过，Vinext 五阶段完成 | 沙箱内首次执行因 `spawn EPERM` 失败 |
| 渲染回归 | `node --test tests/rendered-html.test.mjs` | 适配已配置 Supabase 后 5/5 通过；Auth 受保护路由正确重定向 | HTML smoke test 不覆盖真实 API 行为 |
| Git 空白错误 | `git diff --check` | 通过 | LF/CRLF 提示不是内容错误 |

完整 Supabase 栈首次拉取遇到 `toomanyrequests`；最小 Auth/API 栈启动命令的自动权限审核又连续两次超时。用户随后在本机启动了 Auth/API 栈，以下是继续联调的证据。

### 本地 Auth/API 与浏览器联调

| 验收项 | 方法或命令 | 实际结果 | 未验证边界 |
| --- | --- | --- | --- |
| 服务与配置 | `npx supabase status -o env`；本地 `.env.local` | DB/Auth/REST/Kong/Inbucket 服务可用；`.env.local` 仅保存 API URL 与 anon key，并被 Git 忽略 | 独立托管开发项目未配置 |
| GoTrue 与权限 | `node tests/local-api.test.mjs`，临时传入本地 service role key 仅用于清理 | 两位 Creator 注册/登录、Profile trigger、跨用户 Profile 更新拒绝、Wiki 跨 Creator 编辑、陈旧版本冲突与匿名拒绝均通过；用例数据已清理 | 本地注册自动确认，未走真实邮件确认 |
| 浏览器 Auth | Playwright 注册一次性 Creator、打开 `/creator`、退出、再请求受保护页 | Creator 资料和会话可见；退出后 `/creator` 重定向 `/login` | 邮件确认和第二用户浏览器路径未验 |
| 浏览器 Student Wiki | Playwright 创建 Student、编辑摘要、查看历史、回滚 | 首版 version 1；编辑后 version 2；回滚后 version 3 且原摘要恢复，历史保留 REV 001/002/003；测试实体和账户已清理 | College/Place 页面、浏览器冲突反馈及移动端有数据页待验 |
| HTML slug 约束 | Playwright 在 `/create/wiki` 检查输入 `pattern-check` 和 `pattern_check`，读取 `validity.patternMismatch` 与 console | 合法值 true/false、非法值 false/true；控制台 0 error、0 warning | 仅检查浏览器表单约束；服务端 Zod 另有边界 |
| 生产构建与渲染回归 | `npm run build`；`node --test tests/rendered-html.test.mjs` | 构建通过，5/5 渲染测试通过 | 不替代 API 和浏览器用例 |

## 2026-09-23 Living Campus v2 指导文档更新

本批按用户要求先更新前端设计指导并暂停实现。`docs/design/living-campus-v2.md`、`AGENTS.md`、`ROADMAP.md`、RDS/DPS、v1 设计记录和 README 已明确“当前 v1 / 拟实施 v2”，并把每批改动和进展同步文档写成项目规则。没有修改运行时代码、数据库或 Sites 部署。

| 验收项 | 方法或命令 | 实际结果 | 边界 |
| --- | --- | --- | --- |
| 指导一致性 | 对照当前 `app/page.tsx`、`SiteHeader`、`CampusTrace`、`EntityLink` 与新设计文档 | v1 标为当前实现；Campus Layer、Relation Field、Entity Peek、3D 均标为拟实施；论坛/校刊/事件保留媒介差异 | 设计文档不能证明新界面已实现 |
| Git 空白错误 | `git diff --check` | 通过 | Windows LF/CRLF 提示不是内容错误 |
| Lint | `npm run lint` | 通过 | 运行时代码本批未变 |
| TypeScript | `npm run typecheck` | 通过 | 运行时代码本批未变 |
| 生产构建 | `npm run build` | Vinext 五阶段完成 | 未运行新 UI 的浏览器/视觉测试，因为本批没有改渲染代码 |

上述为当时的暂停记录。开发已按用户新指示恢复，新的 M3 证据见下节。

## 2026-09-23 M3 本地开发进行中

| 验收项 | 方法或命令 | 实际结果 | 未验证边界 |
| --- | --- | --- | --- |
| 数据库增量迁移 | `supabase migration up --local` | M3 两条 migration 已应用本地，未 reset 数据库 | 线上项目未迁移 |
| 论坛 pgTAP | `supabase test db --local` | M3 51/51；M1/M2/M3 合计 82/82 | Server Action、浏览器与线上 RLS 仍需联调 |
| 数据库类型 | 本地 CLI `gen types typescript --local --schema public` | 重新生成 M3 表/RPC 类型，保留应用别名 | 线上 schema 尚未比对 |
| 静态检查 | `npm run lint`、`npm run typecheck` | 当前并行工作树通过 | 构建与浏览器执行待验 |

论坛设计和应用契约见 `docs/design/forum.md` 与 `forum-data-contract.md`。保存楼层、Topic 元数据和标签分别是独立请求；目前仅每个 RPC 自身原子。此风险在编辑错误中提示重新载入，需真实浏览器核对恢复路径。Home/Campus UI 与 Wiki 余项仍由并行任务验证，不提前记为通过。

### 本地浏览器与 Linux 可行性补验

| 验收项 | 实际结果 | 未验证边界 |
| --- | --- | --- |
| M2 College/Place | College 创建 v1、编辑 v2、回滚 v3；Place 关联 College、编辑、历史、回滚、并发编辑至 v4 均通过。两标签陈旧表单收到版本冲突提示，不覆盖最新摘要，也不新增 Revision；375px 的 Place 详情/编辑/4 条历史页无横向溢出。测试实体、账户和 7 条 Revision 已精确清理。 | 冲突后表单会暂时显示旧摘要，需按提示刷新；线上邮件确认待验。 |
| Living Campus 首批 | Playwright 1280×720、390×844、375×812；概念沙盘有明确示意标签，Campus Layer 点位切换、Esc 关闭和焦点返回通过；无横向溢出、控制台 0 error/warning。 | 真实 3D、数据库关系、实体 Peek 与完整性能预算未实现。 |
| Forum 本地主路径 | 一次性 Creator 注册/登录、Forum Account 创建/编辑、2 层草稿及回复引用保存、标签同步、发布后详情、匿名按标签读取均通过；Student 关联后其 Wiki 详情自动显示已发布 Topic。375px 论坛详情 `scrollWidth=innerWidth=375`，控制台 0 error/warning。归属守卫事务精确清理测试用户、Student/Revision、账号、Topic/楼层及未复用标签，复查均为 0。 | 第二 Creator 浏览器权限、增删重排专项、部分保存恢复提示与线上项目待验。 |
| 全仓构建回归 | `git diff --check`、`npm run lint`、`npm run typecheck`、`npm run build`、`node --test tests/rendered-html.test.mjs` | 均通过；构建后渲染 5/5。沙箱首次运行构建/Node test 的子进程被 EPERM 阻止，允许后通过。 |
| Linux/Nginx 协议可行性 | Debian/glibc Node 22 容器 `npm ci`、build、`vinext start -H 127.0.0.1`、`nginx -t`、代理首页/登录 200。模板见 `docs/deploy/ubuntu.md`。 | WSL Ubuntu DNS 安装未完成；`vinext start` 随包标为本地预览，生产宿主、HTTPS、云 Auth、Server Action、图片及重启恢复待验。 |

目标是 `campus.kongtian.university` 与托管 Supabase ref `sttghkavzjeqeuignpwi`；本批未连接云项目或自有服务器，也未申请证书、改 DNS 或部署。

本阶段最终 `npm run lint`、`npm run typecheck`、`git diff --check`、`npm run build` 和构建后 `node --test tests/rendered-html.test.mjs` 全部通过（5/5）。用户要求重启电脑，本地阶段至此暂停；未来的生产部署验收不应以本地结果替代。

## 2026-09-23 续作证据（进行中）

- Docker Desktop daemon 29.7.2 可连接；本地 Supabase DB/Auth/REST 已恢复，论坛剩余双 Creator 与编辑器状态验证正在进行。
- `next=/\\evil.test` 经 URL 解析会变成外站 URL；Auth callback 增加反斜杠拒绝和同源检查，注册链接以配置的站点地址优先并使用 `new URL` 拼接回调路径。`node --test tests/auth-redirect.test.mjs` 1/1 通过，覆盖正常站内路径、协议相对地址与反斜杠；lint、typecheck 通过。生产邮件确认尚未验证。
- DNS 查询 `campus.kongtian.university` 当前 NXDOMAIN；未发现云 Supabase CLI access token 或项目 link。Ubuntu SSH 未提供，尚未连接或写入云端。详细步骤和阻塞项见 `docs/deploy/release-checklist.md`。
- 主线复跑 `supabase test db --local`：M1/M2/M3 共 82/82 通过。`npm run lint`、`npm run typecheck`、`npm run build` 均通过；构建生成 standalone 产物并补入 15 个运行依赖包。构建后 `node --test tests/rendered-html.test.mjs tests/auth-redirect.test.mjs` 为 6/6 通过。首次普通沙箱对 Docker 与 Node 测试子进程报 EPERM，获准执行后通过。
- Ubuntu runtime 专项：Windows 隔离目录，以及 `node:22-bookworm-slim` 中 `npm ci`/构建后复制到脱离源码和原 `node_modules` 的目录，Node standalone 的首页、登录、论坛、Wiki、静态校徽均返回 200；无效登录表单的 Server Action 返回 303 并携带校验错误。未在目标 Ubuntu 上测试 Nginx 新配置的语法、systemd 重启、真实邮件登录、TLS 或云端写入。
- 论坛双 Creator 本地 API：两位用户的草稿互不可见、非所有者无法覆盖/发布、不能借用他人 Forum Account；失败替换保持旧楼层，重排后回复仍指向原实体、删除目标后引用符合新编排；发布后匿名与第二 Creator 可读，作者亦不能重写已发布楼层。测试脚本退出码 0；真实浏览器中的第二 Creator 全界面路径仍未验。
- 论坛楼层浏览器专项：三层 Alpha/Beta/Gamma，Gamma 初始回复 Alpha（提交 floor_no 1）；将 Alpha 移到第二层后顺序 Beta/Alpha/Gamma，Gamma 仍回复 Alpha（提交 floor_no 2）；删除 Alpha 后提示清空 1 条引用且 Gamma 变为独立发言。提交 9 个标签收到“最多添加 8 个标签”；原生 Form Action 重置造成发言身份下拉视觉为空，改为手动提交 FormData 后复验，身份仍选中，9 个标签与正文保留；改成 2 个标签后“保存草稿”成功，正文和身份仍正确。
- 一次性浏览器数据精确清理：仅目标草稿 `9fd05148-cb01-40b0-ac1a-b7aeb65a38b1`、论坛身份 `9ad887c9-074e-4be5-acdd-fe0b7732eb67` 与测试用户 `forum-browser-qa-923@example.test`；本地事务输出 DELETE 0 楼层 / 0 标签 / 1 主题 / 1 身份 / 1 用户并提交。API 脚本自清理；最终零残留计数未留证。未重置数据库。
- 第二次 UI 复验的草稿 `3903092d-57ca-4881-8eba-87b7090220c3`、身份 `67ec22bc-cee4-40a7-92c8-46b5240f0525` 与 `forum-reset-qa-923@example.test` 经归属核对后在本地事务删除，1 主题 / 1 身份 / 1 用户；该次证实阻止 reset 与延迟重挂载无效，最终实现已替换。
- 最终 UI 复验的草稿 `9a49fbfa-ae66-4ee7-b9d2-698d104a130b`、身份 `a3f63efc-0f54-44de-bd83-1bde6ec7d2f0` 与 `forum-final-qa-923@example.test` 经归属核对；本地事务删除 1 楼层 / 2 关联 / 1 主题 / 2 个无其他引用的测试标签 / 1 身份 / 1 用户，提交后按 ID 复查四类对象均为 0。API 测试重跑通过；首次运行的 service key 解析含引号，业务断言通过但清理账号 JWT 失败，残留两名测试用户和身份随后按 UUID/邮箱精确删除；修正解析后复跑完整通过，API 测试邮箱残留计数为 0。

## 2026-09-23 · Campus View 卡片堆验收

- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm run build`：通过，生成 standalone；Windows 沙箱首次阻止 Vite 子进程，允许构建进程后完成。
- `node --test tests/rendered-html.test.mjs tests/auth-redirect.test.mjs`：6/6 通过。沙箱首次阻止测试子进程，允许后完成。
- 浏览器：本地 `http://127.0.0.1:3001`，1440×900、375×812；标题、卡片、控制栏与下方栏目视觉检查通过。文档宽度分别 1425/360（视口 1440/375，含滚动条），无横向溢出。
- 手机“下一张”点击从 01/03 到 02/03；键盘 Enter 到 03/03；暂停后 aria-pressed=true。底层卡片 inert，不出现在可访问阅读顺序。
- 自动播放 aria-live=off，实际不同时间观察到顶卡切换。暂停／聚焦时停止定时器。reduced-motion 静态样式与媒体监听已源码核对，尚未通过浏览器系统偏好切换验收。
- 控制台 error/warn：0。当前数据为空，实际验证为三张校园导览卡。真实发布排序、单卡及部分查询失败分支已源码审阅，联网端到端场景本批未验。未登录创作流程未改变；没有新增授权／冲突写入路径。
- 文案：首屏、浏览器标题和页脚统一为大学官网口吻；下方历史样例标为话题／刊物预告或资料整理中，不作为真实最新内容展示。

## 2026-09-23 · 完整前后端集成验收（当前）

- `npm run lint`、`npm run typecheck`：最终集成后通过。
- `npm run build`：通过，Vinext 生成 Node standalone，补齐17个运行依赖。存在 middleware 命名弃用提示；当前运行时支持并经会话测试，未影响构建。
- `node --test tests/rendered-html.test.mjs tests/auth-redirect.test.mjs`：7/7通过。校刊已从占位页更名为空天校刊，对应旧断言已更新；覆盖主页、各公共媒介、搜索、Wiki筛选、Auth回调和不存在作者/作品路径。
- 全库 pgTAP：7个文件187/187通过（子任务执行并留媒体/内容证据）；新增006头像、007论坛原子引用、008管理员定向片段读取均本地应用，类型从已迁移schema生成。
- 私有媒体：MinIO+Node standalone真实PUT/HEAD/GET、重复覆盖412、伪PNG拒绝、双用户/匿名隔离通过；详情见 media-verification.md。没有持久化公开作品fixture。
- 会话续期：`tests/local-session.test.mjs`对新启动Node standalone 3004通过，验证过期session元数据刷新、Set-Cookie持久化、private cache与匿名跳转，临时Auth用户已清理。旧开发进程3001需重启发现新middleware。
- Press：注册、草稿保存/恢复、图片入口、正文块/UUID引用、预览、冲突保留、移动/键盘路径见 integration-review-press.md及design/press.md。发布数据库事务约束通过；浏览器“发布文章”被自动审核拒绝，原因是用户未明确授权将合成测试内容公开。未通过其他接口绕过，保留待审核草稿。
- Events：单维护者、第二作者独立补充、时间节点、陈旧版本冲突及错误输入保持、手机/键盘见design/events.md。曾公开的测试事件发生在上述拒绝通知前，随后按精确UUID清理。
- Forum007：单RPC保存实体/楼层、返回版本、草稿恢复、陈旧冲突、后段失败全事务回滚和匿名实体隔离已通过API及真实SSR验证；最后浏览器新控件结果由后续条目补充。
- 首页：真实新增事件曾出现在卡片堆顶部，Campus Trace使用该事件真实关联；中文“观测”返回学院/地点/事件，Wiki学院反链正确。事件fixture清理后显示真实空状态，不保留虚假活动。首页中等宽度实拍无横向溢出。原卡片堆桌面1440×900/手机375×812与切换/暂停/reduced-motion证据继续适用。
- 本地小数据HTTP观察：首页332ms、搜索101ms、Wiki筛选154ms（均200）；不是线上负载或大数据性能结论。

未完成外部验收：真实R2/CORS、SMTP外部邮件、托管Supabase迁移、Ubuntu/DNS/TLS与正式HTTPS；用户计划微调后部署。本批没有上线。CC BY-SA选项尚待决定，没有自动标记存量作品许可。

## 2026-09-24 · 最后收尾

3001已用 `npm run dev -- --hostname 127.0.0.1 --port 3001` 重启；注意Vinext参数为hostname，host会被忽略而绑定localhost/IPv6。重新运行local-session测试全部通过，不再只有standalone证据。

主线真实浏览器补验论坛007：移除关联后选择器获得焦点、Down键选择人物、添加、保存成功、刷新后人物与楼层恢复；375×812发现旧预览grid挤压人物姓名，已分离关联选择器CSS并截图复验，姓名和移除按钮正常且无横向溢出。viewport已reset；可用的新首页预览tab保留。未发布。

待用户许可的本地文章草稿：`http://127.0.0.1:3001/create/article/d3c674c7-0e1f-41dc-a57a-931a9d58c21d`。公开Wiki测试人物`pressqa-0923-876`被该文章与论坛草稿FK引用，为保持待审预览暂留，不能直接清理；因此首页暂有该测试人物。测试发布和后续精确清理一起等许可。所有业务数据仍在隔离本地服务，没有改动线上数据库。

最终手机选择器修复后的全仓 lint、typecheck、build 再次通过；git diff --check通过。未重跑与CSS无关的DB/媒体测试。README、ROADMAP、RAS/RDS/DPS、progress及部署文档已同步本批实现与边界。

## 2026-09-28 · lax01 部署准备

用户授权本机SSH密钥连接ventsdenye及root@lax01.ventsdenye.com；保留现有Supabase项目，不干扰其他网站。已只读核对原站/端口/Nginx，并安装独立Node22.23.3、ktu系统用户与本项目空目录，未启用应用或代理。采用deploy/lax01独立配置：回环3107、版本目录、受限HTTPS预览及注册开关。现有主站与作品集配置hash和200基线保存在deploy/lax01/README.md。

下一步需要用户本机Supabase CLI登录与项目用途确认，然后只读云schema/迁移/备份审计。R2与SMTP尚未配置，具体用户操作见该README；没有迁移云库或公开应用。Cloudflare域名已解析到代理IP（旧NXDOMAIN记录已过时），源站配置仍待核实。

## 2026-09-28 · 受限测试站已部署

用户确认root密钥SSH与独立Supabase用途，授权部署；补充约束为服务器只保留必要内容。云项目原public无表/类型、auth.users=0，保留rls_auto_enable函数。output/deploy-20260928/cloud-public-before.sql保存迁移前结构（Git忽略）；13个本仓库迁移已全部应用，复核29张表全部RLS、13条迁移记录、Auth用户仍0。

云公开参数在Linux专用release构建，lint/typecheck/build通过（构建内存峰值856.7MB，限额1100MB/50%CPU）；注册开关standalone测试本机1/1通过。此次本机旧SSR回归4/7，因本地Supabase停服，未掩盖失败；不能沿用9月24日7/7声称本批全绿。云产物通过真实回环smoke：主页/登录/论坛/Wiki/图片200，无效登录303。

原站配置hash不变，kongtian.university与portfolio.ventsdenye.com仍200。新增campus专用Nginx vhost，nginx -t通过后reload，未restart旧服务。证书有效期至2026-12-27。通过Cloudflare访问匿名401、Basic Auth授权200，禁止缓存/索引。访问密码只保存在服务器root可读的/etc/ktu-community/preview-access.txt；本机没有输出其值。应用KTU_REGISTRATION_ENABLED=false，云Auth注册设置尚需单独核实/关闭，不能宣称此开关封住Supabase直接API。

用户要求轻量运行后精确清理本项目源码/完整node_modules/npm缓存/上传包，保留dist/standalone64MB和私有Node二进制121MB，配置约44KB；服务器磁盘回到8.8GB已用/11GB可用，应用内存约52MB。清理后只重启ktu-community，回环复验正常。服务器无源码Git checkout；本地deploy/backend分支用于代码与配置追踪，后续本机/CI构建+artifact更新。不要声称已实现服务器git pull产物流程。

当前可访问：https://campus.kongtian.university/（受限预览）。真实R2/SMTP/注册确认/首位Creator和管理员仍待配置，未创建云测试账号或作品、未发布合成内容。操作步骤见deploy/lax01/README.md。应用目录/srv/ktu-community/current -> releases/20260928-01，专用服务ktu-community，回环3107。

### 交付状态（2026-09-28）

源码与部署配置已在deploy/backend分支提交2ae918e并推送origin。服务器当前是精简standalone产物，不是Git完整源码checkout；未来服务器git pull产物分支的自动化尚未配置。最终HTTPS验证：首页/检索/校刊/事件200，Creator307转登录，注册页明确暂未开放；匿名401。清理后进程MemoryCurrent约44MiB，原有两个网站仍200且配置hash一致。

## 2026-09-29 · 反向代理媒体同源校验修复

线上验收发现公开 HTTPS Origin 与应用内部 HTTP Request URL 不同，原同源比较误拒绝上传。生产媒体 POST 现只信任部署配置 NEXT_PUBLIC_SITE_URL 的 origin；缺失、非 HTTP(S)、带凭据或非根路径/query/hash 的配置拒绝请求，不回退 Host，不信任 Forwarded/X-Forwarded-*。开发仍使用 Request URL 的 origin。配置必须是完整站点根 URL；本地 standalone 媒体测试显式覆盖为 http://127.0.0.1:3005。

对应实现为 src/features/media/same-origin.mjs 与 server.ts；测试 tests/media-origin.test.mjs 覆盖内部 HTTP/外部 HTTPS、异源/缺失/opaque Origin、伪造转发头、非法/缺失配置和开发/本地 standalone。直接 node tests/media-origin.test.mjs 执行 6/6 通过，typecheck 与定向 ESLint 通过；node --test 在 Windows 沙箱遇到 spawn EPERM，因此改为单进程测试执行。当前为 deploy/backend 工作区增量，Linux 构建及线上复验由主线继续，本记录不代表已部署成功。

## 2026-09-29 · 团队测试开放

用户明确要求取消外层预览密码、允许团队成员自行注册发文。已部署本机WSL Linux构建（Node24.19，服务器运行Node22.23.3），仅standalone；current现为releases/20260929-02，保留前版回滚。首次新产物目录层级不符启动失败，已更正为dist/standalone，并重新完整冒烟通过。team-beta.nginx.conf取消Basic Auth，保留TLS、noindex、no-store和应用账号验证。KTU_REGISTRATION_ENABLED=true，Supabase邮箱注册启用且需要邮件确认。用户确认QQ邮箱收到了注册确认邮件；重复注册日志23505属于邮箱唯一键冲突，不修改Auth约束、不删除账号。

媒体同源修复已线上复验：正式HTTPS Origin通过校验返回输入校验400，不再错误403。R2 HEAD200、CORS204前置检查通过；真实登录后上传/发布全流程由团队测试，未声称完成。服务页面/图片200、无效登录303，nginx -t通过；两个原站配置SHA256与基线一致。lint、typecheck、media-origin6/6通过；Linux五阶段build成功。ESLint新增output/**忽略，避免隔离构建产物被当源码扫描。

用户允许服务器Git拉取更新，专用deploy/runtime产物分支正在准备；deploy/backend保留源码。服务器不进行npm安装/构建。外层密码已不再用于访问，任何获得网址的人均可访问和注册，noindex不等于访问控制。当前没有自动授予管理员权限。

2026-09-29 Git交付复验完成：源码60b82a8，产物deploy/runtime=c44ee76ced8ca99048a71aeb2fc589b857ffb38b，远端ref一致；服务器update-runtime.sh实际浅fetch+archive发布成功，current指向releases/git-c44ee76ced8ca99048a71aeb2fc589b857ffb38b。页面/图片200、无效登录303、公开注册页200；两个旧站配置hash不变。bare产物仓库12MB，应用内存约44MB。移除失败/重复9月29日目录和临时上传包，保留9月28日前版；已停用预览凭据文件被删除。仅运行资源和小型Git对象留在服务器，无源码/开发工具安装。线上正式Origin输入校验400、匿名有效结构请求401、R2HEAD200/CORS204；真实用户发布/上传由团队验证，未伪称端到端已通过。

## 2026-09-29 · 邮件内置浏览器回调提示

邮箱内置浏览器可能缺少注册浏览器保存的 PKCE verifier。回调仍严格执行 exchangeCodeForSession，不绕过 PKCE、不假定邮箱已确认；SDK pkce_code_verifier_not_found 或 AuthPKCECodeVerifierMissingError 转为中文普通提示，建议用注册邮箱和密码登录。其余回调失败及缺失 code 显示固定中文说明，不透传服务英文或错误细节。

app/auth/callback/route.ts 调用 callback-notice.mjs；auth-callback-notice.test.mjs 使用真实 SDK 错误类、独立 code/name 和普通/空错误验证提示映射，3/3 通过。本次不修改邮件模板，模板由主线单独整合。当前工作区待合并提交；完整构建/线上验收状态由后续记录更新。

回调修复验证补充：全项目 typecheck、定向 ESLint 与 git diff --check 已通过；Linux 五阶段编译已通过，standalone 收尾及路由冒烟仍在进行。


2026-09-29中文注册邮件：用户要求确认邮件中文化，已新增deploy/auth-email模板。CLI config push被自动审核拒绝（默认Auth覆盖风险），未执行；改用官方API仅PATCH确认邮件subject/content两字段并GET精确核对。其他设置未改变，只有供应商确认模板custom_contents标志自动变true。旧邮件不变，新邮件中文；未发额外测试邮件。保留ConfirmationURL和PKCE，仅优化回调提示，不把缺verifier当已验证成功。
