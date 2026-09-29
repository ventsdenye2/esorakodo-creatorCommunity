# 空天大学共创平台工程路线图

本文档是项目从当前 M1 基础继续开发到 M7 的统一入口。产品定义以 `KTU_CoCreation_Platform_Design_v0.1.docx` 为准；工程约束以仓库根目录 `AGENTS.md` 为准；需求、设计和任务追踪分别见 `engineering/RAS.md`、`engineering/RDS.md` 与 `engineering/DPS.md`。

## 当前结论 · 全前后端实现批次

用户已将范围扩展为 M0–M7，之后微调、部署。完整实施契约见 `design/full-platform.md`；下方分阶段摘要保留为里程碑定义，不能据其旧待办推断当前未实现。当前工作树尚未提交，也未部署。

| 里程碑 | 当前交付 | 验收边界 |
| --- | --- | --- |
| M0 工程 | App Router / Vinext、TypeScript、Node standalone | 本机构建；线上宿主待验 |
| M1 账户 | Auth、Creator、资料/头像、SSR 会话刷新 | 本地 Auth；真实 SMTP 待验 |
| M2 Wiki | 三类实体、UUID 引用、原子修订/冲突/回滚 | DB 与主要浏览器路径通过 |
| M3 论坛 | 多身份楼层、原子保存、实体引用、预览/发布 | 事务/权限、草稿恢复已验；最终控件见 verification |
| M4 校刊 | 正文块、固定标签、图片、引用、草稿/预览/发布 | 数据库发布约束通过；浏览器新测试文章发布待许可 |
| M5 事件 | 主档案、时间线、筛选、独立补充 | 双用户、冲突、移动端及事务验证 |
| M6 媒体与运营 | 私有上传、头像、评论/点赞/收藏、举报审阅、隐藏/恢复审计 | 本地 MinIO 及 RLS 通过；真实 R2/CORS 待验 |
| M7 搜索与完善 | 中文分组搜索、首页真实内容、卡片堆、UUID 反向作品关联 | 小数据集实测；线上规模性能待验 |

全库 187/187 pgTAP 通过。最终 lint/typecheck/build、SSR、会话和浏览器逐项证据见 `engineering/verification.md`，媒体专项见 `engineering/media-verification.md`。3D 校园和坐标绑定没有实际资产，本批不虚构交付。

## 发布门禁

微调后依据 `deploy/release-checklist.md` 完成线上迁移比对、SMTP、私有 R2/CORS、管理员 UUID 授权、Ubuntu、DNS/TLS 与 HTTPS 端到端验收。CC BY-SA 4.0 许可方式尚待用户决定，不对现有作品自动施加开放许可。

## 依赖顺序

```text
M1 真实环境验收
  └─ M2 Wiki 原子修订与实体链接
       └─ M3 论坛发布闭环
            ├─ M4 校刊与部刊
            │    └─ M5 事件专题与补充
            └─ M6 媒体与运营（依赖稳定作品模型）
                  └─ M7 搜索、推荐与体验收敛
```

M2 和 M3 是架构验证核心，不应被媒体上传、复杂富文本、积分、私信或推荐算法打断。M4 与 M5 可以复用同一套作品状态、实体引用和发布约束，但保持不同的页面结构与领域表。

## Living Campus v2 前端轨道（首批已实施）

`docs/design/homepage-concept-v1.md` 保留旧基线，`docs/design/living-campus-v2.md` 指导后续改版，`docs/design/living-campus-implementation.md` 记录首批实际交付。轻量沙盘 Hero 与可访问的 Campus Layer 已验；首页各媒介已接入真实数据，Campus Trace 展示实际事件关联；渐进增强的 Entity Peek 和正式 3D 空间仍未实现。

首版空间预览使用轻量 SVG/CSS 与已确认或标注为演示的地点；完整 3D 模型、Three.js、空间事件回放留给真实资产和数据契约到位后的独立阶段。这个前端轨道可与 M3 数据库和服务端工作按文件边界并行，但集成时必须核对 Forum Account、Wiki、发布权限和跨媒介实体链接。公开测试版的账户、Wiki、论坛闭环仍须完成真实服务与浏览器验收。

## 分阶段实施摘要

### M1 收尾

1. 建立独立 Supabase 开发项目，配置本地 Auth 回调地址。
2. 通过 CLI 应用 Git 中的 migration，生成并提交数据库类型。
3. 增加 Auth trigger、Profile 所有权和基础 RLS 的数据库集成测试。
4. 在真实会话中验收注册、邮箱确认、登录、退出与受保护 Creator 页面。
5. 记录开发库与生产库的迁移流程，不在 Dashboard 留下未进入 Git 的结构变更。

### M2 Wiki 基础

1. 明确 Student、College、Place 的第一版可编辑字段与 slug 规则。
2. 新增原子数据库函数：更新实体与写入 Revision 必须在同一事务完成。
3. 实现目录、详情、创建、编辑、历史和回滚；路由只负责装配。
4. 建立统一 `EntityLink`，所有跨实体关系使用 UUID，不按显示名连接。
5. 增加并发修改保护、输入校验、RLS/函数权限测试和空状态。
6. 完成一次前端设计小循环：设计简报、令牌、线框、自我批评、实现、桌面/移动截图与键盘检查。

### M3 校园论坛

1. 新增 Topic、Message、Hashtag 与关联表；楼层顺序使用数据库约束。
2. Topic 由单一 Creator 拥有，Topic Creator 才能编辑楼层与发布。
3. 编辑器第一版只支持安全、结构化的论坛楼层内容，不提前引入复杂富文本。
4. Forum Account 可关联 Student，也可以是未知、组织或 Bot。
5. 发布后形成真实可浏览的论坛作品；戏内楼层和现实 Creator 评论保持领域分离。
6. 跑通产品基线定义的第一条垂直切片，并保留权限与导航证据。

### M4 校刊与部刊

1. 在实现前确认正文编辑器与 JSON schema；通过适配层隔离具体编辑器库。
2. 新增 Article、Tag、ArticleTag 与实体引用；稳定标签数量由数据库和服务端共同限制。
3. 支持草稿、预览、发布和只读详情；媒体先使用占位引用，真实上传留到 M6。
4. 正文中的人物、学院、地点与事件引用保存稳定 ID，并进入 Wiki 反向关系。

### M5 事件专题

1. 新增 Event、Timeline Node、Event Supplement 与结构化实体关联。
2. Event 主档案只有一个维护 Creator；其他 Creator 只能创建自己的 Supplement。
3. Supplement 可选择关联时间节点，并保留“事实补充、人物视角、传闻、不同观点”等性质。
4. 事件详情以档案和时间线为核心，不复用论坛或文章卡片布局。

### M6 媒体与运营

1. 在实施前确认管理员授权来源、举报处置流程和可见性规则。
2. 接入 Cloudflare R2 presigned PUT；密钥与 service role 只存在服务端。
3. 新增 media_assets、作品媒体关联、reports、moderation_actions 与必要索引/RLS。
4. 校验 MIME、大小、数量和 object key；隐藏内容不做不可恢复的物理删除。
5. 后续缩略图、转码、EXIF 清理和自动审核保持为异步扩展，不阻塞第一版。

### M7 搜索与体验收敛

1. 先用真实内容样本定义搜索用例、相关性和性能预算，再决定 PGroonga 启用范围。
2. 搜索结果按 Student、College、Place、Event、作品和 Forum Account 分组，避免同名歧义。
3. 关系推荐只使用可解释的实体链接与时间关系，不提前引入不透明推荐系统。
4. 首页从静态示例切换为可策展内容，并明确空数据与失败状态。
5. 统一完成视觉系统收敛、无障碍、响应式、性能和跨媒介差异验收。

## 质量门禁

每个里程碑只有在以下证据齐全后才能标记为“已验证”：

- 对应需求 ID、设计决策和任务状态已同步更新。
- schema、RLS、函数与索引通过 migration 进入 Git。
- 新客户端可访问表具有 grants、RLS、外键索引和所有权说明。
- Server Action/Route Handler 对输入进行服务端校验，界面隐藏不作为权限证据。
- `npm run lint`、`npm run typecheck`、`npm run build` 通过。
- 数据库里程碑通过真实或本地 Supabase 集成测试；无数据库环境时不得标记为已验证。
- 新 UI 完成 frontend-design 设计简报、桌面/移动截图、键盘焦点、错误/空/加载状态检查。
- 关键用户路径有浏览器级验证；静态构建通过不替代真实 Auth、RLS、R2 或搜索验证。
- README、路线图、DPS、progress 和必要的运行说明保持同步。

## 决策门

以下问题不会阻塞 M1 收尾与 M2 核心数据链路，但必须在对应里程碑开始前由产品所有者确认：

| 决策 | 最晚确认时间 | 若未确认的处理 |
| --- | --- | --- |
| Wiki 第一版字段和哪些字段允许共同编辑 | M2 创建表单前 | 只实现基线已有字段，不新增复杂档案字段 |
| Wiki 冲突处理采用乐观锁提示还是自动合并 | M2 编辑实现前 | 默认采用 `updated_at/version` 乐观锁并要求用户重新加载 |
| 校刊正文编辑器及允许的内容块 | M4 设计前 | 不选型、不写入不可迁移的正文格式 |
| 管理员身份来源与举报处置角色 | M6 migration 前 | 不开放管理写操作 |
| 首次上线是邀请制测试还是公开注册 | 发布准备前 | 按开发环境验收，不宣称生产就绪 |

## 计划维护规则

- `engineering/RAS.md` 保存稳定需求与验收标准；需求改变时先更新 RAS。
- `engineering/RDS.md` 保存所有权、契约、数据流、状态和修改围栏；架构改变时先更新 RDS。
- `engineering/DPS.md` 是唯一任务状态表；开始、阻塞和验证时更新状态与证据入口。
- `engineering/progress.md` 是断点续作入口；每个独立阶段结束时记录当前提交、检查结果、阻塞和下一步。
- `M0-M1-PLAN.md` 保留为早期阶段记录，不再承担 M2–M7 的状态管理。

## 2026-09-23 · 首页视觉增量

KTU-UX-CAMPUS-VIEW 本地完成：首页大学官网口吻、最新公开内容卡片堆、移动／键盘／暂停支持。设计见 `design/campus-view-stack.md`，验证与边界见 `engineering/verification.md`。无迁移、未部署，不改变 M4/M5 进度。

## 2026-09-28 · lax01 部署准备

用户授权本机SSH密钥连接ventsdenye及root@lax01.ventsdenye.com；保留现有Supabase项目，不干扰其他网站。已只读核对原站/端口/Nginx，并安装独立Node22.23.3、ktu系统用户与本项目空目录，未启用应用或代理。采用deploy/lax01独立配置：回环3107、版本目录、受限HTTPS预览及注册开关。现有主站与作品集配置hash和200基线保存在deploy/lax01/README.md。

下一步需要用户本机Supabase CLI登录与项目用途确认，然后只读云schema/迁移/备份审计。R2与SMTP尚未配置，具体用户操作见该README；没有迁移云库或公开应用。Cloudflare域名已解析到代理IP（旧NXDOMAIN记录已过时），源站配置仍待核实。

## 2026-09-28 · 受限测试站已部署

用户确认root密钥SSH与独立Supabase用途，授权部署；补充约束为服务器只保留必要内容。云项目原public无表/类型、auth.users=0，保留rls_auto_enable函数。output/deploy-20260928/cloud-public-before.sql保存迁移前结构（Git忽略）；13个本仓库迁移已全部应用，复核29张表全部RLS、13条迁移记录、Auth用户仍0。

云公开参数在Linux专用release构建，lint/typecheck/build通过（构建内存峰值856.7MB，限额1100MB/50%CPU）；注册开关standalone测试本机1/1通过。此次本机旧SSR回归4/7，因本地Supabase停服，未掩盖失败；不能沿用9月24日7/7声称本批全绿。云产物通过真实回环smoke：主页/登录/论坛/Wiki/图片200，无效登录303。

原站配置hash不变，kongtian.university与portfolio.ventsdenye.com仍200。新增campus专用Nginx vhost，nginx -t通过后reload，未restart旧服务。证书有效期至2026-12-27。通过Cloudflare访问匿名401、Basic Auth授权200，禁止缓存/索引。访问密码只保存在服务器root可读的/etc/ktu-community/preview-access.txt；本机没有输出其值。应用KTU_REGISTRATION_ENABLED=false，云Auth注册设置尚需单独核实/关闭，不能宣称此开关封住Supabase直接API。

用户要求轻量运行后精确清理本项目源码/完整node_modules/npm缓存/上传包，保留dist/standalone64MB和私有Node二进制121MB，配置约44KB；服务器磁盘回到8.8GB已用/11GB可用，应用内存约52MB。清理后只重启ktu-community，回环复验正常。服务器无源码Git checkout；本地deploy/backend分支用于代码与配置追踪，后续本机/CI构建+artifact更新。不要声称已实现服务器git pull产物流程。

当前可访问：https://campus.kongtian.university/（受限预览）。真实R2/SMTP/注册确认/首位Creator和管理员仍待配置，未创建云测试账号或作品、未发布合成内容。操作步骤见deploy/lax01/README.md。应用目录/srv/ktu-community/current -> releases/20260928-01，专用服务ktu-community，回环3107。


## 2026-09-29 · 论坛树状创作与 Markdown 档案

用户确认：论坛 👍 / ？仅为创作者设置的剧情数据，读者端展示；修订采用线性历史、两版差异、恢复新版本，不做分支合并。补充确认所有论坛身份（包括学生类型）均可不关联人物档案创建。详情见 docs/design/forum-wiki-reading.md。

实现：阅读/编辑共用 ThreadTree，保留楼层编号、父节点链接、分支折叠、原位添加回复、上下移动、计数输入和阅读预览。档案在摘要外新增 50000 字 Markdown 正文，GFM 安全渲染与格式工具栏，历史显示版本、作者、提交说明、快照、行差异；超长差异有时间上限并退化为整段增删。追加迁移 202609290001，旧数据计数默认 0、旧快照缺 body 恢复为空；解除 student_accounts_require_student，FK、所有权和 RLS 保留。

验证完成：最终 lint、typecheck、Windows build 与 Linux 五阶段 build 全部通过。隔离 PostgreSQL 17 原样执行全部 14 个迁移，38 项域表/RPC/RLS 检查通过；Auth 请求声明使用测试函数复现，不等同完整 Supabase Auth/API 验收。浏览器组件覆盖创作交互、序列化、安全 Markdown 和修订恢复表单；action 边界为桩，保存事务另由 SQL 覆盖。云端迁移、推送、SSH 发布和线上真实内容读取验证均完成；没有创建线上测试作品，未声称真实登录发布端到端验收。

交付完成：deploy/backend 源码、deploy/runtime Linux standalone，服务器通过 /etc/ktu-community/update-runtime.sh 浅 fetch/archive 并切换 current，仅重启 ktu-community。功能源码为 72210ce853c6f81abf74e91e32da1c073d653b3c，线上产物为 94bd025a50f2ce48e1e1c5e24a3977cd52b6669a；后续提交仅同步交付文档。追加迁移 202609290001 已应用，六张受影响表原字段数量/指纹事务内一致。原运行版本 116d827 保留用于回滚。测试工具/数据库/截图在 Git 忽略的 output；没有导出云端业务数据。
