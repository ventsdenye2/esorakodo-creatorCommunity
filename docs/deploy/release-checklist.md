# `campus.kongtian.university` 公开测试版上线清单

状态：2026-09-23 本地只读审计。目标为账户、Wiki、论坛与开放注册；任何云数据库、DNS、服务器操作均未由本页执行。执行后把实际时间、命令结果和端到端证据同步到 `docs/engineering/progress.md` 与 `verification.md`。

## 当前可核实的事实与阻塞

- `campus.kongtian.university` 的 A 记录在本机 DNS 查询返回 NXDOMAIN；父域 `kongtian.university` 正常解析。域名管理处应创建指向 Ubuntu 公网 IP 的 `campus` A 记录；如配置 AAAA，IPv6 也必须可达。若主域经过 Cloudflare，先确认子域的代理模式、SSL/TLS 模式和源站证书策略。DNS 更新后从多个解析器核查 A/AAAA，再验公网 HTTP/HTTPS。
- 复核时子域的 A、AAAA、CNAME 查询均为 NXDOMAIN。公开 Supabase 地址 `https://sttghkavzjeqeuignpwi.supabase.co/auth/v1/health` 无密钥请求经 Node TLS 到达并返回 HTTP 401：入口可达，但此响应**不能证明 Auth 健康或项目配置正确**。本机 Windows curl/PowerShell 的 Schannel 认证报错是客户端差异，不能作为项目不可用的结论。
- 云 Supabase ref 为 `sttghkavzjeqeuignpwi`，但仓库未链接云项目，本会话没有 `SUPABASE_ACCESS_TOKEN`，常见本地 CLI token 文件也不存在。无法核查云迁移记录、Auth/SMTP 设置或云数据库现有对象；绝不能根据本地 82/82 pgTAP 推断云库已迁移。
- Ubuntu 的 SSH 主机地址、用户名、访问方式和证书配置尚未提供，无法核查 OS、端口、防火墙、Nginx、systemd 或外网 HTTPS。
- `docs/deploy/ubuntu.md` 与 `deploy/ubuntu/` 已改用 Vinext standalone Node 产物，隔离 Linux 构建和运行通过 SSR、静态图片和无效登录 Server Action；此前另有 Nginx HTTP 代理可行性验证。真实 Ubuntu 宿主、systemd 重启、图片优化、HTTPS 和云端 Auth 尚未验收。
- 注册确认链接已由本批主线修改为优先使用 `NEXT_PUBLIC_SITE_URL`，回调的反斜杠跳转目标也已收紧；lint、类型检查通过。生产 HTTPS 邮件链接、云端 Auth allowlist 和回调仍未验。

## 完整平台增量门禁（2026-09-23）

首发范围已扩至完整实现，以下旧环境记录仍是历史观测，不代表当前线上状态。迁移必须比对整个 `supabase/migrations` 目录，包含 202609240001–008；不得只推旧 M1–M3 清单。新的表、RPC、RLS 和管理员定向读取以 `design/content-data-contract.md`、`design/moderation.md` 为准。

私有媒体部署需配置服务端 `SUPABASE_SERVICE_ROLE_KEY` 和 R2 环境变量，私有桶禁止公共域名。按 `engineering/media-verification.md` 配置实际站点精确 Origin 的 PUT CORS，验证浏览器预检、签名 Content-Type/Content-Length/If-None-Match、确认和读取。MinIO 本地成功不能替代真实 R2 验收。保留未完成上传清理和密钥轮换的运营流程。

后台已实现 `/moderation` 与单举报审阅，受 `moderators` 成员表和 RPC 限制。上线由受控数据库管理员按 Creator UUID 授予首位运营人员，不在客户端提供自助提权；在独立测试环境验证隐藏、恢复、驳回与审计。已隐藏作品不会因审阅而向普通访问者开放。CC BY-SA 发布许可仍需确认，不可直接对存量内容标注。

新增 middleware 后开发服务器需要重启以发现请求入口；Node standalone 已验证过期会话续期、Set-Cookie 和 private/no-store。上线必须重新构建，并在实际 HTTPS 域名复测。

## 1. 云数据与 Auth（先于公网开放）

1. 在 Supabase 控制台核实项目 ref、Postgres 版本、当前 `public` schema 和迁移记录；确认这是本站预期项目，先建立可恢复的备份/时间点恢复。迁移按文件名顺序为 `202608190001_m0_m1_core.sql`、`202609220001_m2_wiki_revisions.sql`、`202609230001_m2_grants_hardening.sql`、`202609230002_m3_forum.sql`、`202609230003_m3_forum_tag_rpc.sql`。已有业务表时先检查冲突，不能盲目推送。
2. 在操作机上以 CLI 的安全登录方式认证、关联 `sttghkavzjeqeuignpwi`；访问令牌与数据库密码仅放交互式凭据存储/本地受保护环境，不贴聊天、不写 Git。先运行 `supabase migration list --linked`，比对云端记录；再用 CLI 支持的 dry-run 列出将执行的迁移。核对目标项目与文件清单后才应用，保存命令结果和备份恢复点。若 CLI 版本的参数不同，以 `supabase db push --help` 为准。
3. 云端检查 `anon` 对六张 M1/M2 公共表与四张论坛表仅有 SELECT；`authenticated` 的写入受 Grants 和 RLS 双重限制；Wiki 创建/修订/回滚及论坛发布/楼层/标签 RPC 的 `anon` EXECUTE 被撤销。用两个测试 Creator 与匿名会话实测未发布草稿不可见、跨用户写入被拒绝、已发布论坛正文不能编辑、Wiki 修订产生历史；清理测试数据前保留验收记录。
4. Auth 允许 email/password 自助注册，决定是否强制邮箱确认。Site URL 设置 `https://campus.kongtian.university`，允许的重定向 URL 精确包含 `https://campus.kongtian.university/auth/callback`，避免宽松的生产通配符。配置可用的发信域名、SMTP、SPF/DKIM/DMARC 和速率限制；用真实外部邮箱完成一次确认链接、登录、退出和异常链接测试。
5. 取得该项目的 **publishable/anon key**，仅写入部署机受保护环境文件与构建环境；service-role、数据库密码和 CLI token 不进入 `NEXT_PUBLIC_*`、浏览器、构建日志或仓库。

### 开放注册和发帖的最低运营应急

- 上线前指定一位能访问 Supabase 管理后台的运营责任人及备用联系人，明确何时检查公开论坛、如何接收举报和处置记录放在哪里。公开注册先设置 Supabase Auth 邮件注册/登录的速率限制并启用邮箱确认。当前注册表单未传 CAPTCHA token；若决定启用 Supabase CAPTCHA，必须先实现浏览器挑战和 `captchaToken` 传递并完成真实注册验收，之后才开启控制台开关，以免所有正常注册失败。
- 站内管理审核界面已实现并支持隐藏/恢复/审计，普通 Creator 不能更新已发布 Topic。以下受控数据库操作仅作故障应急：事先演练由受控数据库管理员身份进行的**单条状态事务**：按 Topic UUID 与当前 `status='published'` 锁定并改为 `hidden`，核对仅影响一条，再验证匿名列表和详情不可见；保留 UUID、理由、操作者、操作时间和变更前后状态。不得给浏览器或普通 Creator 发放 service-role 密钥，也不要临时放宽 RLS。
- 恢复时由同一受控流程核对记录，单条 `hidden` 恢复为 `published`，保留原 `published_at`，复查匿名可见。误封或错误目标要能从记录追踪并处理；若无负责人与演练结果，不开放无审核的公开发帖。

## 2. 域名与 Ubuntu 宿主

1. 在 DNS 管理处为 `campus` 创建 A 记录指向服务器公网 IPv4；配置 AAAA 时检查 IPv6 入站 80/443。等待公开解析生效，确认 80/443 可从外网到达且应用端口 3000 只监听 `127.0.0.1`。记录 `dig +short campus.kongtian.university A`/`AAAA` 和从外网得到的结果。
2. 在 Ubuntu 核对 `node --version` 至少 22.13、npm 路径、专用服务用户、目录权限、磁盘空间、防火墙与安全组。应用环境文件位于 `/etc/ktu-community/ktu-community.env`，权限只对 root/服务组开放；含 `NEXT_PUBLIC_SUPABASE_URL=https://sttghkavzjeqeuignpwi.supabase.co`、项目的公开 key、`NEXT_PUBLIC_SITE_URL=https://campus.kongtian.university`。构建和运行必须使用相同的公开值，绝不沿用本地 `127.0.0.1:54321` 配置。
3. 在目标 Ubuntu 上用 `node dist/standalone/server.js` 启动 systemd 服务，检查长期运行和重启恢复、真实 Auth Server Actions、静态资源与需要时的 `/_vinext/image` 图片路径。Vinext 仍处于 beta；容器中的冒烟测试不能替代目标宿主验收。
4. 将 Nginx `server_name`、证书路径替换为 `campus.kongtian.university`。首次签证书前保证 DNS 与 80 端口可达；用 Certbot 或已有 ACME 流程签发、配置续期，`nginx -t` 后 reload。通过外网验证 HTTP 到 HTTPS 的重定向、TLS 证书域名/有效期、回调地址与代理传入的 Host/协议。若使用 Cloudflare 代理，源站 TLS 应保持 Full (strict)。

## 3. 发布门禁与回退

- 本地/部署源码执行 `npm ci --include=dev`、`npm run lint`、`npm run typecheck`、`npm run build`；数据库迁移在隔离环境跑 pgTAP，云端仅执行经过核对的迁移。保留发布提交 SHA 和变更清单。
- 真实 HTTPS 域名逐项验：匿名浏览 Wiki 和论坛；注册邮件确认、登录/退出；两位 Creator 分别建 Forum Account、编辑 Wiki、创建/保存/发布论坛 Topic；草稿与他人写入权限；手机和桌面布局；静态资源/图片；反向代理日志和重启恢复。出现 5xx、错误回调或权限泄漏时不开放注册。
- 代码回退使用上一个已验证提交/构建并重启服务；**数据库迁移不直接逆向删除**，先按备份/恢复方案评估数据影响。记下负责人的恢复路径、健康检查和线上测试数据清理范围。

## 最小外部输入

需要域名 DNS 管理权限、Ubuntu SSH 主机/用户名/访问方式，以及该 Supabase 项目的安全 CLI/控制台访问和 publishable key。密钥不要放聊天；可在目标机受保护环境和个人凭据存储中配置。取得这些条件后按以上顺序继续，任何生产写入前确认目标和备份状态。

## 2026-09-28 · lax01 部署准备

用户授权本机SSH密钥连接ventsdenye及root@lax01.ventsdenye.com；保留现有Supabase项目，不干扰其他网站。已只读核对原站/端口/Nginx，并安装独立Node22.23.3、ktu系统用户与本项目空目录，未启用应用或代理。采用deploy/lax01独立配置：回环3107、版本目录、受限HTTPS预览及注册开关。现有主站与作品集配置hash和200基线保存在deploy/lax01/README.md。

下一步需要用户本机Supabase CLI登录与项目用途确认，然后只读云schema/迁移/备份审计。R2与SMTP尚未配置，具体用户操作见该README；没有迁移云库或公开应用。Cloudflare域名已解析到代理IP（旧NXDOMAIN记录已过时），源站配置仍待核实。

## 2026-09-28 · 受限测试站已部署

用户确认root密钥SSH与独立Supabase用途，授权部署；补充约束为服务器只保留必要内容。云项目原public无表/类型、auth.users=0，保留rls_auto_enable函数。output/deploy-20260928/cloud-public-before.sql保存迁移前结构（Git忽略）；13个本仓库迁移已全部应用，复核29张表全部RLS、13条迁移记录、Auth用户仍0。

云公开参数在Linux专用release构建，lint/typecheck/build通过（构建内存峰值856.7MB，限额1100MB/50%CPU）；注册开关standalone测试本机1/1通过。此次本机旧SSR回归4/7，因本地Supabase停服，未掩盖失败；不能沿用9月24日7/7声称本批全绿。云产物通过真实回环smoke：主页/登录/论坛/Wiki/图片200，无效登录303。

原站配置hash不变，kongtian.university与portfolio.ventsdenye.com仍200。新增campus专用Nginx vhost，nginx -t通过后reload，未restart旧服务。证书有效期至2026-12-27。通过Cloudflare访问匿名401、Basic Auth授权200，禁止缓存/索引。访问密码只保存在服务器root可读的/etc/ktu-community/preview-access.txt；本机没有输出其值。应用KTU_REGISTRATION_ENABLED=false，云Auth注册设置尚需单独核实/关闭，不能宣称此开关封住Supabase直接API。

用户要求轻量运行后精确清理本项目源码/完整node_modules/npm缓存/上传包，保留dist/standalone64MB和私有Node二进制121MB，配置约44KB；服务器磁盘回到8.8GB已用/11GB可用，应用内存约52MB。清理后只重启ktu-community，回环复验正常。服务器无源码Git checkout；本地deploy/backend分支用于代码与配置追踪，后续本机/CI构建+artifact更新。不要声称已实现服务器git pull产物流程。

当前可访问：https://campus.kongtian.university/（受限预览）。真实R2/SMTP/注册确认/首位Creator和管理员仍待配置，未创建云测试账号或作品、未发布合成内容。操作步骤见deploy/lax01/README.md。应用目录/srv/ktu-community/current -> releases/20260928-01，专用服务ktu-community，回环3107。
