# Ubuntu + Nginx 部署可行性与预备配置

状态：**Linux 构建与 Nginx HTTP 反代已实测；公开生产运行仍未验收。** 本页是面向公开测试版的准备材料，不代表已有云服务器、HTTPS、Supabase 云项目或域名验收。当前 `vite.config.ts` 使用 Vinext、Sites 插件及 Cloudflare Vite 插件，`worker/index.ts` 使用 Cloudflare `ASSETS`、`IMAGES` 绑定；不要把 `dist/server/index.js` 当作普通 Node HTTP 程序直接执行。

## 已有证据（2026-09-23）

- 隔离的官方 `node:22-bookworm-slim`（Debian/glibc，Node v22.23.2）容器中，从源码快照执行 `npm ci --no-audit --no-fund`、`npm run build`，构建通过。快照排除了 `.env.local` 等本地密钥和缓存。
- 同一 Linux 镜像运行 `npm run start -- -H 127.0.0.1 -p 3037`，日志确认 `http://127.0.0.1:3037`；Nginx `nginx -t` 通过，从 Nginx 代理请求首页与 `/login`，HTTP 均为 200。
- 仅设置 `HOST=127.0.0.1` 的另一次实测显示监听 `0.0.0.0`；服务模板使用显式 `-H 127.0.0.1`。WSL Ubuntu 本机有 Node v24.19.0，但 `npm ci` 因 WSL DNS `EAI_AGAIN` 未完成，因此没有宣称 Ubuntu 发行版实测通过。
- `vinext` 随包 README 把 `vinext start` 定义为本地生产预览，用于测试；它说明 Node standalone 需要 `next.config.*` 的 `output: 'standalone'`，或经 Nitro Node 预设构建。本仓库尚未启用这些生产部署目标。Nginx 能代理现有预览服务，是协议层可行性证据，不等于长期生产可用性或官方生产支持证明。
- 未验证 TLS、外网 DNS、Supabase 云 Auth 邮件与回调、Server Action 登录写入、持续运行后的重启恢复、图片优化和高并发。`/_vinext/image` 的 Worker `IMAGES` 绑定须单独检查；不要以首页 200 推断图片处理路径通过。

## 模板及使用前提

- [环境变量样例](../../deploy/ubuntu/env.example)：只含浏览器公开配置。实际文件放 `/etc/ktu-community/ktu-community.env`，替换域名与 Supabase 云项目；**不要使用本地 `127.0.0.1:54321`**，也不要把 service-role key 放入 `NEXT_PUBLIC_*` 或 Git。
- [systemd 样例](../../deploy/ubuntu/ktu-community.service)：假设 Node/npm 安装于 `/usr/bin`、发布目录为 `/srv/ktu-community/current`、专用服务用户为 `ktu`。在目标主机核对 `command -v npm`、`node --version`、目录/文件权限后调整路径。
- [Nginx 样例](../../deploy/ubuntu/ktu-community.nginx.conf)：需替换 `server_name` 与证书路径。模板的 TLS 证书位置是假设，不会自动签发证书；Nginx 仅监听公网 80/443，Node 只监听本机 127.0.0.1:3000。

部署时保留完整依赖，当前 `vinext`、Vite 和 Cloudflare 插件在 `devDependencies` 中；仅做 `npm ci --omit=dev` 后运行现有 `npm run start` 不具备依据。构建时与运行时均提供相同的 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`NEXT_PUBLIC_SITE_URL`；不要将运行时环境替换为不同项目后沿用旧客户端构建。Supabase Auth 站点 URL 与允许的确认回调 URL 也应为实际 HTTPS 域名的 `/auth/callback`。

一个目标主机上的验收顺序示例（先备份并独立准备云数据库迁移）：

```bash
node --version  # >=22.13.0
sudo install -d -o ktu -g ktu -m 750 /srv/ktu-community/current
sudo install -d -o root -g ktu -m 750 /etc/ktu-community
# 放入代码及已替换值的 /etc/ktu-community/ktu-community.env；文件权限 640。
cd /srv/ktu-community/current
set -a; . /etc/ktu-community/ktu-community.env; set +a
npm ci --include=dev
npm run lint && npm run typecheck && npm run build
sudo install -m 644 deploy/ubuntu/ktu-community.service /etc/systemd/system/ktu-community.service
sudo systemctl daemon-reload
sudo systemctl enable --now ktu-community
curl -fSI http://127.0.0.1:3000/login
# 证书准备完成并替换域名后安装 Nginx 模板，先运行 nginx -t，再 reload。
```

真实放行还应在 HTTPS 域名下测试注册/确认/登录/退出、Wiki 与论坛写入及权限拒绝、静态资源和图片、桌面与移动端，并检查 `journalctl -u ktu-community`、Nginx 日志、systemd 重启及备份恢复。当前方案仍使用 Vinext 预览进程；如公开流量要求稳定生产宿主，应先评估显式 Node standalone/Nitro 部署目标或 Cloudflare Worker 正式部署，并把对应配置和端到端证据纳入仓库。
