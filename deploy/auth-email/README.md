# 注册确认邮件

主题：空天大学｜请确认你的注册邮箱

正文：`supabase/templates/confirmation.html`。沿用 Supabase `{{ .ConfirmationURL }}`，不改验证协议，不自动确认账号；邮件说明同浏览器打开和手动密码登录。

2026-09-29 已用官方 Management API 对项目 sttghkavzjeqeuignpwi 的 `/config/auth` 执行仅含 `mailer_subjects_confirmation`、`mailer_templates_confirmation_content` 的 PATCH，并 GET 验证两字段精确一致。其余 Auth 配置相同；供应商额外将对应的两个 `*_custom_contents` 确认模板标志置 true，其他模板标志仍 false。实际收件箱渲染由团队下一次注册验证，未额外向用户发测试邮件。

此目录的最小 TOML 用于记录模板配置。**不要直接 config push**：本次自动审核拒绝该方法，担心默认配置覆盖线上；而 CLI diff 仅显示主题变化，没有证明正文会同步。已改用上述只含两个字段的官方 API，既有 CLI 凭据仅在内存使用，不在脚本或仓库存储令牌。也可在 Supabase Dashboard 的 Authentication / Email Templates / Confirm signup 复制主题与 HTML。

官方参考：https://supabase.com/docs/guides/auth/auth-email-templates
