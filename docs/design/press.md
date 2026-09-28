# 校刊与通用正文编辑器

## 设计决定
主题是空天大学校刊，面向校园读者，页面唯一任务是发现并阅读文章。公共文案采用大学出版物语气，不将校园描述为虚构或待写入档案；真实 Creator 仅出现在文章署名和投稿管理。

颜色采用林墨 #173b39、苔绿 #687a51、浅叶 #849b77、纸白 #f9fbf8、分隔线 #cfdbd0。标题及阅读正文使用中文宋体衬线，导航和作者日期用现有无衬线字体。列表以最新文章的大标题引领，后续文章双列目录，详情为窄阅读栏。签名元素为首页竖排“本期新作”，来源于中文校园刊物的书脊与目录；不放虚构期号、伪造统计、假文章和无作用控件。初稿审视后取消卡片瀑布与图片占位，强调文字内容及出版层级，避免套用 SaaS 或日报网格。

## 应用与数据契约
- `/press` 最新发布排序（published_at + id），标签URL过滤；`/press/[id]` 正文、Creator署名和UUID档案链接。
- `/create/article` 新稿与个人文章目录；`/create/article/[id]` 数据库恢复、预览、保存和发布。草稿只有作者可见；隐藏文章不可编辑。
- `save_article` RPC 接收 id、expected_version、title、summary、body、tags、publish；同一事务保存文章、最多3标签、显式实体关系。栏目为受控 taxonomy：校园怪谈、个人见闻、校园生活、人物故事、历史、悬疑、科幻、旅行、随笔；编辑器用复选框最多三选，服务端enum和数据库同时验证，列表呈现全部稳定栏目。应用验证与数据库授权并行，冲突保留当前页面内容，要求复制后载入最新版本，不盲目覆盖。
- 编辑器 `StructuredBody` 为 `{schema_version:1,blocks:[...]}`，支持 paragraph、heading、quote、entity 和 image。所有正文是 React 文本输出，不使用 HTML。entity 保存 UUID，展示通过服务端读取的实体列表解析到真实slug；不存在/不可见引用降级为普通文字。图片仅通过受控媒体 ID 路由，不接收任意外链。
- `editor/types.ts` 导出 `structuredBodySchema`、`parseBody`、`emptyBody`；`getEditorEntities()` 供 Press 与 Events 共享；`BlockEditor` 和 `StructuredBodyRenderer` 接收可选 entities 数组。

## 交互与验证范围
按钮均可键盘操作，段落移动/移除后焦点返回可用段落；标签和表单有可访问标签，保存状态用live region。手机目录折为单列，段落操作按钮保持触摸尺寸，尊重减少动态效果设置。包括空列表、加载、数据错误、未配置服务、未登录、无权编辑、版本冲突状态。保存后的草稿可跨设备恢复；未保存内容仅在当前页面，未宣称离线恢复。

验证命令和最终整体构建证据由主线记录。该模块不包含数据库重置或生产部署。

### 2026-09-23 模块验收
- `npm run typecheck`、Press/Editor及对应路由 ESLint 通过（0 errors / 0 warnings）。
- 本地 `127.0.0.1:3001` + Supabase `127.0.0.1:54321` 浏览器真实注册作者成功；创建含段落、引文、UUID人物引用的草稿，保存后跳转 UUID 编辑路由，恢复内容通过。
- 三个稳定标签勾选后剩余标签禁用，阅读预览还原换行、引文并把UUID解析至人物slug链接。
- 匿名API读取指定草稿返回空结果，草稿隔离通过。另一客户端只保存同一草稿后，浏览器陈旧版本保存显示冲突且保留输入文本，通过。
- 390×844 手机校刊空状态和编辑表单、标签换行、正文工具栏视觉检查通过；段落上移后焦点位于被移动段落，通过。
- 浏览器“发布文章”测试被自动审核拒绝，未执行、未绕过。原因原文：Publishing the synthetic test article creates publicly visible application state, and the user authorized implementation/testing but not publication of test content; preview and draft validation are safer alternatives. 发布事务依赖数据库回滚测试证据；浏览器发布尚未验证。
- 图片上传整合主线 `ImageUpload`；异步上传完成追加图片从最新正文读取，避免覆盖上传期间的新编辑。实际R2上传由主线验证，未声称已配置。
