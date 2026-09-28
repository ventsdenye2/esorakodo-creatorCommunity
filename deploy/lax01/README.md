# lax01 受限测试部署 · 2026-09-28

## 实测宿主和隔离边界

SSH：root@lax01.ventsdenye.com，使用本机现有密钥。普通账号 ventsdenye 无sudo。Ubuntu26.04 x86_64，约2GB内存、1GB swap，磁盘剩余约11GB。现有Nginx托管 kongtian.university 和 portfolio.ventsdenye.com，操作前均HTTPS200；本批不修改它们的vhost、不升级系统Node、不重启整机。

已准备专用运行时 `/opt/ktu-node` Node22.23.3（官方nodejs.org TLS下载并以官方SHA256核对）、系统用户ktu、`/srv/ktu-community/releases`、`/etc/ktu-community`。本批没有启用应用服务、Nginx站点、修改防火墙或云数据库。PowerShell首次SSH stdin末尾CR使脚本最终退出1，但全部安装步骤完成；以后以scp传LF脚本并远程执行，避免此差异，安装结果另行只读验证。

使用本目录配置而非旧ubuntu硬编码3000模板：新服务仅 `127.0.0.1:3107`，非root运行，最多768MB内存/单核CPU配额。服务安装前确认端口仍空闲。`current`仅在新版本Linux构建和冒烟成功后切换到版本目录，保留前版本；数据库迁移不做删除式回滚。

现有站点配置SHA256基线：
- kongtian.university：bd89de5b7f6f3a295af1865d9079a898d0045df877285d9a15b352d64ecaa9c4
- kui：bae516bf3fc108e0e77eda5d370b7018bbc0af4f8ad0e5dac6ae9b19297509e1

## 当前缺少的输入

在本机项目目录执行 `npx supabase login` 登录，再告知项目是否专用于空天大学。此登录不等于数据库已迁移；后续先只读核对项目ref、schema、migration history和备份，再决定缺失迁移。预期ref `sttghkavzjeqeuignpwi`，必须保留数据。CLI令牌/数据库密码不贴聊天、不打印日志。

Cloudflare `campus.kongtian.university` 当前解析到代理地址，不能由此推断源站指向正确。在该记录确认源站为lax01；不要修改主域、作品集或全zone规则。站点TLS仍未签发。

## 后续具体执行顺序

1. 完成云Supabase只读审计、备份和差异迁移；核实是否共用项目再调整Auth注册策略。
2. 构建使用真实云公开URL/key与正式站点URL，绝不复制.env.local或本地测试数据。在Linux隔离环境生成产物；不在现有网站目录执行安装或构建。
3. 产物上传独立releases目录，应用由ktu账号运行，凭据文件root:ktu 0640。先仅回环服务、SSH隧道测试；不把未配置Auth的假成功页面当成部署完成。
4. 只添加campus对应bootstrap站点（普通路径404，仅专用ACME路径开放）。nginx -t成功后reload，不restart；验证现有网站及配置hash。确认该子域源站解析后使用现有Certbot账户webroot签发独立证书，不改变旧证书和续期配置。
5. 有效证书/独立预览密码文件准备好后启用preview.nginx.conf：全路径Basic Auth、noindex/no-store；不在HTTP传送预览密码。预览凭据仅安全交付给用户，不打印或提交。Cloudflare该子域不要配置Cache Everything。
6. 测试本站HTTPS、未知访客401、授权访客页面/登录/动作/权限，原站HTTP200/hash不变。上线后再核对该站进程资源占用。

回滚只停止ktu-community并恢复本项目current/vhost版本，不动其他服务，不删除云数据库对象。首次尚无旧版本时撤销本站新增vhost并验证Nginx后reload；旧站配置保持原样。

## R2配置（用户可稍后完成）

Cloudflare → R2创建私有桶 `ktu-campus-media`，不要启用r2.dev或公共自定义域名。创建S3凭据，权限Object Read & Write，仅此桶。把S3 endpoint、Access Key ID、Secret Access Key安全写入服务器环境文件，不贴聊天。应用变量见env.example，R2_FORCE_PATH_STYLE=true。

在桶Settings → CORS Policy粘贴本目录r2-cors.json（Dashboard JSON格式）。允许正式HTTPS origin的PUT/GET/HEAD与签名头；桶仍保持私有。真实浏览器OPTIONS预检、上传、确认和读取尚需上线环境验证。

官方说明：https://developers.cloudflare.com/r2/get-started/s3/ 、https://developers.cloudflare.com/r2/buckets/cors/

## 邮件配置（用户可稍后完成）

选定支持SMTP的发信服务，验证自己控制的发信域名并在Cloudflare仅添加服务商要求的SPF/DKIM等DNS记录，不覆盖既有记录。在Supabase Auth → SMTP配置host/port/username/password、发件地址与名称。SMTP凭据留在Supabase，不需要加入前端环境。

Site URL为https://campus.kongtian.university，允许callback精确URL为https://campus.kongtian.university/auth/callback；保留其他仍需使用的已知回调地址。用真实外部邮箱验证确认链接后才开放注册。默认Supabase SMTP不能作为公众注册发信方案。

官方说明：https://supabase.com/docs/guides/auth/auth-smtp 、https://supabase.com/docs/guides/auth/redirect-urls

## 2026-09-28 · 受限测试站已部署

用户确认root密钥SSH与独立Supabase用途，授权部署；补充约束为服务器只保留必要内容。云项目原public无表/类型、auth.users=0，保留rls_auto_enable函数。output/deploy-20260928/cloud-public-before.sql保存迁移前结构（Git忽略）；13个本仓库迁移已全部应用，复核29张表全部RLS、13条迁移记录、Auth用户仍0。

云公开参数在Linux专用release构建，lint/typecheck/build通过（构建内存峰值856.7MB，限额1100MB/50%CPU）；注册开关standalone测试本机1/1通过。此次本机旧SSR回归4/7，因本地Supabase停服，未掩盖失败；不能沿用9月24日7/7声称本批全绿。云产物通过真实回环smoke：主页/登录/论坛/Wiki/图片200，无效登录303。

原站配置hash不变，kongtian.university与portfolio.ventsdenye.com仍200。新增campus专用Nginx vhost，nginx -t通过后reload，未restart旧服务。证书有效期至2026-12-27。通过Cloudflare访问匿名401、Basic Auth授权200，禁止缓存/索引。访问密码只保存在服务器root可读的/etc/ktu-community/preview-access.txt；本机没有输出其值。应用KTU_REGISTRATION_ENABLED=false，云Auth注册设置尚需单独核实/关闭，不能宣称此开关封住Supabase直接API。

用户要求轻量运行后精确清理本项目源码/完整node_modules/npm缓存/上传包，保留dist/standalone64MB和私有Node二进制121MB，配置约44KB；服务器磁盘回到8.8GB已用/11GB可用，应用内存约52MB。清理后只重启ktu-community，回环复验正常。服务器无源码Git checkout；本地deploy/backend分支用于代码与配置追踪，后续本机/CI构建+artifact更新。不要声称已实现服务器git pull产物流程。

当前可访问：https://campus.kongtian.university/（受限预览）。真实R2/SMTP/注册确认/首位Creator和管理员仍待配置，未创建云测试账号或作品、未发布合成内容。操作步骤见deploy/lax01/README.md。应用目录/srv/ktu-community/current -> releases/20260928-01，专用服务ktu-community，回环3107。

访问密码读取（在自己的终端执行，勿贴聊天）：ssh root@lax01.ventsdenye.com 'cat /etc/ktu-community/preview-access.txt'

prune-build.sh是首发一次性清理脚本，运行后npm已移除；以后不要在服务器npm ci/build，也不要重复运行首次准备脚本。若选择Git拉取交付，需新增由本机/CI生成的产物分支，仅包含standalone并浅克隆；当前deploy/backend为源码部署分支，不要在服务器拉取完整源码和历史。
