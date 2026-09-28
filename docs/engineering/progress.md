# 当前恢复入口 · 2026-09-23 全平台批次

M0–M7 应用实现已接通；lint/typecheck/build、7项SSR回归与Node standalone会话续期均通过，开发预览重启与最后论坛控件复验均完成。仅本地测试文章发布/精确清理待自动审核许可，云部署与许可方式决定另列。数据库 187/187 通过，MinIO 私有媒体链路通过。所有改动仍在工作树，无部署。当前验收以 verification.md 最新条目为准，以下早期记录是历史。
# KTU 平台工程进度

## 续作状态（2026-09-23，公开测试版上线准备）

- 用户重启后要求继续并尽快完成；解除上一轮暂停。起点提交 `ddc5864`、工作树干净。目标仍是账户、Wiki、论坛公开测试版与 `campus.kongtian.university`。
- 本轮并行补验：论坛双 Creator 浏览器权限及草稿恢复、Ubuntu 正式 Node 运行目标、线上 Supabase/DNS/配置只读审计。主线负责应用集成、工程文档与最终门禁。
- Docker Desktop daemon 已可连接（29.7.2）；首次检查时本地 DB/Auth/站点端口未监听，正在恢复。线上数据库/服务器仍未修改；待准备好迁移、环境与验证步骤后再部署。
- 本地 Supabase DB/Auth/REST 随后已恢复。只读发布审计确认 `campus.kongtian.university` 当前 NXDOMAIN；本机没有云 Supabase CLI access token/link，服务器 SSH 地址与账户也未提供。需在本地验收完成后取得这些外部配置才可部署。
- 修正注册邮件回调 URL 优先使用 `NEXT_PUBLIC_SITE_URL`，并阻止 Auth callback `next=/\\外部域名` 被解析为站外跳转；此批 lint/typecheck 通过，生产 HTTPS 邮件确认仍待验。
- Ubuntu 发布入口已改为 Vinext standalone Node；补齐构建产物的 React/运行依赖，提供 systemd、Nginx HTTP 签证引导与 HTTPS 配置。隔离 Linux 容器完成构建、SSR、静态图片与无效登录 Server Action 冒烟；真实服务器及云端未触及。
- 主线复跑本地数据库 82/82 pgTAP、lint、typecheck、生产构建、渲染与回调测试 6/6 均通过。论坛双 Creator API、楼层引用重排/删除与错误恢复通过；手动提交 FormData 后，浏览器确认失败保存仍保留发言身份、标签与正文，修正输入后能成功保存。一次性测试数据已精确清理并复查为零。

## 上一阶段交付（已提交 `ddc5864`）

- 用户恢复开发，首发范围为账户、Wiki、论坛的公开测试版；目标域名 `campus.kongtian.university`，境外 Ubuntu 自有服务器与托管 Supabase 项目 `sttghkavzjeqeuignpwi`。本地调试完成后再进行服务器部署。
- M3 数据库已完成，本地 51/51 M3 与全库 82/82 pgTAP；M2 Wiki 补验已完成；Living Campus 首批首页/导航/Campus Layer 通过桌面与手机浏览器检查。Forum Account、草稿、发布、匿名列表/标签/详情和 Student Wiki 反向入口已走通本地浏览器主路径。
- 两条 M3 增量迁移已应用本地；数据库类型已从本地 schema 重新生成。`git diff --check`、`npm run lint`、`npm run typecheck`、`npm run build` 和构建后渲染 5/5 已通过。浏览器 375px 论坛详情无溢出、0 error/0 warning。测试数据清理状态见下方新验收记录。
- Topic 楼层、标题/版面、标签通过独立 HTTP 请求保存，各自校验，但不共享一个事务。后续步骤失败时编辑页提示部分保存并要求重新载入；上线前需专项检查这一恢复路径。线上 Supabase 未迁移，生产变量、SMTP、DNS、Nginx、HTTPS 与服务器 SSH 尚未配置。Ubuntu Node 容器构建和 HTTP Nginx 代理可行性见 `docs/deploy/ubuntu.md`，但 `vinext start` 仍是预览目标，不能宣称生产宿主已验。
- 本批从 `main` 的 `c9872c4` 开始，当前提交与工作树以 Git 状态为准。用户要求本阶段结束后暂停供其重启电脑；本地验证和文档同步完成后停止开发，不连接线上服务器。下面“暂停”章节是之前阶段的历史记录，不能代表当前状态。
- 本轮一次性论坛测试数据已在单个带归属守卫的本地事务中精确清理：测试 Creator/Auth、Student、Revision、Forum Account、Topic、2 层楼层和 2 枚未复用标签。按 UUID、邮箱、handle、slug 复查均为 0；没有 reset 数据库。

## 重启后恢复

1. 启动 Docker Desktop 和本地 Supabase，确认本地 DB/Auth/REST 可用；当前工作进度从 M3 双用户浏览器权限、草稿部分保存恢复与正式部署宿主评估继续。
2. 本地预览需要 `npm run dev -- --port 3002`（或空闲端口），浏览器使用 `http://localhost:3002/`。重启电脑后不假定旧 dev server 仍运行。
3. 上线前取得 Ubuntu SSH 地址、用户名与连接方式，确认 `campus.kongtian.university` DNS；核对托管 Supabase 的迁移、anon key、Auth Site URL/回调、SMTP，再验证正式生产运行方式、Nginx/HTTPS 和线上端到端流程。密钥只放本地/服务器环境文件，不贴入文档或聊天。
4. 本轮本地开发和发布准备提交后按用户要求暂停，重启后从上线清单继续。尚未部署线上服务。

## 上一轮暂停记录（历史）

- 当前 `main` HEAD：`c9872c4 test: verify local Supabase auth and wiki flows`。本轮 Living Campus v2 指导文档改动尚未提交；不把它们写成已实现的页面。
- 本轮已更新 `AGENTS.md`、`README.md`、`docs/ROADMAP.md`、`docs/engineering/RDS.md`、`DPS.md`、`progress.md`、`verification.md` 和 v1 设计记录，新增 `docs/design/living-campus-v2.md`。当前只修改文档，没有改变网站页面、Auth、数据库或部署；`git diff --check`、lint、typecheck、build 通过。
- 用户确认首发为“账户＋Wiki＋论坛”的公开测试版，允许任何访客注册发帖；线上 Supabase 项目 ref 为 `sttghkavzjeqeuignpwi`，自定义域名尚待用户注册和提供。Site 当前仍为仅站点所有者可访问的旧版本，生产环境变量未配置，不可宣称公开上线。
- 为优先处理前端指导文档，M3 论坛数据库与 M2 浏览器 QA 并行任务已中断。工作树存在未跟踪的 `202609230002_m3_forum.sql` 与 `m3_forum.test.sql` 草稿；**未验证、未提交，不应当作已应用 migration**。恢复时先审查草稿及本地 migration 状态，再决定是否继续。
- 用户随后已恢复开发；每次改动、任务状态和实际验收继续同批同步到设计/工程文档。

## 上一阶段目标与结果（2026-09-23）

- 目标：收尾 M1/M2 的真实服务验收，再进入 M3。
- 当前阶段：隔离本地 Supabase 的 DB、Auth 和 REST 已运行，31/31 pgTAP、真实双用户 API 集成与浏览器 Student 主路径通过；邮件确认、College/Place 页面和移动端有数据状态待补验。
- 上一阶段 M1/M2 验收已由 `c9872c4` 提交；本节其余内容是该提交的实现记录。
- 本机 Supabase CLI `2.117.0` 已可通过 `npx` 调用；Docker daemon 已连接，本地 DB/Auth/REST/Kong 服务已启动。

## 本批已完成（2026-09-23）

- 新增 `supabase/tests/database/m1_auth.test.sql`：测试 Auth 用户触发 Profile、handle 冲突与双用户 Profile RLS。
- 新增 `supabase/tests/database/m2_wiki.test.sql`：测试三类 Wiki RPC 创建、Revision、直接写入禁令、跨 Creator 共同编辑、陈旧版本冲突、字段白名单与回滚。
- 首次 pgTAP 揭示 Supabase 默认 Grants 使 `anon` 对六张表拥有 DML 权限；新增 `202609230001_m2_grants_hardening.sql` 明确撤销并按角色重新授权，重跑后 31/31 通过。
- 从本地迁移后 schema 生成 `src/types/database.ts`，调整 Wiki RPC 可选参数调用，TypeScript 检查通过。
- 本地 `.env.local` 已配置 API URL 与 anon key，且被 Git 忽略；真实 GoTrue 双用户登录、Profile RLS、跨 Creator Wiki 修改、陈旧冲突和匿名拒绝通过 `tests/local-api.test.mjs`，用例数据已清理。
- 浏览器已通过注册、Creator 页面、Student 创建、编辑、Revision 历史、回滚与退出；回滚后版本为 3，原始摘要恢复。修复创建页 slug HTML pattern，浏览器有效/无效值校验正确、控制台 0 error/0 warning。
- 更新本地 Supabase 启动和测试说明；隔离 CLI/NPM 缓存目录不进入 Git。

## 上一批已完成（2026-09-22）

- 首页 Campus Trace 改为事件、人物、机构、论坛身份四类动态标签，不再展示未设定的校园建筑。
- Campus Trace 支持点击、ArrowLeft/ArrowRight、Home/End、ARIA tab 语义、焦点与 reduced-motion。
- Wiki 第一版字段与 `version bigint` 乐观锁策略写入 RDS 和 `docs/design/wiki-foundation.md`。
- 新增 `create_wiki_entity`、`apply_wiki_revision`、`rollback_wiki_revision`；创建、修改和回滚都写不可变 Revision。
- 撤销 authenticated 对 Student、College、Place 和 Wiki Revision 的直接写权限；RPC 只授予 authenticated。
- 新增 Wiki 目录、详情、创建、编辑、历史和回滚页面，以及服务端 Zod 校验、查询与错误映射。
- 新增统一 Wiki 实体类型、URL 与 `EntityLink` 组件边界。
- README、ROADMAP、RDS、DPS 和验收记录同步到实际状态。

## 上一批验证

- `git diff --check`：通过，仅有 Git 的 LF/CRLF 提示。
- `npm run lint`：通过。
- `npm run typecheck`：通过；只读沙箱首次阻止写 `tsconfig.tsbuildinfo`，允许写构建缓存后通过。
- `npm test`：通过；生产构建完成，5/5 渲染与迁移源码契约测试成功。
- Playwright 桌面 `1440x900`：Wiki 目录空状态和控制台检查通过，0 error、0 warning。
- Playwright 移动 `375x812`：Wiki 创建页无横向溢出，未配置 Supabase 时提交按钮禁用。
- Campus Trace：点击人物显示 `林若岚 / PER-00427 / 02`；ArrowRight 切换机构显示 `玄学院 / ORG-0003 / 03`。
- reduced-motion：媒体查询命中，轨道和面板动画计算时长均为 `0.01ms`。

## 当前未验证与阻塞

- 本地 Supabase 注册自动确认，尚未验真实邮件确认和回调；独立托管开发项目尚未部署。
- College/Place 已通过数据库 RPC 创建用例，但页面级创建、编辑、历史、回滚仍待浏览器验证。
- 移动端有数据详情页、浏览器中的陈旧版本冲突反馈及第二用户界面路径待验；API 层的双用户权限和冲突已通过。

## 下一步

1. 补齐 College/Place 浏览器页面、移动端有数据页和 Wiki 冲突反馈的验收。
2. 对邮件确认链路建立可重复用例，并在独立开发项目复核 migration 与 Auth 配置。
3. M2 应用链路稳定后进入 M3 Forum Account 与 Topic 发布闭环。

## 恢复方式

新会话依次阅读：`AGENTS.md` → `docs/ROADMAP.md` → 本文件 → `docs/engineering/DPS.md` → `docs/engineering/verification.md`。然后核对 `git status`、本地 Supabase 服务和 migration 状态，从 KTU-M104/KTU-M207 的未验边界继续。

## 2026-09-23 · 最新进度：首页改版

首页已改为大学官网语气；CAMPUS VIEW 为自动切换卡片堆，按真实公开内容时间降序组织，空状态为校园导览。调整标题、留白、栏目背景和页脚，保留论坛／校刊／事件的独立结构。没有迁移。

工作树：本批修改保留为未提交改动，开始时工作树干净；未部署。lint、typecheck、build 与 6/6 既有回归测试通过。桌面 1440×900、移动 375×812 视觉及手动／键盘切换、暂停验证通过；浏览器无 error/warn。详细证据见 verification.md 的同日 Campus View 条目。

后续：接入有真实发布内容的环境，补跨源排序和部分源故障的端到端验收；校刊／事件发布源按 M4/M5 进度接入。新发布内容通过重新加载首页读取，不是实时推送。

## 2026-09-23 完整平台续作（进行中）

用户扩大范围至全前后端，之后再微调和部署，并明确要求子agent并行。按 `docs/design/full-platform.md` 推进M4–M7；正文格式和管理员授予策略按该文档选定可迁移、可撤销实现，不再被旧首发范围限制。保留上一批首页未提交改动；本阶段不部署。数据库、校刊、事件三条子任务并行，主线负责媒体/运营/搜索与集成验收。

## 2026-09-24 · 最后收尾

3001已用 `npm run dev -- --hostname 127.0.0.1 --port 3001` 重启；注意Vinext参数为hostname，host会被忽略而绑定localhost/IPv6。重新运行local-session测试全部通过，不再只有standalone证据。

主线真实浏览器补验论坛007：移除关联后选择器获得焦点、Down键选择人物、添加、保存成功、刷新后人物与楼层恢复；375×812发现旧预览grid挤压人物姓名，已分离关联选择器CSS并截图复验，姓名和移除按钮正常且无横向溢出。viewport已reset；可用的新首页预览tab保留。未发布。

待用户许可的本地文章草稿：`http://127.0.0.1:3001/create/article/d3c674c7-0e1f-41dc-a57a-931a9d58c21d`。公开Wiki测试人物`pressqa-0923-876`被该文章与论坛草稿FK引用，为保持待审预览暂留，不能直接清理；因此首页暂有该测试人物。测试发布和后续精确清理一起等许可。所有业务数据仍在隔离本地服务，没有改动线上数据库。

## 2026-09-28 · lax01 部署准备

用户授权本机SSH密钥连接ventsdenye及root@lax01.ventsdenye.com；保留现有Supabase项目，不干扰其他网站。已只读核对原站/端口/Nginx，并安装独立Node22.23.3、ktu系统用户与本项目空目录，未启用应用或代理。采用deploy/lax01独立配置：回环3107、版本目录、受限HTTPS预览及注册开关。现有主站与作品集配置hash和200基线保存在deploy/lax01/README.md。

下一步需要用户本机Supabase CLI登录与项目用途确认，然后只读云schema/迁移/备份审计。R2与SMTP尚未配置，具体用户操作见该README；没有迁移云库或公开应用。Cloudflare域名已解析到代理IP（旧NXDOMAIN记录已过时），源站配置仍待核实。

## 2026-09-28 · 受限测试站已部署

用户确认root密钥SSH与独立Supabase用途，授权部署；补充约束为服务器只保留必要内容。云项目原public无表/类型、auth.users=0，保留rls_auto_enable函数。output/deploy-20260928/cloud-public-before.sql保存迁移前结构（Git忽略）；13个本仓库迁移已全部应用，复核29张表全部RLS、13条迁移记录、Auth用户仍0。

云公开参数在Linux专用release构建，lint/typecheck/build通过（构建内存峰值856.7MB，限额1100MB/50%CPU）；注册开关standalone测试本机1/1通过。此次本机旧SSR回归4/7，因本地Supabase停服，未掩盖失败；不能沿用9月24日7/7声称本批全绿。云产物通过真实回环smoke：主页/登录/论坛/Wiki/图片200，无效登录303。

原站配置hash不变，kongtian.university与portfolio.ventsdenye.com仍200。新增campus专用Nginx vhost，nginx -t通过后reload，未restart旧服务。证书有效期至2026-12-27。通过Cloudflare访问匿名401、Basic Auth授权200，禁止缓存/索引。访问密码只保存在服务器root可读的/etc/ktu-community/preview-access.txt；本机没有输出其值。应用KTU_REGISTRATION_ENABLED=false，云Auth注册设置尚需单独核实/关闭，不能宣称此开关封住Supabase直接API。

用户要求轻量运行后精确清理本项目源码/完整node_modules/npm缓存/上传包，保留dist/standalone64MB和私有Node二进制121MB，配置约44KB；服务器磁盘回到8.8GB已用/11GB可用，应用内存约52MB。清理后只重启ktu-community，回环复验正常。服务器无源码Git checkout；本地deploy/backend分支用于代码与配置追踪，后续本机/CI构建+artifact更新。不要声称已实现服务器git pull产物流程。

当前可访问：https://campus.kongtian.university/（受限预览）。真实R2/SMTP/注册确认/首位Creator和管理员仍待配置，未创建云测试账号或作品、未发布合成内容。操作步骤见deploy/lax01/README.md。应用目录/srv/ktu-community/current -> releases/20260928-01，专用服务ktu-community，回环3107。
