# 空天大学共创平台

空天大学共创平台是一座以虚构大学数字校园为界面的 IP 共创空间。现实中的 Creator 通过校园论坛、校刊/部刊与事件专题讲故事，人物、学院、地点与事件则在可追溯的 Wiki 网络中持续生长。

当前仓库完成 M0 工程骨架与 M1 账户基础，不包含复杂创作业务。

## 当前能力

- App Router 路由结构与 TypeScript strict 模式
- 可替换的基础校园 Layout，以及首页、登录、注册和 Creator 页面骨架
- Supabase 浏览器端 / 服务端 SSR client 封装
- 邮箱注册、密码登录、确认回调、退出登录与受保护 Creator 页面
- 第一版 PostgreSQL migration、索引、Grants 与 RLS
- `profiles`（Creator）、`students`、`colleges`、`places`、`forum_accounts`、`wiki_revisions` 核心模型
- Forum / Press / Events / Wiki 的信息架构占位路由

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
```

`npm test` 会在构建后检查渲染结果。连接真实 Supabase 开发项目后，还应为注册触发器与 RLS 增加集成测试。

## 目录

```text
app/                   App Router 页面、Server Actions 入口与 Route Handlers
src/components/        可复用 Layout 与 UI
src/features/          领域功能（当前为 Auth）
src/lib/supabase/      Supabase client/server 配置边界
src/types/             数据库与领域类型
supabase/migrations/   可复现数据库结构、索引、Grants 与 RLS
docs/                  产品基线与阶段计划
.openai/               Sites 托管元数据（不存环境变量）
```

## 长期约束

开发前先阅读 [AGENTS.md](./AGENTS.md) 与 `docs/KTU_CoCreation_Platform_Design_v0.1.docx`。完整里程碑、依赖和质量门禁见 [docs/ROADMAP.md](./docs/ROADMAP.md)，具体任务状态见 [docs/engineering/DPS.md](./docs/engineering/DPS.md)，断点续作从 [docs/engineering/progress.md](./docs/engineering/progress.md) 开始。早期 M0/M1 记录保留在 [docs/M0-M1-PLAN.md](./docs/M0-M1-PLAN.md)。

当前视觉令牌与页面样式是功能优先阶段的临时基线，预期会在后续前端美术阶段调整；领域边界和数据库模型不应依赖这些视觉细节。
