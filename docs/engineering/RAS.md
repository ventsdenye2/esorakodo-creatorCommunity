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
