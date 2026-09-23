# KTU 平台工程进度

## 当前目标与阶段

- 目标：完成 M2 Wiki 功能骨架，并保持后续前端整体替换的边界清晰。
- 当前阶段：M2 页面、服务端校验、RPC migration、Revision 历史与回滚已经实现；等待独立 Supabase 开发项目做数据库与 Auth 联调。
- 当前基线提交：`85678e7 docs: add AET engineering roadmap and frontend design gates`。
- 分支：`main`；本批改动尚未提交。

## 本批已完成

- 首页 Campus Trace 改为事件、人物、机构、论坛身份四类动态标签，不再展示未设定的校园建筑。
- Campus Trace 支持点击、ArrowLeft/ArrowRight、Home/End、ARIA tab 语义、焦点与 reduced-motion。
- Wiki 第一版字段与 `version bigint` 乐观锁策略写入 RDS 和 `docs/design/wiki-foundation.md`。
- 新增 `create_wiki_entity`、`apply_wiki_revision`、`rollback_wiki_revision`；创建、修改和回滚都写不可变 Revision。
- 撤销 authenticated 对 Student、College、Place 和 Wiki Revision 的直接写权限；RPC 只授予 authenticated。
- 新增 Wiki 目录、详情、创建、编辑、历史和回滚页面，以及服务端 Zod 校验、查询与错误映射。
- 新增统一 Wiki 实体类型、URL 与 `EntityLink` 组件边界。
- README、ROADMAP、RDS、DPS 和验收记录同步到实际状态。

## 本批验证

- `git diff --check`：通过，仅有 Git 的 LF/CRLF 提示。
- `npm run lint`：通过。
- `npm run typecheck`：通过；只读沙箱首次阻止写 `tsconfig.tsbuildinfo`，允许写构建缓存后通过。
- `npm test`：通过；生产构建完成，5/5 渲染与迁移源码契约测试成功。
- Playwright 桌面 `1440x900`：Wiki 目录空状态和控制台检查通过，0 error、0 warning。
- Playwright 移动 `375x812`：Wiki 创建页无横向溢出，未配置 Supabase 时提交按钮禁用。
- Campus Trace：点击人物显示 `林若岚 / PER-00427 / 02`；ArrowRight 切换机构显示 `玄学院 / ORG-0003 / 03`。
- reduced-motion：媒体查询命中，轨道和面板动画计算时长均为 `0.01ms`。

## 未验证与阻塞

- KTU-M100、KTU-M207：没有独立 Supabase 开发项目 URL、public anon key 与 project ref。
- 本机没有 Supabase CLI 或 PostgreSQL 客户端；migration 只经过源码审查和契约测试，尚未实际执行。
- 因此 Profile trigger、真实 Auth、RPC 原子性、双用户 RLS、陈旧版本冲突和回滚数据链不能标记为已验证。
- Wiki 详情、编辑和历史页需要真实数据后再做桌面/移动浏览器验收。

## 下一步

1. 配置独立 Supabase 开发项目，执行 KTU-M100。
2. 应用 M0/M1 与 M2 migrations，重新从实际 schema 生成数据库类型。
3. 增加并运行 Profile/Auth 与 Wiki 双用户数据库集成测试，验证冲突、越权、Revision 原子性和回滚。
4. 用真实 Student、College、Place 数据验收 Wiki 详情、编辑和历史页面。
5. M2 数据契约稳定后再进入 M3 Forum Account 与 Topic 发布闭环。

## 恢复方式

新会话依次阅读：`AGENTS.md` → `docs/ROADMAP.md` → 本文件 → `docs/engineering/DPS.md` → `docs/engineering/verification.md`。然后核对 `git status` 与开发库 migration 状态，从 KTU-M100/KTU-M207 继续，不重复已通过的空库 UI 验收。
