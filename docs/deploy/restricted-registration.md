# 受限测试期注册开关

服务端运行环境设置 `KTU_REGISTRATION_ENABLED=false` 并重启本站服务后，`/register` 显示暂停注册状态，不输出注册表单；`signUp` 在参数验证、Supabase 配置检查及 API 调用之前拒绝请求，因此旧页面的表单提交也不能绕过。登录不受影响。变量未设置时保持原有开放行为，仅精确值 `false` 关闭注册。此变量不是 `NEXT_PUBLIC_*`，不需要因切换而重新构建。

该开关仅控制本站入口，**不能代替 Supabase Auth 项目设置**：公开 Supabase API 仍由项目的 Allow new users 设置决定。关闭项目注册之前先确认该项目是否被其他应用共用。未配置 SMTP 的受限测试使用既有测试账号，不进行公开自助注册。站点访问本身仍需独立的反向代理认证、Cloudflare Access 或 SSH 隧道限制。

回归命令：先 `npm run build`，再 `node --test tests/standalone-registration.test.mjs`。测试启动两个回环地址的临时 standalone 进程，验证默认注册表单、关闭后的页面、关闭后旧表单被服务端拒绝，以及登录动作仍可用。全部 POST 使用无效字段，不创建账号、不写数据库。

2026-09-28 本地验证：上述 standalone 集成测试 1/1 通过；修改模块 ESLint、全项目 TypeScript 检查与完整构建通过。测试只证明本站开关，不证明云 Supabase 已关闭注册，也未修改云端设置。

同次附加 `rendered-html` / `auth-redirect` 回归为 4/7：Forum、Wiki、Discovery 三项因页面加载数据失败而未通过。当时本地产物使用 `http://127.0.0.1:54321`，该端口 TCP 探测确认不可连接；未为通过测试而放宽断言。本次本地构建产物不可直接部署，线上必须以云项目公开参数重新构建并验收。
