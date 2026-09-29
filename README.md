# 空天大学共创平台

空天大学共创平台是一座以虚构大学数字校园为界面的 IP 共创空间。现实中的 Creator 通过校园论坛、校刊/部刊与事件专题讲故事，人物、学院、地点与事件则在可追溯的 Wiki 网络中持续生长。

当前 M0–M7 的应用实现已接通，进入本地收尾验收与视觉微调阶段。公共界面采用大学官网语气；Creator、Student 与 Forum Account 在创作流程中保持独立。部署将在微调后进行，当前没有上线或应用云端迁移。

## 当前能力

- CAMPUS VIEW 自动轮换卡片堆，最新公开内容优先，手动切换、暂停和 reduced-motion 支持；首页栏目读取真实数据。
- Supabase Auth、SSR 会话、Creator 资料/头像、公开作者页与作品管理。
- Student / College / Place Wiki 的 UUID 关系、原子修订历史、乐观锁与回滚。
- 论坛多身份楼层、标签、实体引用、原子草稿保存、预览与发布约束。
- 校刊结构化正文、固定分类标签、图片、UUID 引用、草稿/预览/发布与独立刊物版式。
- 事件主档案、稳定时间线、实体关联，以及独立作者的事件补充和档案版式。
- 私有 R2 媒体接口、签名直传、文件校验；作品评论、收藏、点赞与举报；管理员审阅、隐藏/恢复和审计。
- 中文分组检索、Wiki / Event 反向作品关联、加载/空/错/权限/冲突状态。

本地数据库 187/187 pgTAP 通过；Press / Events、论坛草稿和双用户权限已有浏览器、API 或事务证据，具体边界见 [验收记录](./docs/engineering/verification.md)。私有媒体经 MinIO + Node standalone 验证，真实云 R2/CORS、SMTP、托管 Supabase 与 Ubuntu/DNS/TLS 留待部署验收。

## 技术说明

本仓库由 OpenAI Sites starter 初始化，使用 Vinext 提供 App Router 兼容运行时，并通过 `@openai/sites-vite-plugin` 输出 Cloudflare Worker-compatible ESM。自有 Ubuntu 服务器另用 Node standalone 输出与 Nginx 反代；操作和已验证范围见 [Ubuntu 部署说明](./docs/deploy/ubuntu.md)。应用代码保持标准 Next.js App Router API 边界。

业务数据与 Auth 使用 Supabase；Sites 自带的 D1 与 R2 绑定均保持关闭。媒体通过服务端 S3 兼容适配器接入私有 Cloudflare R2，签名使用 aws4fetch；配置与证据见 docs/engineering/media-verification.md。

## 本地运行

要求 Node.js 22.13 或更高版本。

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。未填写 Supabase 环境变量时，公共页面仍可运行；Auth 提交会返回明确的配置提示。

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env.local
npm run dev
```

## Supabase 设置

可以先用本机 Docker Desktop + Supabase CLI 做隔离验证。在仓库目录执行：

```powershell
npx supabase start
npx supabase test db
```

`supabase start` 会在本机启动 Auth、PostgreSQL 与 API，并应用 `supabase/migrations` 中的迁移。`supabase test db` 执行 `supabase/tests/database` 下的 pgTAP 测试；测试用事务回滚，不保留测试用户。只做 SQL 验收时可先执行 `npx supabase db start`；从仅数据库模式切到完整服务时，先执行普通 `npx supabase stop`（保留本地数据卷），再执行 `npx supabase start`。将启动结果中的本地 API URL 与 **anon/publishable key** 写入 `.env.local`，供浏览器和服务端联调；不要把 service role key 写进公开变量或 Git。

若改用独立的托管开发项目：

1. 创建一个仅用于开发的 Supabase 项目。
2. 将 Project URL 与 anon/publishable key 写入 `.env.local`。
3. 使用 Supabase CLI 关联项目并应用 migration：

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

4. 在 Auth URL Configuration 中添加：
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`

生产环境值应通过部署平台的环境变量管理，不应写入 `.openai/hosting.json` 或 Git。

## 验证

```bash
npm run lint
npm run typecheck
npm run build
npx supabase test db --local
```

`npm test` 会在构建后检查渲染结果，兼容未配置和已连接本地 Supabase 的状态。pgTAP 覆盖 Profile、Wiki、论坛、校刊、事件、媒体、社区互动与管理员审阅的事务、隔离和权限；它需要已启动并应用迁移的本地 Supabase。`src/types/database.ts` 的数据库主体由本地已迁移 schema 生成，文件末尾保留应用使用的领域别名。

本地 Auth/API 集成测试还可运行 `node tests/local-api.test.mjs`。该测试只接受 `.env.local` 中的 `http://127.0.0.1:54321`，需要临时环境变量 `SUPABASE_SERVICE_ROLE_KEY` 清理一次性用户和 Wiki 数据；可从 `npx supabase status -o env` 取得本地服务密钥，运行后清除该环境变量，切勿写入 `.env.local` 或 Git。本地浏览器已验注册、Creator 会话、Student/College/Place Wiki、论坛身份与主题发布、匿名阅读及 Student 反向链接；邮件确认、线上项目和服务器仍待验证。上线前步骤与外部输入见 [发布检查单](./docs/deploy/release-checklist.md)。

## 目录

```text
app/                   App Router 页面、Server Actions 入口与 Route Handlers
src/components/        可复用 Layout 与 UI
src/features/          领域功能（Auth、Wiki、Forum、Forum Account、Campus）
src/lib/supabase/      Supabase client/server 配置边界
src/types/             数据库与领域类型
supabase/migrations/   可复现数据库结构、索引、Grants 与 RLS
docs/                  产品基线与阶段计划
.openai/               Sites 托管元数据（不存环境变量）
```

## 长期约束

开发前先阅读 [AGENTS.md](./AGENTS.md) 与 `docs/KTU_CoCreation_Platform_Design_v0.1.docx`。完整里程碑、依赖和质量门禁见 [docs/ROADMAP.md](./docs/ROADMAP.md)，具体任务状态见 [docs/engineering/DPS.md](./docs/engineering/DPS.md)，断点续作从 [docs/engineering/progress.md](./docs/engineering/progress.md) 开始。早期 M0/M1 记录保留在 [docs/M0-M1-PLAN.md](./docs/M0-M1-PLAN.md)。

目前的轻量校园沙盘只作空间交互示意，不代表已确认的校内地点或正式 3D 模型；领域边界和数据库模型不依赖这些视觉细节。


### 论坛与档案编辑（2026-09-29）

论坛支持回复树、折叠与同形创作预览；每条发言的 👍 / ？由作者设置，属于剧情数据。所有论坛身份均可不关联人物档案创建。校园档案支持 Markdown 正文、GFM 表格和格式工具栏；修订页可对比两版并把旧版恢复成新修订。设计与迁移说明见 docs/design/forum-wiki-reading.md，实际验收和部署状态见 docs/engineering/verification.md。
