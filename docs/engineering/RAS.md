# KTU 平台需求分析 RAS

## 目标

在不提前实现复杂业务的前提下，把空天大学共创平台从当前 M1 代码基础推进到可持续演进的完整产品骨架。系统必须证明三类身份、三类创作媒介和 Wiki 共识层能够在同一套权限与实体关系中工作，同时保留未来替换视觉、编辑器、对象存储处理和搜索实现的空间。

## 核心用户场景

1. 现实 Creator 注册、登录并管理自己的资料与作品。
2. Creator 创建 Student、College、Place 等世界实体，所有 Wiki 修改可追溯和回滚。
3. Creator 创建多个 Forum Account，用它们编排一篇完整论坛体作品。
4. 读者从作品中的实体链接进入 Wiki，再沿事件、论坛账号和其他作品继续探索。
5. Creator 发布校刊文章、事件主档案或事件补充，并保留真实署名、许可和权限边界。
6. 管理员在不破坏审计记录的前提下处理举报和隐藏内容。

## 范围

- Next.js App Router 兼容应用、TypeScript strict、Supabase PostgreSQL/Auth/RLS。
- Creator/Profile、Student、College、Place、Forum Account 及其关系。
- Wiki Revision、Forum、Article、Event、Timeline、Supplement、Entity Link。
- Cloudflare R2 媒体直传与 PostgreSQL 元数据。
- 中文搜索、关系浏览、基础运营和可访问的响应式 UI。
- 可复现 migration、数据库权限测试、应用测试、构建和运行文档。

## 非目标

- M3 以前不实现复杂富文本、媒体处理、积分、私信或推荐算法。
- 不建立独立通用后端、微服务或“万能 Entity + JSON”数据层。
- 不把 Forum、Press、Event 强制做成同一种帖子模型或同一种页面布局。
- 不在本路线图中锁定最终美术稿；视觉通过令牌和语义组件保持可替换。
- 不把按钮隐藏、客户端校验或静态测试当作权限与真实服务验收。

## 需求与验收标准

| 需求 ID | 行为 | 可观察验收标准 | 来源 |
| --- | --- | --- | --- |
| KTU-FND-001 | 项目保持 App Router、TypeScript strict 和薄路由结构 | 新功能位于明确的组件、feature、lib 或 type 所有者中；构建与类型检查通过 | 产品基线 11、17；AGENTS |
| KTU-FND-002 | 数据库结构可复现 | schema、函数、索引、grants 和 RLS 全部来自 Git migration；开发库可从空库重建 | 产品基线 19.1 |
| KTU-FND-003 | 所有关键关系使用稳定 UUID | 重命名显示名称后关系与反向链接仍正确 | 产品基线 5、13 |
| KTU-AUTH-001 | 陌生用户可注册、确认邮箱、登录和退出 | 真实 Supabase 开发项目中完整 Auth 流程通过 | 产品基线 18.2 |
| KTU-AUTH-002 | Auth 用户拥有 Creator Profile | 新用户 trigger 创建唯一 Profile；受保护页面可服务端读取会话 | 产品基线 2.1、18.2 |
| KTU-AUTH-003 | 浏览器不获得服务端密钥 | 构建产物和 HTML 不含 service role；敏感操作只在服务端 | 产品基线 14、15 |
| KTU-WIKI-001 | Creator 可创建 Student、College、Place | 创建后可访问稳定详情 URL；重复 slug 返回明确错误 | 产品基线 5、18.2 |
| KTU-WIKI-002 | Wiki 修改始终产生 Revision | 实体更新和 revision 写入在同一事务成功或失败，不存在无历史覆盖 | 产品基线 6 |
| KTU-WIKI-003 | Wiki 历史可查看和回滚 | 用户可查看编辑者、时间、摘要和快照；回滚本身产生新 Revision | 产品基线 6.2 |
| KTU-WIKI-004 | Wiki 支持并发保护 | 陈旧编辑不会静默覆盖较新版本；界面给出可恢复提示 | 工程完整性 |
| KTU-LINK-001 | 页面统一渲染可点击实体链接 | Student、College、Place、Event 的链接按类型解析到稳定路由 | 产品基线 8.2、13 |
| KTU-LINK-002 | Wiki 自动显示反向历史 | 与作品/事件建立的结构化关联能在实体详情查询展示 | 产品基线 5.4、18.2 |
| KTU-FORUM-001 | 一个 Creator 可创建多个 Forum Account | 账号可选关联 Student，或保持 unknown/organization/bot | 产品基线 2.3 |
| KTU-FORUM-002 | Creator 可编排完整 Forum Topic | Topic 包含有序楼层，每层选择本人创建的 Forum Account | 产品基线 3.1 |
| KTU-FORUM-003 | 论坛作品支持草稿与发布 | 草稿仅作者可见；published 可公开读取；发布时间可追溯 | 产品基线 10.2、14 |
| KTU-FORUM-004 | Forum Topic 权限由服务端和 RLS 双重执行 | Creator A 无法读 B 的草稿或修改 B 的 Topic/Message | 产品基线 14、18.2 |
| KTU-FORUM-005 | 论坛自由标签可创建和浏览 | 标签规范化且唯一；Topic 可关联多个标签并按标签查询 | 产品基线 7.1 |
| KTU-PRESS-001 | Creator 可创建和发布 Article | 支持草稿、预览、发布和只读详情，真实作者明确 | 产品基线 3.2 |
| KTU-PRESS-002 | Article 使用有限稳定标签 | 标签来自受控集合，每篇数量限制在服务端与数据库可验证 | 产品基线 3.2、7.1 |
| KTU-PRESS-003 | Article 正文可保存结构化实体引用 | 显示文字变化不破坏实体 UUID 关系；未知节点被拒绝或安全降级 | 产品基线 13 |
| KTU-EVENT-001 | Creator 可维护 Event 主档案和 Timeline | Event 具有概要、时间范围、节点、前因、结果和实体关联 | 产品基线 3.3 |
| KTU-EVENT-002 | 主档案只有一个维护 Creator | 非维护者不能修改核心字段或 Timeline | 产品基线 4.1、14 |
| KTU-EVENT-003 | 其他 Creator 可创建自己的 Supplement | Supplement 可关联 Event 或 Timeline Node，并保持独立所有权 | 产品基线 4 |
| KTU-MEDIA-001 | 浏览器通过短时效 URL 直传 R2 | R2 凭据不进入浏览器；服务端校验类型、大小和数量 | 产品基线 15 |
| KTU-MEDIA-002 | 数据库存储媒体元数据而非二进制 | media_assets 使用随机 object_key，并能关联作品和排序 | 产品基线 12、15 |
| KTU-MOD-001 | 用户可举报，管理员可隐藏并审计 | 举报、处置原因、操作者和时间可查询；隐藏不删除历史 | 产品基线 10.2 |
| KTU-SEARCH-001 | 用户可按类型搜索校园内容 | 标题、名称、昵称和 Hashtag 第一阶段可查；结果按实体类型分组 | 产品基线 7.2 |
| KTU-SEARCH-002 | 中文全文检索有启用依据 | 在真实语料上记录相关性样例、索引大小和查询延迟后再启用 PGroonga | 产品基线 7.2、16.2 |
| KTU-UX-001 | 三种媒介保留不同信息结构 | Forum、Press、Event 页面在内容层级和交互上可辨识，不退化为统一 Dashboard/Card 流 | 产品基线 3、9 |
| KTU-UX-002 | UI 美观、实用、可访问且可替换 | 新 UI 有 frontend-design 简报；桌面/移动、键盘、焦点、减弱动画、空/错/载状态通过检查 | 用户要求；AGENTS |
| KTU-OPS-001 | 开发者可从文档恢复工作 | README、ROADMAP、DPS 和 progress 指向一致，未验证项明确 | 用户要求；AET |

## 第一阶段系统验收

第一阶段完成不仅是页面存在，而是以下链路在同一个开发环境中全部可观察：

1. 新用户完成注册、邮箱确认和登录。
2. Profile trigger 正常，Creator 页面服务端读取会话。
3. Creator 创建 Student，并通过原子写入留下首个 Revision。
4. Creator 创建关联该 Student 的 Forum Account，再创建一个未关联账号。
5. Creator 使用两个账号创建、预览并发布 Forum Topic。
6. 读者从楼层头像进入 Forum Account，再进入 Student Wiki。
7. Student Wiki 自动显示与 Topic 的反向关系。
8. 第二个 Creator 无法修改第一个 Creator 的 Topic；Wiki 修改产生独立 Revision。

## 待确认问题

| 问题 | 影响 | 处理方式 |
| --- | --- | --- |
| Wiki 第一版的最终字段清单 | M2 表单和快照 schema | 在 M2 UI 开始前确认；此前只使用现有基线字段 |
| Wiki 并发冲突是否允许自动合并 | 编辑体验与数据风险 | 默认只设计乐观锁，不自动合并 |
| 校刊正文允许哪些内容块 | 编辑器选型和长期 JSON 兼容 | M4 前由真实创作样例驱动选型 |
| 管理员身份如何授予和撤销 | RLS 与审计模型 | M6 前确认，不用硬编码邮箱 |
| 首次上线范围与注册策略 | 审核、容量和发布门槛 | 发布准备前确认；当前只承诺开发环境 |

## 2026-09-23 首页视觉批次 · KTU-UX-CAMPUS-VIEW

- 首页文案遵循大学官方网站口吻，避免在首页用“共创”“虚构”“共同书写”描述产品；Creator、Student、Forum Account 在实际创作流程的身份边界保持完整。
- CAMPUS VIEW 默认展示最新公开内容并自动切换。无内容用导览，未发布内容不得伪装为已发布。移动端、键盘、暂停及减少动态效果均须支持。

## 2026-09-23 全平台范围扩展

按用户本轮要求实施M4–M7，旧“仅账户/Wiki/论坛首发”的限制不再作为开发围栏。增加独立作品讨论、点赞、私有收藏和公开作者主页/个人资料管理，以完成基线2.1/3.1的作者与阅读路径。正式外部部署留待微调之后；R2/SMTP生产配置与完整线上验收不能由本地通过替代。

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

2026-09-29用户授权：团队直接访问、注册发文，取消外层预览密码；服务器仅拉取构建产物，不承担构建。


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

失败保存必须保留输入；上传期间不得提交缺少图片的内容；已保存提示必须反映当前内容；登录返回原入口；历史渲染一致；错误中文可理解；服务端禁止空白发布；超过 50 条评论必须完整可读。追踪 F1–F7/R1，见 ../design/bugfixes-20261013.md。


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

依据官网设计语言为校园站增加组件动效；范围为首页、公共目录、导航与校园视界弹窗，保持媒介版式与无障碍。 设计契约见 [campus-motion](../design/campus-motion.md)。


## 2026-10-15 · 官网视觉主题

依据官网设计系统对齐校园站圆角、颜色、边框、背景与层次；保留内容、五栏目、数据和已发布动效。 详见 [official-campus-theme](../design/official-campus-theme.md)。


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

## 2026-10-17 · KTU-CHARACTER-CREATE

角色创建是从 Campus 首页可进入、反复使用的工具，不限定“第一个角色”。学院、照片、能力、记忆点、名字五题都不必填；每题支持跳过/返回。默认原画可直接用，姓名为空使用“未命名同学”，其他空项不补造设定。能力引导引用现有 Student 正文；无资料时仍可自由回答或跳过。学生证弹窗水平垂直居中，卡面仅姓名/学号，不含学院；选定学院保存为稳定 UUID 关系。确认前只是浏览器草稿，确认后生成公开 Student/Wiki 档案与首个修订。访客可预览下载，建档需真实 Creator 登录。

## 2026-10-17 · KTU-HOME-SIMPLIFY

用户要求首页减少内容、去掉边角装饰小字，放大角色/论坛创作入口，并参考此前空天大学官网风格。首页保留校徽、校名、校训、两项创作、必要导航，以及用户要求保留的单一资讯堆叠；去掉其他多重摘要与装饰小字。原公开内容保留在对应栏目中。两项主入口需在桌面和手机首屏可用，可键盘操作，减少动效时仍完整；论坛匿名登录应回到对应创作入口。

用户最新统一要求：所有新建网页遵循原空天大学官网风格。角色创建与首页本批已生产验收、上线及测试清理，见verification.md。

用户圈图进一步明确：资讯堆叠放在首屏右侧，替换群像图片，不另设下方重复资讯区。


## 2026-10-24 · 校园档案设定修订

按用户要求取消印记设定，从官网和共享 Wiki 当前内容、人物档案、导航与检索中移除。新增艺术学院周延（175cm），保留分镜解析、过拟合、被动降噪、性格爱好与高中觉醒经历，省略来稿中的旧设定字段。保留既有人物其余资料、身份关系和修订历史；本批包括 Git 管理及服务器发布。
