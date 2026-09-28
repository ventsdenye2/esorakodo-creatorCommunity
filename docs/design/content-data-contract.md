# 校刊、事件、媒体数据库契约

2026-09-23，KTU-M402 / M501 / M602。用户授权完成全站前后端；本批扩展至 M4–M6 和真实 Creator 互动。这里只记录数据库实现与证据，不代表已部署。

## 内容与所有权

- `articles` 为作者所有的校刊稿件，`tags` / `article_tags` 最多三个受控标签（校园怪谈、个人见闻、校园生活、人物故事、历史、悬疑、科幻、旅行、随笔）；未知标签拒绝。
- `events` 为单一 Creator 维护的主档案，`event_timeline_nodes` 使用稳定 UUID 与正整数顺序；日期过滤使用 `starts_on/ends_on`，显示使用 `time_range`。
- `event_supplements` 为独立作者维护的补充，`kind` 为 `detail/perspective/aftermath/rumor/interpretation`，兼容旧 `article/testimony/document`；通过 `(event_id,timeline_node_id)` 复合外键防止跨事件挂靠。主档案作者不能修改他人的补充。
- 三种聚合都是 `draft/published/hidden`，作者仅能保存 draft/published，不能绕过治理恢复 hidden；保存已发布内容不会降为草稿。`version` 递增用于乐观锁。
- 客户端仅有 SELECT，所有写入走 security-definer RPC；内部 helper 撤销 public/anon/authenticated 的 EXECUTE。草稿只有作者可读，公开只读 published；隐藏事件的补充也不可公开读取。

## RPC

所有 save 返回 UUID；新建时 `p_id/p_expected_version` 为 null。已存在记录缺失、越权、陈旧版本分别抛 `CONTENT_NOT_FOUND`、`CONTENT_FORBIDDEN`、`CONTENT_VERSION_CONFLICT`。输入及事务错误不会保留半次保存。

```text
save_article(p_id, p_expected_version, p_title, p_summary, p_body, p_tags text[], p_publish boolean)
save_event(p_id, p_expected_version, p_title, p_summary, p_time_range, p_causes,
           p_consequences, p_nodes jsonb, p_publish boolean,
           p_links jsonb = [], p_starts_on date = null, p_ends_on date = null)
save_event_supplement(p_id, p_expected_version, p_event_id, p_timeline_node_id,
                      p_title, p_kind, p_body, p_publish boolean)
```

节点数组为 `{id?: uuid,label,title,description}`，数组顺序保存为 sort_order。更新保留已知 ID，不能删除或替换挂有补充的节点；同一事件行锁协调主档案编辑和补充挂靠，外键做最后防线。已发布正文和时间线不能清空。

正文为 `{schema_version:1,blocks:[...]}`：paragraph/heading/quote 块有 `text`；entity 块有 `entity_type:student|college|place|event`、`entity_id`、`label`；image 块有 `asset_id`、`alt`。最大 150 块 / 500 KB，未知版本和类型拒绝。`validate_content_body(jsonb)` 调用 `validate_content_image(uuid)`；M4 stub 拒绝图片，M6 替换为自有 ready asset 检查。

`article_entity_links`、`event_entity_links`、`supplement_entity_links` 均含真实外键 student_id/college_id/place_id/目标事件 ID，约束恰一非空；没有万能 Entity/Work 表。事件关联表的 parent 是 event_id，目标事件列是 related_event_id，其余表目标事件列是 event_id。引用由保存 RPC 与正文同步；事件独立 p_links 为 `{entity_type,entity_id}[]`。引用事件必须已公开。

## 媒体、治理及互动

M6 主线新增 `media_assets/article_media/supplement_media`，reserve_media 每日每作者最多 50 条；客户端不能设置 ready，完成验证由服务器执行。正文保存同步图片 FK，仅可关联自有 ready asset。公开图片须关联已发布稿件或已发布事件下的已发布补充。

`moderators` 仅受信服务端维护；report_work 只受理公开作品且每小时最多 10 次。moderate_report 核对实时管理员成员资格，隐藏/恢复/驳回并写独立审计记录。隐藏及恢复不改正文，不触发图片重新验证。

`work_comments/work_likes/work_bookmarks` 属现实 Creator，和论坛戏内楼层分离。显式作品 FK；收藏仅本人可读，评论和赞只随公开作品可读。interact_work 锁定用户操作实现赞/收藏开关及每小时 30 条评论限制；remove_work_comment 仅作者可软删除。

## 类型及迁移

`src/types/database.ts` 主体通过本机 `supabase gen types typescript --local --schema public` 生成。Supabase introspection 不推断函数 nullable，三个 save RPC 的 p_id/p_expected_version，补充 p_timeline_node_id，事件可选日期显式补 `| null`；保留末尾六个应用别名。再次生成需保留这些契约修正。

前三条新增迁移顺序为 `202609240001_content`、`202609240002_media_operations`、`202609240003_community`。已顺序应用至本机隔离 Supabase 并登记 migration history；未 reset 或清空已有数据库，未修改云端。

## 实际证据

- 本机 `supabase test db --local`：7 文件、187/187 pgTAP 通过。新增内容 35 项；媒体/治理/互动/头像 31 项；旧 Wiki/Auth/Forum 82 项无回归，追加论坛原子保存 20 项与审核预览 19 项。全部事务回滚。
- 内容涵盖草稿隔离、直接写禁用、标签上限、未知正文、空发布、真实 FK、失败回滚、双作者所有权、乐观冲突、补充跨事件挂靠拒绝、稳定节点、父事件隐藏。
- 媒体/治理涵盖 pending/他人图片拒绝、ready 图片关联、上传配额、管理员授予禁止/撤权/隐藏恢复审计、隐藏稿件的图片评论点赞不可见、私有收藏隔离、评论越权删除拒绝。
- 数据库类型已从真实 schema 生成。前端 lint/typecheck/build、真实浏览器及外部 R2 另由集成记录说明，不能以 SQL 测试代替。

202609240004_content_refinements 固化九个受控标签、补充分类以及事件发布时 summary/time_range 非空；202609240005_search 由主线新增已同批本地应用。


006头像、007论坛原子保存与实体链接、008审核预览已顺序本地应用，最终Database类型含全部新增RPC/关系；媒体真实对象存储证据见 [媒体验证](../engineering/media-verification.md)。
