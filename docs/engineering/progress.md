# KTU 平台工程进度

## 当前目标与阶段

- 目标：补齐从 M1 收尾到 M7 的可持续工程路线图。
- 当前阶段：AET 需求分析、需求设计和开发计划工件已建立并验证；下一阶段为 M1 真实 Supabase 环境验收。
- 基线提交：`2f05354 chore: bind Sites deployment project`。
- 分支：`main`。

## 已完成

- 产品与工程基线已保存在 `docs/KTU_CoCreation_Platform_Design_v0.1.docx`。
- 长期工程约束已保存在 `AGENTS.md`。
- M0 工程骨架和 M1 本地实现已经存在。
- `docs/ROADMAP.md`：里程碑、依赖、质量门禁和决策门。
- `docs/engineering/RAS.md`：稳定需求 ID、范围、非目标和验收标准。
- `docs/engineering/RDS.md`：当前代码地图、目标模块、数据设计、前端设计门禁和修改围栏。
- `docs/engineering/DPS.md`：按依赖拆分的 M1–M7 任务和状态。
- `docs/engineering/verification.md`：记录本批 lint、typecheck、build、现有渲染测试和未验证边界。

## 本批验证

- `git diff --check`：通过。
- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm run build`：沙箱内首次因 `spawn EPERM` 失败，获准在沙箱外重跑后通过。
- `npm test`：通过，3 项渲染测试全部成功。

## 已知阻塞

- KTU-M100：尚未获得或配置独立 Supabase 开发项目的 URL、public anon key 和 project ref。
- 因此 M1 migration 应用、数据库类型生成、Auth/RLS 集成测试和真实会话验收均不能标记为已验证。

## 不阻塞当前阶段的决策

- M2 UI 前确认 Wiki 第一版字段和并发冲突体验。
- M4 前用真实文章样例确认编辑器与正文块。
- M6 前确认管理员授权与举报处置角色。
- 发布准备前确认邀请制测试或公开注册。

## 下一步

1. 配置 Supabase 开发项目，执行 KTU-M100。
2. 按 KTU-M101 → KTU-M105 完成 M1 真实环境验收。
3. 开始 M2 时先执行 KTU-M200 与 KTU-M201，再写 migration 或页面代码。

## 恢复方式

新会话依次阅读：`AGENTS.md` → `docs/ROADMAP.md` → 本文件 → `docs/engineering/DPS.md`。然后核对 `git status`、最近提交和 `verification.md`，只继续状态不是“已验证”的最早未阻塞任务。
