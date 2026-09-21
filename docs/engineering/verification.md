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
