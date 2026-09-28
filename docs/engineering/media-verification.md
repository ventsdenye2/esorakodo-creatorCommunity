# 媒体服务实现与验证

2026-09-23 · KTU-M603 / M604 / M606。当前实现可在 Node standalone 内完成私有图片上传；未配置 R2 时 UI/API 明确返回不可用，不创建假 URL。

## 实际修复

初版 AWS SDK 在当前 Vinext/Cloudflare 构建中混合 Node 与 browser runtimeConfig，生产产物初始化 S3Client 抛 TypeError，签名 API 返回 503。已将 `src/features/media/storage.ts` 隔离适配器替换为 `aws4fetch` 1.0.20 的 Web Crypto SigV4，避免更改全站构建解析规则。AWS S3 SDK 仅作为 MinIO 测试建桶的 devDependency，生产 standalone runtime 依赖从 42 降为 17 个包。

上传签名有效 300 秒，`allHeaders:true` 绑定 Content-Type、Content-Length、If-None-Match。If-None-Match 固定 `*`，对象创建后相同签名也不能覆盖，避免验证完成后重用凭证更换图片。服务端通过带 15 秒超时的 HEAD 核对类型/长度，再以签名 Range GET 读前 16 字节验证 PNG/JPEG/WebP；不跟随重定向。ready 更新包含 pending 条件并确认实际返回行，并发隐藏不会被误报为完成。

读取 `/api/media/[id]` 先走用户的 Supabase RLS，仅 ready 记录可换取 60 秒对象地址；响应 private/no-store。正文内只保存稳定 asset UUID。图片 API 以同源 Origin 和真实 Auth 会话保护写入。`server.ts/storage.ts` 引入 server-only 编译围栏，服务密钥和对象存储密钥不进入客户端组件。

## 实际运行证据

```powershell
npm run build
node --conditions=react-server --experimental-strip-types tests/local-media.test.mjs
npx supabase test db --local
```

本次完整通过。媒体测试使用 `quay.io/minio/minio:RELEASE.2025-04-22T22-12-26Z` 官方镜像，digest `sha256:a1ea29fa28355559ef137d71fc570e508a214ec84ff8083e39bc5428980b015e`；Docker Hub 拉取不可用后切换官方 Quay。临时对象存储仅监听 127.0.0.1:19000，数据使用 tmpfs；独立 Node standalone 仅监听 127.0.0.1:3005，未修改共享预览或 .dev.vars。测试凭据随机生成，仅存进程内存，不输出到日志。结束精确删除测试账号/资产并移除该次临时容器。

通过的真实对象存储/API行为：

- 同源未登录请求 401，异源上传/完成请求 403。
- 上传凭证包含签名类型与条件写入头，无空 CRC32；修改 MIME 头被对象存储 403 拒绝。
- 首次 PUT 成功，重复 PUT 返回 412；待完成图片即使作者也不能读取。
- 他人无法完成上传（404）；本人完成后读取返回 302，真实对象响应字节与 PNG 样本完全一致。
- 未被公开作品引用的图片对匿名和其他作者均返回 404。
- 同类型同大小但伪造 PNG 魔数被完成接口 400 拒绝；HEAD 大小不符被拒绝。

本测试没有创建或发布任何公开作品。公开稿件/隐藏稿件/隐藏父事件的媒体可见性、头像及权限通过 pgTAP 的 **事务内样本并最终 ROLLBACK** 验证。最终全库 7 文件、187/187 断言通过；其中 M6/互动/头像 31 项。独立 typecheck、媒体目录 ESLint、构建通过。

## R2 部署配置与未验证边界

环境变量在受保护的服务器进程中设置：R2_ENDPOINT 为账户 S3 API 根地址，R2_BUCKET 为私有桶，R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY 为对象权限凭据，R2_FORCE_PATH_STYLE=true，SUPABASE_SERVICE_ROLE_KEY 为服务端数据库权限。不要开启公共桶 URL，不要把任何这些私密值加入 NEXT_PUBLIC_ 变量。

桶 CORS 需允许正式站点的精确 HTTPS Origin，Methods 至少 PUT / GET / HEAD，AllowedHeaders 包含 Content-Type / If-None-Match；可包含 Content-Length 以覆盖客户端差异。不要把签名 URL 放日志或持久化正文。部署前在实际浏览器验证 OPTIONS 预检与上传，测试环境可另外增加确切的 loopback Origin。

本批实测证明 MinIO S3 兼容接口和 Node standalone 私有生命周期；**未连接真实 Cloudflare R2 桶，未执行正式域名跨域浏览器预检**。真实桶策略、凭据范围、CORS、配额与公开作品图片展示仍属部署前验收。对象读取签名已有最多 60 秒有效期，隐藏后新签名立即停止，已经签发的对象地址可能在剩余有效期内继续可读。
