# 官网与校园站共用百科（2026-10-15）

官网 `kongtian.university/wiki.html` 和详情页只读，均提供“修改”链接，目标为 `https://campus.kongtian.university/wiki`。校园站继续通过 Creator 登录、服务器校验、RLS 和版本化 RPC 创建、修改及恢复词条。

用户补充新增“其他”档案。界面分类为其他、人物、学院、地点；其他内部键为 `article`，使用独立的 `wiki_articles` 表（区别于校刊 `articles`），稳定地址 `/wiki/article/:slug`。现有实体关系表不扩展为通用 JSON，也不把其他词条混入人物/地点引用控件。

## 数据与优先级

官网原始正文来自官网仓库 `js/wiki-data.js`，工具 `tools/export-wiki-canon.mjs` 生成带 SHA-256 的 `wiki-canon.json`。21 条逐一对应：`cs` → 既有 `college/engineering`，`flight` → 既有 `college/military`；其余 19 条导入“其他”。保留学院 UUID、人物关联和全部旧修订。按本次用户“冲突以官网为准”的明确要求，官网的“工程学院”正文与名称覆盖校园站当前的“机械工程学院”对应档案；计算机学院、飞行学院仍为独立档案，不合并或删除。以前学院名称决策在这个冲突条目上由本次要求取代。

`wiki_official_sources` 只存公开对应关系与最后导入的官网原文 hash，匿名只读。`reconcile_official_wiki` 仅受信数据库操作员可执行，普通用户和 service_role 都没有执行权；操作员明确指定已有 Creator，所有正文写入复用创建/修订 RPC，不直接改正文、删除历史或降低版本。

首次导入同地址档案时官网覆盖。后续官网 hash 未变时不写入，因此校园站新增修改继续有效；官网 hash 改变时整个词条的名称、摘要、正文采用官网新版本，并追加修订保留覆盖前版本。不是字段自动合并。同 slug 不同类型仍是不同实体；稳定 ID 不允许静默重新绑定。整批事务与 advisory lock 保证原子性，RPC 行锁和 expectedVersion 防止丢失并发修改。删除官网源词条不会自动删除共享档案。

## 阅读接口与官网

`GET /api/wiki/public` 使用全新的匿名 Supabase client，忽略请求者 Cookie。四类公开实体及 source metadata 分页读取（每页 200，每类上限 10000，超限明确 503），CORS `*`、无凭据、`Cache-Control: no-store`。不暴露 Creator 私有资料、草稿、密钥或写接口。Markdown 使用 remark/GFM → HTML，原始 HTML 丢弃。官网再按元素及 URL 协议白名单清洗，动态标题/摘要使用 textContent 或转义；相对链接和媒体归属校园站源。

官网每次打开页面读取最新公开内容。已有官网词条只有在本地原文 hash 与接口记录的官网基线一致时才采用共享内容；基线不同则保留官网内容，避免未完成发布的旧共享正文覆盖官网新稿。校园站新增词条追加到目录、搜索、导航和球体。超时/接口失败仍可读取原 21 条官网存档；仅存在校园站的条目会提示暂时不可读取并提供校园站入口。更新在重新打开/刷新页面时发生，不宣称持续推送。接口不存在时不要先发布官网新版。

## 界面边界

主题为校园百科，读者查阅、创作者贡献。保留蓝白配色（sky #eaf4fc、sea #5ba3d9、cloud #1e4a72、ink #16324f、paper #fff）、Fraunces/Noto Serif 标题与 Outfit/Noto Sans 正文、原词条球体和百科左右栏；仅增加修改入口及下方名称/摘要检索列表。没有另建通用后台或卡片仪表盘。列表桌面两列、手机单列，原生链接/搜索框保留键盘与焦点样式，动态状态有 role=status；新增部分没有动画。登录、过期冲突和恢复复用既有工作流。

## 发布与后续官网修订

1. 官网执行 `node tools/export-wiki-canon.mjs` 并审阅生成清单。
2. 校园站先事务应用 `202610150001_shared_wiki.sql` 并登记 migration；准备命令 `node scripts/prepare-official-wiki.mjs <清单路径> <维护Creator UUID> <SQL输出路径>` 只生成可审阅 SQL，不联网或执行。可信管理连接执行生成 SQL（建议先用 ROLLBACK 演练），核对记录/修订和公开内容。
3. 构建并发布校园站 Linux standalone 到既有 deploy/runtime，使用现有更新脚本和回滚版本。
4. 验证公开接口后，再发布官网静态产物；验证两端阅读、修改跳转与移动端。
5. 以后只在校园站编辑时无需重复导入或重建官网。官网原文有新稿时必须重新导出、审阅并执行导入，再发布官网；目前没有后台定时扫描仓库或自动替用户发布内容。

未迁移/未发布前，本地通过不等于线上已经互通。验收以 engineering/verification.md 最新记录为准。


## 2026-10-15 正式交付

用户已明确授权，生产迁移与 21 词条官网优先导入已完成。其他 19 条、总档案 47 条；官网只读、校园站编辑、跨站读取/修改跳转、历史版本及390px页面已完成生产验证。校园站 runtime 020a810，官网 deploy c675873，均已发布并保留回滚。完整证据与真实账号写入验收边界见 engineering/verification.md 最新记录（design 文档请参考 ../engineering/verification.md）。此前待授权/未上线描述为历史记录。


## 2026-10-24 · 设定撤下与周延

当前官网仍为21条基线：撤下mark，新增student/zhouyan；其余18个article、2个college保持对应关系。官网周延正文由characters-data共用档案生成，wiki页面先载入人物数据，清单导出工具也按相同顺序读取。新人物关联现有arts学院，正文和院系名册均为艺术学院，未编造年龄、头像或其他设定。

wiki_articles.retired_at仅用于撤下设定，restrictive SELECT RLS隐藏当前词条，触发器阻止修订RPC改写已撤下正文。原实体和修订在后台保留；旧mark正文先经修订RPC清空后撤下，官网清单缺少条目本身仍不会自动撤下共享数据。此次明确使用scripts/update-canon-20261024.mjs生成可审阅的操作员SQL，保留5位现有人物的非目标内容、所有旧修订及无关表指纹。仅本次明确撤下mark，未引入自动批量删除。
