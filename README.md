# 空天大学共创平台

空天大学共创平台是一座以虚构大学数字校园为界面的 IP 共创空间。现实中的 Creator 通过校园论坛、校刊/部刊与事件专题讲故事，人物、学院、地点与事件则在可追溯的 Wiki 网络中持续生长。

当前仓库完成 M0 工程骨架、M1 账户基础与 M2 Wiki 的代码骨架。Wiki 的真实迁移、RPC 与 RLS 仍需在独立 Supabase 开发项目中验收，不能视为数据库层已验证。

## 当前能力

- App Router 路由结构与 TypeScript strict 模式
- 可替换的基础校园 Layout，以及首页、登录、注册和 Creator 页面骨架
- Supabase 浏览器端 / 服务端 SSR client 封装
- 邮箱注册、密码登录、确认回调、退出登录与受保护 Creator 页面
- 第一版 PostgreSQL migration、索引、Grants 与 RLS
- `profiles`（Creator）、`students`、`colleges`、`places`、`forum_accounts`、`wiki_revisions` 核心模型
- Wiki 目录、详情、创建、编辑、Revision 历史与回滚页面
- Wiki 创建、编辑和回滚的原子 RPC，以及基于 `version` 的乐观锁
- Forum / Press / Events 的信息架构占位路由

## 技术说明

本仓库由 OpenAI Sites starter 初始化，使用 Vinext 提供 App Router 兼容运行时，并通过 `@openai/sites-vite-plugin` 输出 Cloudflare Worker-compatible ESM。应用代码保持标准 Next.js App Router API 边界，以便后续在需要时迁移到 canonical Next.js runtime。

业务数据与 Auth 使用 Supabase；Sites 自带的 D1 与 R2 绑定均保持关闭。媒体资源后续使用 Cloudflare R2，本阶段不实现。

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

`npm test` 会在构建后检查渲染结果，兼容未配置和已连接本地 Supabase 的状态。pgTAP 覆盖 Profile trigger、双用户 Profile 所有权、表 Grants、Wiki RPC 写入边界、Revision、冲突与回滚；它需要已启动并应用迁移的本地 Supabase。`src/types/database.ts` 的数据库主体由本地已迁移 schema 生成，文件末尾保留应用使用的领域别名。

本地 Auth/API 集成测试还可运行 `node tests/local-api.test.mjs`。该测试只接受 `.env.local` 中的 `http://127.0.0.1:54321`，需要临时环境变量 `SUPABASE_SERVICE_ROLE_KEY` 清理一次性用户和 Wiki 数据；可从 `npx supabase status -o env` 取得本地服务密钥，运行后清除该环境变量，切勿写入 `.env.local` 或 Git。本地浏览器已验注册、Creator 会话、Student Wiki 创建/编辑/历史/回滚与退出；邮件确认链路和独立开发项目仍待验证。

## 目录

```text
app/                   App Router 页面、Server Actions 入口与 Route Handlers
src/components/        可复用 Layout 与 UI
src/features/          领域功能（当前为 Auth、Wiki）
src/lib/supabase/      Supabase client/server 配置边界
src/types/             数据库与领域类型
supabase/migrations/   可复现数据库结构、索引、Grants 与 RLS
docs/                  产品基线与阶段计划
.openai/               Sites 托管元数据（不存环境变量）
```

## 长期约束

开发前先阅读 [AGENTS.md](./AGENTS.md) 与 `docs/KTU_CoCreation_Platform_Design_v0.1.docx`。完整里程碑、依赖和质量门禁见 [docs/ROADMAP.md](./docs/ROADMAP.md)，具体任务状态见 [docs/engineering/DPS.md](./docs/engineering/DPS.md)，断点续作从 [docs/engineering/progress.md](./docs/engineering/progress.md) 开始。早期 M0/M1 记录保留在 [docs/M0-M1-PLAN.md](./docs/M0-M1-PLAN.md)。

当前视觉令牌与页面样式是功能优先阶段的临时基线，预期会在后续前端美术阶段调整；领域边界和数据库模型不应依赖这些视觉细节。
