# KTU 平台工程进度

## 当前目标与阶段（2026-09-23）

- 目标：收尾 M1/M2 的真实服务验收，再进入 M3。
- 当前阶段：隔离本地 Supabase 的 DB、Auth 和 REST 已运行，31/31 pgTAP、真实双用户 API 集成与浏览器 Student 主路径通过；邮件确认、College/Place 页面和移动端有数据状态待补验。
- 当前基线提交：`4aeb434 feat: build community wiki and homepage`；分支 `main`，本批测试与文档改动尚未提交。
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
