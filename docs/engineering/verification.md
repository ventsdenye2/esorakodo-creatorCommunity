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
