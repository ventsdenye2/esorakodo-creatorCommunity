# 当前恢复入口 · 2026-10-17 角色创建及首页调整已上线

已部署源码c2fc836 / runtime59bd4de。角色真实Auth+R2建档、匿名公开读取、保留资讯堆叠及桌面/手机验收通过；临时账号与全部测试对象清零。官网风格约束已写入AGENTS.md。当前无待部署或测试清理步骤，最终证据见verification.md最新记录；后续文档提交不会改变运行包源码对应关系。

# 当前恢复入口 · 2026-10-13 功能修复已上线

功能修复完成并上线。源码修复提交 20b29f4、2c87c39、eb3d6d3 均已推送 deploy/backend；Linux runtime 5cab52dced83ab49947205627a63666889bc3f4b 已推送 deploy/runtime，并通过既有 SSH 更新脚本上线。current 指向同名版本，ktu-community active，前版 403d56d 保留。追加迁移 202610130001 已事务应用，三张既有表数量/内容指纹不变；无生产合成作品、评论或媒体创建。

详见本批设计与 verification 最新证据。文档收尾提交后检查工作树干净。

# 历史恢复入口 · 2026-09-23 全平台批次

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

2026-09-29中文注册邮件：用户要求确认邮件中文化，已新增deploy/auth-email模板。CLI config push被自动审核拒绝（默认Auth覆盖风险），未执行；改用官方API仅PATCH确认邮件subject/content两字段并GET精确核对。其他设置未改变，只有供应商确认模板custom_contents标志自动变true。旧邮件不变，新邮件中文；未发额外测试邮件。保留ConfirmationURL和PKCE，仅优化回调提示，不把缺verifier当已验证成功。

2026-09-29 中文回调与邮件交付完成：源码6b83219，runtime116d827ed71617ecce8caaf7129907573e7b8ebd，服务器已实际Git更新。lint/typecheck通过，回调错误3/3和重定向1/1通过，Linux build和真实standalone callback/media smoke通过。线上发现内部HTTP生成Location后，在专用team-beta.nginx.conf增加仅本站HTTP→HTTPS精确proxy_redirect；nginx -t/reload后线上GET实测缺verifier中文message、无code中文error，均307到正式HTTPS本站/login，恶意next不外跳。未减弱PKCE，不宣称缺verifier等于邮箱已确认。中文注册确认邮件两字段已云端GET读回一致，实际邮件客户端呈现由后续团队注册验证；旧邮件保持原样。服务器保留当前116d827与上一版c44ee76，删除更旧首发产物以节省磁盘。


## 2026-09-29 · 论坛树状创作与 Markdown 档案

用户确认：论坛 👍 / ？仅为创作者设置的剧情数据，读者端展示；修订采用线性历史、两版差异、恢复新版本，不做分支合并。补充确认所有论坛身份（包括学生类型）均可不关联人物档案创建。详情见 docs/design/forum-wiki-reading.md。

实现：阅读/编辑共用 ThreadTree，保留楼层编号、父节点链接、分支折叠、原位添加回复、上下移动、计数输入和阅读预览。档案在摘要外新增 50000 字 Markdown 正文，GFM 安全渲染与格式工具栏，历史显示版本、作者、提交说明、快照、行差异；超长差异有时间上限并退化为整段增删。追加迁移 202609290001，旧数据计数默认 0、旧快照缺 body 恢复为空；解除 student_accounts_require_student，FK、所有权和 RLS 保留。

验证完成：最终 lint、typecheck、Windows build 与 Linux 五阶段 build 全部通过。隔离 PostgreSQL 17 原样执行全部 14 个迁移，38 项域表/RPC/RLS 检查通过；Auth 请求声明使用测试函数复现，不等同完整 Supabase Auth/API 验收。浏览器组件覆盖创作交互、序列化、安全 Markdown 和修订恢复表单；action 边界为桩，保存事务另由 SQL 覆盖。云端迁移、推送、SSH 发布和线上真实内容读取验证均完成；没有创建线上测试作品，未声称真实登录发布端到端验收。

交付完成：deploy/backend 源码、deploy/runtime Linux standalone，服务器通过 /etc/ktu-community/update-runtime.sh 浅 fetch/archive 并切换 current，仅重启 ktu-community。功能源码为 72210ce853c6f81abf74e91e32da1c073d653b3c，线上产物为 94bd025a50f2ce48e1e1c5e24a3977cd52b6669a；后续提交仅同步交付文档。追加迁移 202609290001 已应用，六张受影响表原字段数量/指纹事务内一致。原运行版本 116d827 保留用于回滚。测试工具/数据库/截图在 Git 忽略的 output；没有导出云端业务数据。


### 2026-09-29 验证与迁移进展

最新 lint、typecheck、Windows build 全部通过。临时 PostgreSQL17 的 38 项检查通过，覆盖全部 14 个迁移、独立学生论坛身份、计数边界/原子回滚/越权/发布冻结、三类 Markdown 档案创建/修改/冲突/恢复，以及无 body 的旧快照。可复现命令：npm install --prefix output/pg-check embedded-postgres@17.10.0-beta.17；node tests/forum-wiki-database.mjs。

云端 202609290001 已通过管理 API 在事务中应用，5 个新列、身份可独立创建、匿名新 RPC 禁止执行、迁移记录均读回核验。事务内部比较受影响六张表迁移前后数量和既有字段 MD5，完全一致。完整业务数据导出被自动审批拒绝，已取消导出；仅使用服务端内部指纹比较，没有把云端业务内容下载到本机。旧运行版本仍兼容追加 schema。最终 Linux 产物已通过 SSH 发布，详见本页交付记录。

浏览器真实组件验收已覆盖折叠、新增子回复、两种计数、保存输入序列化、阅读预览、删除父节点提示、GFM 表格/粗斜体/列表、危险 URL/HTML 禁用、版本选择/恢复表单和 390px 页面无溢出。截图位于 output/playwright/forum-wiki-{desktop,mobile}.png。此处 action 边界使用隔离桩，SQL 权限事务验证与浏览器 UI 验证分别记录，不宣称真实用户线上创建/发布已全程验收。

### 2026-09-29 20:30 CST · 线上交付完成

功能源码 72210ce853c6f81abf74e91e32da1c073d653b3c、运行产物 94bd025a50f2ce48e1e1c5e24a3977cd52b6669a 均已推送并通过远端 ref 核对。SSH 执行既有 update-runtime.sh 成功，current 指向 /srv/ktu-community/releases/git-94bd025a50f2ce48e1e1c5e24a3977cd52b6669a，systemd ktu-community 为 active，检查时内存约 42 MiB。Linux 源码 142 个运行输入与主工作区一致；standalone 共 5791 文件、57487762 字节，未包含环境文件或构建凭据。Linux 启动、媒体同源、中文回调冒烟通过。

正式站真实帖子 3d8aad83-2b72-4645-bffb-1818d906cf0c：三楼嵌套于二楼、三条计数均为旧数据默认 0、折叠/展开成功，390px 无横向溢出。实际学生档案 test 历史可选择版本并展开 v1 快照，控制台错误/警告均为 0；匿名访问 /wiki/student/test/edit 跳转中文登录提示。截图为 output/playwright/forum-production-{desktop,mobile}.png。版本差异与恢复写入由隔离组件及 SQL 验证；没有用线上用户身份进行写入/发布测试。

Campus 与 portfolio 返回 HTTP 200。主站一次服务器侧 TLS 探测出现 EOF，本机复核 https://kongtian.university/ 返回 HTTP 200。两个旧站 Nginx 配置 SHA256 与部署前相同，本批未修改 Nginx。云端迁移校验已完成，功能无遗留部署阻塞；本提交仅收尾文档，无需重新构建运行产物。
## 2026-10-01 · 创作者站内教程

新增公开 /guide 操作手册：身份概念、论坛编排、Markdown 档案、修订恢复、校刊、事件和常见问题。练习区可切换回复关系、设置示例计数和练习 Markdown，完全在页面内运行，不保存或发布。创作中心与页脚提供总入口，各编辑器提供新标签页定位到对应章节的链接，保留当前输入。使用当前真实字段/按钮说明，明确无自动保存、论坛冻结与 Wiki 直接公开。设计见 docs/design/creator-guide.md。

当前状态：图解教程已上线。lint/typecheck、Windows/Linux build、浏览器桌面/手机验收和线上入口/图片/练习验证通过。功能源码 ba365ef，运行产物 1f4d089；已推送并通过 SSH 更新。无 schema/权限变更，部署证据见 engineering/progress.md 与 engineering/verification.md。
### 图解教程补充

用户进一步要求原界面截图与文案一一对应。/guide 现以 10 张原页面/编辑组件截图为主体，34 个编号框选对应 34 项说明；图片使用演示数据，可打开原图。截图位于 public/guide，来自现有表单 DOM/CSS 的实际浏览器渲染，未读取私人草稿或生成虚构界面。交互练习收进展开区域，保留目录和新标签页帮助入口。先前纯文字草案已调整，图解布局和最终构建均已验证。数据/权限没有变化，无新增迁移。
### 2026-10-01 图解教程本地验收

最终 lint、typecheck、Windows build 通过。独立截图环境直接调用原表单页面/编辑组件，存入 public/guide 的 10 张 PNG 共 170583 字节；34 个编号框选与 34 条文字说明对应。真实 standalone /guide 已检查全部截图解码、目录锚点、320/390/1280px 布局、论坛回复/计数练习、Markdown 插表/重置；控制台错误和警告均为 0。原图新标签页打开通过。隔离原身份表单填写未保存内容后打开教程，输入保持且定位到正确章节；这属于 UI 验证，不冒充线上登录写入验收。

最终 Linux 构建、standalone 打包和回调/同源冒烟全部通过；157 个运行源文件/图片与主工作区逐一比较一致。截图查看记录在 output/playwright/guide-{annotated-forum,mobile-final,desktop-final}.png。没有新增 schema 或真实账号数据写入。
### 2026-10-01 · 图解教程线上交付完成

源码功能提交 ba365efc031aa14803d9cd7d1be6a7a8fc7ec7a5 和 deploy/runtime=1f4d089f695e60418c9326fce905390573a48a1b 均已推送，远端 ref 已核对。SSH update-runtime.sh 成功，current 指向 /srv/ktu-community/releases/git-1f4d089f695e60418c9326fce905390573a48a1b，ktu-community active，检查时内存约 58 MiB。运行包共 5821 文件、57909169 字节，未包含环境文件、截图环境代码或私有草稿；前一版 94bd025 保留。

正式 https://campus.kongtian.university/guide 返回 200。浏览器逐一解码全部 10 张截图、确认 34 个标注，验证论坛示例改回复对象/计数、Markdown 插表/重置、390px 无横向溢出和页脚入口。真实档案历史页的教程链接在新标签页打开 /guide#history。线上控制台无错误，出现 4 条 Next/Vinext 链接预取 CSS 未即时使用警告，不影响页面或交互；不将其记为零警告。验收截图为 output/playwright/guide-production-{mobile,annotated}.png。

此次未修改数据库或 Nginx；两个旧站配置 SHA256 与部署前一致，kongtian.university 和 portfolio.ventsdenye.com 均 200。无功能或部署阻塞；本次收尾仅同步文档，无需重建运行包。

## 2026-10-01 创作 Markdown 导入（进行中）

论坛、校刊/部刊和事件草稿新增版本化 Markdown 导入、UTF-8 文件/粘贴入口、替换确认、严格领域校验与下载模板。论坛由服务器复核并复用本人身份，缺失身份通过单次批量 INSERT 创建；无迁移。事件公开后不整体替换节点。见 `docs/design/markdown-import.md`；图解教程新增格式与 AI 提示词。本地实现完成：lint、typecheck、Windows build 通过；26 项解析器回归、41 项真实 PostgreSQL 17 检查通过（含批量身份创建、冲突整批回滚、归属防伪）。浏览器真实组件校验三种文件导入、错误时保留内容、回复映射与节点数；390px 手机及教程无横向溢出。界面使用演示数据与替代保存边界，未对生产写入测试作品。Linux build 与 standalone 启动/Origin/中文回调冒烟通过。源码 `75e29ecc15f3ee28031fcdc17a62753ca7adc522` 已推送；runtime `4bef03f08062362ce117f4126c3bdcfc8a7097f1` 已经既有 SSH 脚本部署，current 指向匹配版本，服务 active。线上 `/guide#import` 内容、三份模板、原始截图全部 HTTP 200；真实浏览器完成图像载入与模板展开检查。无新迁移、无生产测试作品写入。当前批次完成；后续真实创作者可用自己的草稿完成首次导入保存。


## 2026-10-01 院系名称与发展沿革修订

用户确认工程学院就是机械工程学院，统一名称；计算机学院由机械工程学院分出，飞行学院由军事学院演化。创校16院系不是现有学院总数。已通过原有wiki修订RPC完成线上内容维护：16份创校院系说明更新，新增计算机与飞行学院，7份人物修订；工程学院保留原UUID及engineering地址。当前18院系、10人物，角色关联按原设定修正。

维护方案与脚本位于maintenance/20261001-college-evolution；生产内容快照与生成SQL仅本地留存并由.gitignore排除。回滚试运行及提交均28/28内容和修订快照核验通过；13个公开页面200并匹配预期名称、沿革和人物归属。源码没有页面或数据库结构变更，不需要线上构建或部署。工作区外的人物稿件、院系JSON、需求文档、知识库图表和文件包均同步。旧世界观附件与历史修订保留。

本地lint、typecheck通过。build首次因沙箱spawn EPERM失败，提升执行权限后成功生成standalone；保留现有代理环境、middleware弃用及插件耗时提示。任务完成，无待执行生产写入；后续新增学院按动态院系模型维护，不折回创校名单。


## 2026-10-12 · 论坛多图、直接引用和楼主标识

本地实现完成：多选/粘贴图片，引用卡片只显示直接目标正文和缩略图，原图弹窗/Escape/焦点返回，首楼身份楼主标签，按楼层排序。导入、编辑预览、模板、教程与真实截图同步。追加 202610120001 迁移和数据库类型，图片关联/归属/ready/RLS 保持原子保存和发布冻结。工作区基线干净，本批修改未提交；无生产数据库变更或部署。下一步为审阅本地改动后在部署批次应用迁移、构建运行包和线上验证。

最终同步后 lint、typecheck、五阶段 build 与 standalone 打包再次通过。用户询问 Supabase 迁移与服务器连接；已核对本地项目链接 ref sttghkavzjeqeuignpwi 及部署文档 root@lax01.ventsdenye.com、密钥 SSH、既有 update-runtime.sh，尚未本轮实际连通核验或执行生产迁移。


## 2026-10-12 · 线上迁移与部署完成

用户明确授权先 Git commit 后线上迁移部署。功能源码 `d906cf0e887039a7c9762f511d9f9f5fbfe45762` 已推送 deploy/backend；Linux standalone runtime `403d56d05c5010018f0b53df1c1e4796e17b9d9c` 已推送 deploy/runtime 并核对远端 ref。

Supabase sttghkavzjeqeuignpwi 原14条迁移只读核对后，在事务中追加202610120001，forum_topics/forum_messages/forum_accounts/media_assets全部行数量及完整内容MD5迁移前后一致（比较只在服务器事务内进行，无业务内容导出）；迁移记录、RLS、触发器与匿名函数禁止调用均读回验证。无重建/清空/既有内容改写。

176个本机运行输入同步至既有WSL Linux环境；五阶段构建、118包依赖补全、standalone启动及媒体同源/中文回调冒烟通过。运行包5836文件、58053056字节，无环境/凭据文件。服务器既有update-runtime.sh执行成功，current为releases/git-403d56d05c5010018f0b53df1c1e4796e17b9d9c，ktu-community active，前版git-4bef03f08062362ce117f4126c3bdcfc8a7097f1保留。

线上主页、论坛、教程、模板、楼层截图与既有真实帖子均HTTP200，新引用和楼主标识已实际读回。真实浏览器390px检查3个楼主标识、1个直接引用、无嵌套引用/横向溢出，截图output/playwright/forum-images-production-mobile.png。两个旧站均200、两个Nginx配置SHA256与部署前一致。未创建线上测试帖子或执行真实用户上传，上传/粘贴接口交互在本地桩与SQL权限测试验证；真实R2发布端到端不记为已验收。任务交付完成，本次收尾仅文档无需重建。


## 2026-10-13 · 功能测试修复

从 deploy/backend=852e952 干净工作树开始，修复 F1–F7/R1；本批变更尚未提交。用户要求 Git 管理，验证完成后允许上线。lint/typecheck/build 与 99 项真实 PostgreSQL 回归通过，浏览器验收进行中。服务器只读确认当前 runtime=403d56d，服务 active，剩余 5.6GB；未执行本批云端迁移或发布。下一步完成浏览器、Git 提交、Linux 构建、迁移部署与复验。

最终真实 RevisionBrowser SSR 专项通过：CRLF/首空行无 React 水合错误，版本切换与 390px 无溢出；带 action 的原地失败表单保留名称/摘要/正文。浏览器临时环境的问题已修正（UTF-8 与测试页面 head），不涉及产品代码。准备 Git 提交及 Linux 发布。

同类复查补充：Creator 头像表单也上报上传 busy、拦截提前保存；头像/字段改动撤回旧保存提示，失败保留输入。补充验证后再生成最终运行产物。

头像补充修复浏览器通过：上传期间按钮禁用与 requestSubmit 拦截，完成后提交含头像 ID，显示名称变化撤回旧提示；lint/typecheck 通过。线上增量迁移已事务提交，既有三表数量/指纹未改变，2 触发器/4 索引/迁移记录读回一致。源码 20b29f4 已推送；最终 Linux 产物重建中。

上传启动的同一事件也通过 ref 同步锁定，避免 React 状态提交前的 programmatic requestSubmit 窗口；真实浏览器分别对校刊、补充资料、个人头像即刻提交测试通过。最终重新构建完整 Linux 产物，不修改生成的 bundle。


## 2026-10-15 · 官网与校园站共享维基（本地验收中）

用户要求官网只读、修改跳转校园站、数据互通和官网冲突优先，并补充“其他”类别。实现与发布契约见 [shared-wiki](../design/shared-wiki.md)。追加迁移 202610150001；新增独立 wiki_articles、官网基线映射、操作员专用原子同步、匿名公开接口与官网读取/检索/回退。保留现有 UUID、人物关联和修订历史，官网工程学院对应既有 engineering 身份。

当前工作区：校园站 deploy/backend 与官网 main，变更未提交/未部署；原有官网未跟踪 output/.playwright-cli 未动。124 项隔离 PostgreSQL 检查、lint、typecheck 通过；Windows 五阶段 build 已通过，standalone 补全 121 包。浏览器与公开接口验收进行中，生产迁移及两站发布尚未执行。下一步完成桌面/390px、公开 feed 与跨站编辑跳转验证，再按先 schema/内容、校园站运行时、官网静态产物顺序发布并回读。

### 发布前核验

真实构建的公开 GET handler 使用合成 PostgREST transport 验证为 200、CORS *、22 条、5 次分页请求；浏览器使用其生成的 feed 验证 21 官网条目及 1 新增其他词条、关键词过滤、正文更新、危险 HTML/URL 清理，桌面与 390px 截图已人工审阅；修改按钮实际跳转 https://campus.kongtian.university/wiki。真实 Browser 插件未提供，按技能使用 Playwright CLI。截图在 D:/esorakodo/tmp/shared-wiki-{desktop,mobile}.png。早期预览服务连接拒绝已重新加载解决；线上尚无新接口导致的 CORS 错误在隔离 feed 验收时不再出现。

SSH 当前核验校园站运行 5cab52d、active；官网部署源 652630e。服务器实际 wiki-data.js 与本机原文标准化后完全一致。云端 ROLLBACK 演练成功：21 条变更、19 条新建/2 学院覆盖，其他学院/人物/地点内部指纹检查通过；无私有数据导出、无合成生产内容。生产正式迁移、发布和公开浏览器复验尚待执行。

### 生产交付门禁（未上线）

功能源码提交 b8ef879，官网源码提交 c5aa34f。生产正式迁移执行请求被自动审批明确拒绝：新增 schema 与导入/覆盖 21 词条属于持久生产变更，审批要求用户显式授权。已停止生产变更，不改用其他连接或工具绕过。ROLLBACK 演练已结束；正式 schema、词条内容和两站运行版本均未更改。等待用户批准：应用已审阅迁移与官网优先导入，发布校园站 Linux runtime，再发布官网静态产物。校验、发布包及本地提交可继续准备，不能据此称已上线互通。

### 待授权发布包已完成

Linux 五阶段 build 与 standalone 补全通过（121 个运行依赖包）；Linux 真实 GET handler 合成 transport 验收为 200/CORS */22 条/5 次查询。已准备本地 runtime 提交 addee4b8d9a3b30c7cede69bd7c442839973bfd5，5902 文件/58194302 bytes，扫描未包含环境文件、凭据或测试数据；官网静态 deploy 提交 c675873。所有发布提交均仅在本地，未推送/未重启服务。审批拒绝后再次只读确认生产 migration=0、wiki_articles 不存在、两学院仍为原名称与 version=2。

复现：npm run lint；npm run typecheck；npm run build；node tests/forum-wiki-database.mjs（临时本机 PostgreSQL；可选 OFFICIAL_WIKI_MANIFEST 指定官网清单）；node tools/export-wiki-canon.mjs（官网仓库）。批准后必须先执行已演练的生产迁移/导入，再按设计顺序推送源码、发布 runtime 与官网并作生产浏览器复验。尚未使用真实生产账号写入/恢复词条做端到端验收。


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

在干净的 deploy/backend=3df4a31 基线上实现官网风格动效：标题错峰、分区入场、入口反馈与校园视界展开。lint/typecheck 通过；生产构建与桌面/移动浏览器验收进行中。源码工作区未提交，线上尚未更新。 设计契约见 [campus-motion](../design/campus-motion.md)。

Windows/Linux 构建、lint/typecheck、Linux standalone 冒烟及真实数据桌面/390px/无 JS/减少动态效果复验均通过。47 条档案与校训单条筛选通过；校刊/事件目前只能验证真实空状态。准备提交源码和 artifact-only runtime，随后公开站点复验。


### 2026-10-15 · 动效已上线并完成公开复验

源码功能提交 e986aac；Linux runtime 发布 195b8576222873bf0d481691598dc9f2078f409b（产物提交 5968e2c，发布说明提交 195b857），两个分支已推送。5904 个文件/58208211 bytes 与 Linux standalone 逐个 SHA-256 一致，无多余产物、环境文件或应用测试数据。初版打包扫描误把第三方 Zod 包自带 tests 判为应用测试目录，已收窄为应用根目录/环境路径；第三方依赖按既有打包规则保留，没有改依赖。

服务器既有 /etc/ktu-community/update-runtime.sh 成功；current 指向 /srv/ktu-community/releases/git-195b8576222873bf0d481691598dc9f2078f409b，服务 active，检查时内存约 69 MiB，旧 020a810 发布目录保留可回滚。无生产数据库写入、迁移、其他站点或 Nginx 修改。

公开 https://campus.kongtian.university/ HTTP 200。独立 Playwright CLI 真实浏览器 1440×1000：正确标题和主体，无错误层/横向溢出，实际入场调用 10 次；卡片下一张切到 02/06；dialog computed animationName=campus-dialog-enter，Escape 关闭返回触发按钮。390×844 滚动后实际调用增至 16，动态启用 reduced-motion 并刷新后调用=0。校园档案导航实际 47 条，搜索校训返回 1 条，手机无溢出。最终线上这轮监听 0 console error、0 warning、0 pageerror。其他早期本机后端/开发缓存问题仅见上方过程记录，不属于最终线上结果。

线上截图 D:/esorakodo/tmp/motion-production-{desktop,mobile,filter-mobile}.png；本地无 JS、减少动态效果、四栏目导航及键盘证据沿用同一 Linux 产物验收。已查看最终截图。校刊与校史目前无公开记录，有内容列表的入场效果尚无生产数据实测；当前验证覆盖其正常空状态。

本批完成，无待发布步骤；源码提交后最终文档补充另行提交，不影响运行包。


## 2026-10-15 · 官网视觉主题

基线 39d592b 与 runtime 195b857 已保留，checkpoint/campus-before-official-theme-20261015 已推送。新主题只改根布局和主题 CSS，设计见 official-campus-theme；首页桌面/390px 初步外观检查无横向溢出，lint/typecheck 通过。调整次级色为官网 #4F6A80，确保淡紫背景上正文对比度 4.64:1；先前构建在检查后中止，最终产物必须重建。尚未上线。 详见 [official-campus-theme](../design/official-campus-theme.md)。

Windows/Linux 最终构建、lint/typecheck、真实产物桌面/390px/无 JS/减少动态效果、目录筛选、轮播、dialog/焦点返回均通过，截图已查看。准备源码和运行包提交；线上尚未更新。


### 官网主题已上线 · 2026-10-15

源码功能提交 80309f8，已推送独立 design/official-campus-theme，并以 fast-forward 更新 deploy/backend。改版前源码 39d592b 的 annotated tag checkpoint/campus-before-official-theme-20261015 已推送远端。Linux runtime 为 ab0f844674a4e5e40ffc7ad738cc7895f2ac80d4，5904 文件/58228930 bytes 逐个 SHA-256 与构建一致，无多余文件、环境文件或应用测试数据。

既有 update-runtime.sh 执行成功，服务器 current 指向 /srv/ktu-community/releases/git-ab0f844674a4e5e40ffc7ad738cc7895f2ac80d4，服务 active，检查时内存约 89 MiB。旧 runtime 195b857 仍在 releases 中可回滚；无数据库、Nginx、其他站点或运行依赖变更。

公开 HTTPS 浏览器真实复验：1440×1000 首页 HTTP 200、SSR 主题类存在、主按钮 #123B5A 和 8px、卡片 18px、展台 28px；无空白、框架错误层或横向溢出。四栏目客户端跳转标题与新主题保持一致，按钮均为 8px。轮播 01/06 → 02/06；dialog 为 28px、居中，Tab/Escape/焦点返回通过。本轮桌面监听 0 console error/warning、0 pageerror。

390×844 手机实际无溢出，展台 22px；47 条档案筛选校训得到 1 条，输入框 8px；减少动态效果时新增入场=0、隐藏目标=0、自动轮播停用。中文登录错误提示、28px 认证面板和 8px 输入框正常；独立无 JS 浏览器仍显示校训和新主题。较早本地会话累计出现 3 条路由 CSS 预加载未使用警告，不影响交互，未将它描述成整个会话零警告。

最终截图 D:/esorakodo/tmp/theme-production-{desktop,full,wiki,dialog,mobile,filter-mobile,login-mobile}.png 已查看并对照官网参考；可见圆角、背景、边框、按钮和纸张层次已经对齐。保留真实内容与上一批动效。校刊/事件有内容列表和登录后的 Creator 写入仍未在生产实测，本次只验证真实空状态及公开阅读/表单呈现。

本批已交付，无待发布步骤。最后仅同步本文档，不需要重建运行包。


## 2026-10-17 · 自然式论坛创作（本地完成，未上线）

需求 KTU-FORUM-NATURAL：首帖优先、成品样式内创作；点击消息弹出回复/编辑/删除/反应数/设为楼主/向上插楼/身份选择。回复追加末尾并直接引用；默认生成可修改昵称与头像；首楼禁止删除或向上插入；底部常驻发言输入。沿用原子草稿保存、权限与发布冻结，无 schema 变更。设计见 [自然式创作](../design/forum-natural-authoring.md)。基线 deploy/backend=27b2e1b，初始工作树干净；本批改动保留在未提交工作区，未推送、未部署。验收使用实际组件配隔离 action/media 桩，见 engineering/verification.md（本目录使用 verification.md）。

最终本地验收完成：lint/typecheck/build、11项新增回归、32项解析检查、124项隔离PostgreSQL检查和59项浏览器断言通过。真实standalone教程与匿名登录保护复验通过。浏览器写入使用隔离action/media桩，真实账号/R2/线上发布尚未验收。证据详见 verification.md 最新记录；本批工作区未提交、未部署。


## 2026-10-17 · 发布后改写与实时协作（本地完成，未上线）

用户已确认：范围先落实当前论坛体；已发布作品可重新编辑，有效改动及时同步公开阅读页；作者按创作者@账号增删协作者，协作者可共同编辑，作者保留首次发布与成员管理权限。前端明确使用 frontend-design skill，保留自然回帖，新增轻量在线成员/正在编辑位置/同步状态及作者管理面板。实现采用 Yjs 文本/结构合并、认证HTTP增量写入和SSE通知，编辑状态与公开关系表分开。本批重新执行迁移、权限、并发、撤权与浏览器验收，实际证据见 engineering/verification.md。

实现、教程与本地验收已完成；未提交、未推送、未上线。新契约取代前一节发布冻结和手动保存说明。详见 [forum-collaboration](../design/forum-collaboration.md) 与 verification.md。Yjs 合并通过认证 HTTP+SSE；仅作者首次发布/管理成员，协作者有效改写直接公开。新增迁移文件为 202610170001_forum_collaboration.sql（迁移总数18），新增 yjs 依赖。

最终静态检查、构建、19单元、31新增数据库、124既有数据库、21编辑器浏览器断言与standalone教程/匿名保护均通过。额外整站渲染7项为4通过3失败，远程公开读取错误边界，诊断出现UND_ERR_SOCKET；尚需网络可用时补验。真实Supabase身份/R2/生产SSE尚未验收。详见verification.md。


## 2026-10-17 · 论坛自然创作与协作发布

用户明确要求“继续，上线”，授权本批源码、运行包和协作迁移交付。已核对线上当前runtime ab0f844、源码27b2e1b，采用原有artifact-only更新脚本；不在服务器构建。云端17条旧迁移与本地吻合，32张既有表计数/指纹及6个被替换函数定义留存在Git忽略的output/forum-collab-release。新增迁移在目标云库事务演练后ROLLBACK成功，正式应用与Linux发布构建进行中。


## 2026-10-17 · 论坛自然创作与实时协作已上线

用户明确授权上线及2个临时Auth账号的创建/验收后清理。功能源码2db0eda已推送deploy/backend；运行包8175c71e425281322d1227040cd056b6269d0741已推送deploy/runtime，并通过既有update-runtime.sh上线。追加迁移202610170001和202610170002均已云端事务演练/正式应用，云迁移总数19。旧runtime ab0f844保留回滚，Nginx和其他网站未改动。

真实HTTPS双账号14项、匿名公开页5项均通过：首帖/默认身份、按Creator handle邀请、作者首次发布、发布后重返编辑、同楼并发合并、已打开匿名阅读页自动更新、新回复、390px布局、移除后立即锁定与403、匿名私有状态401、刷新后改写保留。并发SQLSTATE修复后量测两次提交2079/2777ms、双方3932ms收敛。首次40001超时和验收工具HTTP直连超时均保留证据；后者改用浏览器fetch后通过。首轮401/403是刻意权限检查，未描述全会话零错误。

生产验收临时帖子/楼层/论坛身份/共享文档及2个Auth账号已删除；最终临时Auth/Profiles/Topics/Accounts计数均0，服务器和本地临时凭据文件已删除、本机凭据夹具服务已停止。原32张表在迁移事务中指纹不变；验收后29张整表仍一致，3张论坛表存在期间新增的非临时账号内容，按审计前created_at核对原有行数量/指纹均与发布前一致，未删除这些新增正式内容。

运行包实际Git发布清单6872文件/67931094字节，服务器逐个SHA256一致、0额外文件；本地供应包另有lib0/.claude/settings.local.json被Git忽略，未发布，验证清单已按实际Git内容生成。Linux五阶段编译完成；Windows挂载I/O拖慢重复Linux lint及依赖复制，停止重复静态检查（同源Windows lint/typecheck通过），用Windows文件接口完整复制Linux依赖124包；Linux本地磁盘启动/媒体同源/中文回调冒烟通过。第一次挂载盘冷启动30秒阈值超时，改为Linux本地临时磁盘后通过。该批不重新构建JS的SQLSTATE追加修复经32项数据库（含P0001断言）、124项既有数据库回归通过；最终lint通过。运行包未包含环境文件、凭据或本地测试数据。

截图D:/esorakodo/tmp/forum-collaboration-production-mobile.png已目视复核，生产教程五张新图全部decode成功；公网/forum、/wiki及匿名创作跳转通过。本轮没有真实R2图片上传或邮件注册测试，不能将既有媒体/邮件部署证据当作本轮新验收。此前本地“未上线”说明均为阶段历史，当前无待部署或测试清理步骤。

## 2026-10-17 · 角色创建本地完成

基线 deploy/backend=a319f0a，初始干净；本批仅修改本项目及其捏脸副本，原 campus-card-activity 与官网未改动。使用 frontend-design 形成设计简报，实际实现见 ../design/character-creation.md。用户后续要求已落实：每题可跳过；所有创建弹窗居中；校园卡不写学院，仅姓名/学号。已通过 lint/typecheck/build、3项模型测试、18项数据库/真实Action测试，以及实际 /create/character 的桌面/390px、首页入口、全跳过/下载、照片/捏脸/恢复、焦点/减少动效验收。本地作者夹具另证明失败重试复用2张上传图、只生成1个档案和修订、再次创建/重新开始不删除已存档人物。

学院/人物远程读取在本机仍失败，实际页面已验证降级；正向学院/轮播/保存流程使用本地隔离夹具，不能宣称生产数据源、真实 Supabase 登录或 R2 上传已验收。已记录夹具冷启动与脚本等待问题；修正后交互通过。源码以本批 Git 提交留存，未推送/未部署；下一步是生产迁移演练、Linux运行包和真实HTTPS创作验收。

## 2026-10-17 · 首页精简本地完成

基线af2f4bf，起始工作树干净、deploy/backend领先origin1个提交。按用户要求将首页从6区精简成官网式单开屏，以原校徽/人物群像及宋体大校名识别空天；删除装饰小字、资讯叠层和轮播，放大两个创作入口。官网资源只读取并复制，原站未改动。首页不再等待远程资讯读取。

本地1440/1280、390/320、两个真实入口、键盘顺序/可见焦点、减少动效、匿名论坛next返回已验证。既有SSR首页测试1/1通过，lint/typecheck通过，构建五阶段/standalone依赖补全通过。最后移动图构图与导航下划线微调纳入最终构建。本批提交留在本地，尚未推送/部署；此前角色创建提交也仍未上线。

## 2026-10-17 · 上线前保留资讯堆叠

用户明确要求保留资讯堆叠；维持官网式主视觉与两个大创作入口，在下方恢复既有真实资讯轮播，仅保留“校园近况”、内容类别/标题/摘要/日期/链接和切换控件，移除装饰性英文/角落小字。复用既有暂停、焦点、减少动效与空/失败降级。角色创建迁移生产事务演练已回滚通过，37张既有表指纹未变；正式部署及新UI验证继续进行，尚不能认定新批次已上线。

本次最终产物实测1440/390px无横向溢出，资讯手动切换与减少动效通过；320px曾发现旋转后层越界4px，增加窄屏叠层内距后重建复验。所有新建页面遵循原官网风格已同步AGENTS.md；角色创建页沿用既有浅空、海蓝与宋体。临时真实账号已获授权创建，尚待生产建档和清理。

## 2026-10-17 · 角色创建与首页调整已上线

部署源码 c2fc8362168cceb143346508fe1e96affb7eb7ff，Linux运行包 59bd4de5952fc532a89e969f3a803798ec7b48c1；deploy/backend及deploy/runtime均已推送。由本机WSL完成最终lint/typecheck/build及standalone启动、媒体同源、中文回调冒烟，通过既有update-runtime.sh原子切换；服务active，逐个SHA256核对7038个Git文件、96998022字节、0额外文件。前版8175c71保留供回滚，官网及其他站点未修改。

首页保留官网校徽/群像与大创作入口，并按用户最新决定恢复单一校园资讯堆叠，删除装饰英文及边角小字。公网1440/390/320px均无横向溢出，入口分别246×88、165×72、280×64；手动切换、暂停、减少动效通过。所有新建网页遵循原空天大学官网风格已写入AGENTS.md。

迁移202610170003先事务演练回滚再正式应用；两次均核对37张既有表数量与内容指纹不变。公网五题全跳过、18学院读取、居中学生证1016×638、校园卡仅姓名/学号、登录后草稿恢复、原捏脸部件/发色应用、真实图片选择、现有能力示例切换均通过。真实Creator成功执行两次媒体upload/complete，创建1 Student、1角色卡关联、1初始Revision；匿名卡图decode及GET200 image/png 262537字节，390px档案无溢出。

唯一临时账号经本轮用户明确授权、不发邮件；验收后两张R2对象DELETE并签名HEAD404，精确删除临时档案/卡片/修订/媒体，再删除Auth及凭据文件。最终Auth/Profiles/Students/Cards/Revisions/Media均0，迁移记录1；公开测试图片404，首页无临时角色。临时本机凭据夹具已停，文件清除。


## 2026-10-17 · 资讯堆叠首屏定位修正

用户通过圈图明确将资讯堆叠放在首屏右侧，替换群像，取消下方重复资讯区。保持左侧校徽、校名、校训与大创作入口；手机依序排版。此项正在构建和复验，上一批角色真实Auth/R2及清理结果继续有效，无需再创建验收账号。
