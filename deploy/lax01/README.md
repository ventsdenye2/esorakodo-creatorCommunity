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

## 2026-09-29 · 反向代理媒体同源校验修复

线上验收发现公开 HTTPS Origin 与应用内部 HTTP Request URL 不同，原同源比较误拒绝上传。生产媒体 POST 现只信任部署配置 NEXT_PUBLIC_SITE_URL 的 origin；缺失、非 HTTP(S)、带凭据或非根路径/query/hash 的配置拒绝请求，不回退 Host，不信任 Forwarded/X-Forwarded-*。开发仍使用 Request URL 的 origin。配置必须是完整站点根 URL；本地 standalone 媒体测试显式覆盖为 http://127.0.0.1:3005。

对应实现为 src/features/media/same-origin.mjs 与 server.ts；测试 tests/media-origin.test.mjs 覆盖内部 HTTP/外部 HTTPS、异源/缺失/opaque Origin、伪造转发头、非法/缺失配置和开发/本地 standalone。直接 node tests/media-origin.test.mjs 执行 6/6 通过，typecheck 与定向 ESLint 通过；node --test 在 Windows 沙箱遇到 spawn EPERM，因此改为单进程测试执行。当前为 deploy/backend 工作区增量，Linux 构建及线上复验由主线继续，本记录不代表已部署成功。

## 2026-09-29 · 团队测试开放

用户明确要求取消外层预览密码、允许团队成员自行注册发文。已部署本机WSL Linux构建（Node24.19，服务器运行Node22.23.3），仅standalone；current现为releases/20260929-02，保留前版回滚。首次新产物目录层级不符启动失败，已更正为dist/standalone，并重新完整冒烟通过。team-beta.nginx.conf取消Basic Auth，保留TLS、noindex、no-store和应用账号验证。KTU_REGISTRATION_ENABLED=true，Supabase邮箱注册启用且需要邮件确认。用户确认QQ邮箱收到了注册确认邮件；重复注册日志23505属于邮箱唯一键冲突，不修改Auth约束、不删除账号。

媒体同源修复已线上复验：正式HTTPS Origin通过校验返回输入校验400，不再错误403。R2 HEAD200、CORS204前置检查通过；真实登录后上传/发布全流程由团队测试，未声称完成。服务页面/图片200、无效登录303，nginx -t通过；两个原站配置SHA256与基线一致。lint、typecheck、media-origin6/6通过；Linux五阶段build成功。ESLint新增output/**忽略，避免隔离构建产物被当源码扫描。

用户允许服务器Git拉取更新，专用deploy/runtime产物分支正在准备；deploy/backend保留源码。服务器不进行npm安装/构建。外层密码已不再用于访问，任何获得网址的人均可访问和注册，noindex不等于访问控制。当前没有自动授予管理员权限。

## 团队测试使用方式

直接访问 https://campus.kongtian.university ，不再填写campus预览账号。成员自行注册Creator，邮箱确认后登录；先创建学生/论坛身份即可论坛发文，Press和事件档案从Creator入口创建。注册邮件已由用户确认收到，其他成员的确认跳转、登录、图片上传、草稿/发布由团队实际验收。有重复注册提示先查看首次确认邮件。请记录页面URL、操作步骤和错误提示；不要分享密码、完整确认链接或签名图片URL。

Git交付使用deploy/runtime仅存dist/standalone和RELEASE.md；源码deploy/backend。服务器执行 `sh /etc/ktu-community/update-runtime.sh`：浅fetch产物分支，archive到独立版本目录，原子切换current，仅重启ktu-community，健康检查失败恢复旧指针。不执行npm、不复制环境变量进Git。旧版本清理由维护者确认当前指针后进行，保留一个可用回滚版本。

2026-09-29 Git交付复验完成：源码60b82a8，产物deploy/runtime=c44ee76ced8ca99048a71aeb2fc589b857ffb38b，远端ref一致；服务器update-runtime.sh实际浅fetch+archive发布成功，current指向releases/git-c44ee76ced8ca99048a71aeb2fc589b857ffb38b。页面/图片200、无效登录303、公开注册页200；两个旧站配置hash不变。bare产物仓库12MB，应用内存约44MB。移除失败/重复9月29日目录和临时上传包，保留9月28日前版；已停用预览凭据文件被删除。仅运行资源和小型Git对象留在服务器，无源码/开发工具安装。线上正式Origin输入校验400、匿名有效结构请求401、R2HEAD200/CORS204；真实用户发布/上传由团队验证，未伪称端到端已通过。

2026-09-29 中文回调与邮件交付完成：源码6b83219，runtime116d827ed71617ecce8caaf7129907573e7b8ebd，服务器已实际Git更新。lint/typecheck通过，回调错误3/3和重定向1/1通过，Linux build和真实standalone callback/media smoke通过。线上发现内部HTTP生成Location后，在专用team-beta.nginx.conf增加仅本站HTTP→HTTPS精确proxy_redirect；nginx -t/reload后线上GET实测缺verifier中文message、无code中文error，均307到正式HTTPS本站/login，恶意next不外跳。未减弱PKCE，不宣称缺verifier等于邮箱已确认。中文注册确认邮件两字段已云端GET读回一致，实际邮件客户端呈现由后续团队注册验证；旧邮件保持原样。服务器保留当前116d827与上一版c44ee76，删除更旧首发产物以节省磁盘。


## 2026-09-29 论坛与 Wiki 更新

此版需要追加迁移 202609290001_forum_reactions_wiki_markdown.sql，然后发布新的 deploy/runtime。迁移只增加默认字段、替换修订/草稿函数并解除身份强制关联约束，旧运行版本兼容新增 schema；回滚只切换前一版运行目录，不删除新列或修订。云端已事务应用并核对既有六张表内容指纹不变；未导出业务数据。最新产物 SHA 和实际服务器状态见 engineering/verification.md。

已完成发布：功能源码 72210ce，deploy/runtime=94bd025a50f2ce48e1e1c5e24a3977cd52b6669a。SSH update-runtime.sh 成功、服务 active、旧版 116d827 保留；线上论坛折叠/展开、390px 布局、档案历史和匿名编辑拦截已核验。Linux build 与 standalone smoke 通过；具体证据见 docs/engineering/verification.md。

## 2026-10-01 图解创作指南

/guide 已上线，10 张原界面截图配 34 个编号说明。功能源码 ba365ef，runtime=1f4d089f695e60418c9326fce905390573a48a1b，SSH update-runtime.sh 更新成功。无新增迁移；前版 94bd025 保留。线上图片、互动练习、页脚及修订历史帮助入口已复验；两个旧站配置未变且 HTTP 200。
