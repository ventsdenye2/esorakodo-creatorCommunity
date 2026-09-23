# Ubuntu + Nginx: campus.kongtian.university

状态：**Node standalone 产物已在本机和隔离 Linux 容器中验证；线上服务器、DNS、TLS 和托管 Supabase 尚未验收。** 域名为 `campus.kongtian.university`，Supabase project ref 为 `sttghkavzjeqeuignpwi`。不要把本地 Supabase 的 `127.0.0.1:54321` 编进公开构建。

## 已验证范围（2026-09-23）

- `next.config.ts` 配置 `output: "standalone"`；`npm run build` 产生 `dist/standalone/server.js`、客户端资源和 `public`。Vinext 1.0.0-beta.2 漏打包 React peer dependencies，`scripts/complete-standalone.mjs` 在构建后从锁定的本地安装补齐应用运行依赖。运行入口不依赖 `vinext start` 的本地预览命令。
- Windows Node v22.21.0 把产物复制到仓库之外、没有项目 `node_modules` 的临时目录后启动，首页、`/login`、`/forum`、`/wiki` 和校徽图片返回 200；未登录访问 `/creator` 返回 307；无效登录表单经 Server Action 返回 303 和校验错误。这验证了 HTTP 入口、SSR、静态资源与表单动作，但不代表线上 Auth 成功。
- 使用 `node:22-bookworm-slim` Linux 容器和排除 `.env.local`、`node_modules`、`dist` 的源码快照运行 `npm ci --no-audit --no-fund`、`npm run build`。将产物复制到 `/tmp/release` 独立运行：`smoke-standalone.mjs` 验证首页、登录、论坛、Wiki 和校徽图片均返回 200，登录 Server Action 的无效输入返回 303。此前 Nginx 反代 HTTP 已做可行性验证；本批未测试线上 TLS 或真实服务器。
- 尚未验证真实账号登录/邮件确认、云数据库写入、重启恢复、图片优化和长期负载。`worker/index.ts` 中的 Cloudflare `IMAGES` 绑定用于 Worker 目标，不能假设 Node 目标具备相同图片转码行为；目前品牌图片为静态 PNG。

## 上线前条件

1. DNS 添加 `campus` 的 A 记录指向 Ubuntu 公网 IPv4；若添加 AAAA，IPv6 也必须可达。确认该域名的 80/443 入站端口允许访问。
2. 在托管 Supabase 先核对并执行仓库迁移、Auth 的 Site URL `https://campus.kongtian.university`、允许重定向 URL `https://campus.kongtian.university/auth/callback`、邮件 SMTP/确认模板与公开注册策略。anon/publishable key 从项目设置取得，不在聊天或 Git 中记录。
3. Ubuntu 安装 Node >=22.13、Nginx 和 Certbot；建立服务用户 `ktu`。发布目录 `/srv/ktu-community/current`，配置目录 `/etc/ktu-community`，按实际系统路径调整 systemd 的 `/usr/bin/node`。
4. 构建与运行环境的 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`NEXT_PUBLIC_SITE_URL` 必须一致；前端变量在构建时被内联。线上密钥只放服务主机，绝不提交 `.env.local` 或 `service_role`。`deploy/ubuntu/env.example` 是非秘密样例。

## Ubuntu 操作顺序

在目标主机完成云数据库备份与迁移检查，并将代码部署到 `/srv/ktu-community/current` 后：

```bash
node --version
command -v node
sudo install -d -o ktu -g ktu -m 750 /srv/ktu-community/current
sudo install -d -o root -g ktu -m 750 /etc/ktu-community
# 写入真实 anon key，/etc/ktu-community/ktu-community.env 归 root:ktu、权限 640。
cd /srv/ktu-community/current
set -a; . /etc/ktu-community/ktu-community.env; set +a
npm ci --include=dev
npm run lint && npm run typecheck && npm run build
test -f dist/standalone/server.js
sudo install -m 644 deploy/ubuntu/ktu-community.service /etc/systemd/system/ktu-community.service
sudo systemctl daemon-reload
sudo systemctl enable --now ktu-community
curl -fSI http://127.0.0.1:3000/login
node deploy/ubuntu/smoke-standalone.mjs http://127.0.0.1:3000
```

运行入口仅需要 `dist/standalone` 目录、Node 运行时和环境文件。`smoke-standalone.mjs` 只提交无效登录数据，验证表单错误重定向，不建立账号或修改数据库。若将构建产物从其他主机复制过来，必须在 Linux/glibc 兼容环境构建，不要把 Windows 产物直接传给 Ubuntu。每次修改公开环境变量后重新构建，并检查 `journalctl -u ktu-community -n 100 --no-pager`。

先使用仅监听 HTTP 的 [引导配置](../../deploy/ubuntu/ktu-community.bootstrap.nginx.conf) 签发证书，再切换到 [HTTPS 配置](../../deploy/ubuntu/ktu-community.nginx.conf)。两份配置的 ACME 路径相同，可支持自动续期；若服务器已有其他 Nginx 站点，只添加此域名对应的站点，不覆盖现有配置。

```bash
sudo install -d -m 755 /var/www/letsencrypt/.well-known/acme-challenge
sudo install -m 644 deploy/ubuntu/ktu-community.bootstrap.nginx.conf /etc/nginx/sites-available/ktu-community.conf
sudo ln -s /etc/nginx/sites-available/ktu-community.conf /etc/nginx/sites-enabled/ktu-community.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot certonly --webroot -w /var/www/letsencrypt -d campus.kongtian.university
sudo install -m 644 deploy/ubuntu/ktu-community.nginx.conf /etc/nginx/sites-available/ktu-community.conf
sudo nginx -t && sudo systemctl reload nginx
curl -fSI https://campus.kongtian.university/login
sudo certbot renew --dry-run
```

如果 `sites-enabled/ktu-community.conf` 已存在，核对目标后更新，避免盲目重建符号链接。签证书前先确认 HTTP DNS 从公网能访问；现成证书可以跳过引导阶段。安装/更新后确认浏览器在 HTTPS 域名下可完成注册、邮件确认、登录/退出、Wiki 修订、论坛发布与权限拒绝；查 Nginx 和 systemd 日志，重启服务并重复检查，再对桌面与移动页面验收。未完成这些检查前不宣称上线。
