/* eslint-disable @next/next/no-img-element -- Local, original UI screenshots; native image keeps intrinsic dimensions and opens at full resolution. */
type Mark = { x: number; y: number; w: number; h: number; label: string; text: string };
type Capture = { title: string; width: number; height: number; marks: Mark[] };
const captures: Record<string, Capture> = {
  identity: { title: "建立论坛身份", width: 960, height: 578, marks: [
    { x: 0, y: 5.54, w: 100, h: 7.85, label: "账号标识", text: "填写 @ 后面的名字，例如 night_study；使用 2–32 位英文字母、数字或下划线。" },
    { x: 0, y: 22.39, w: 100, h: 7.85, label: "显示名称", text: "填写帖子里显示的昵称，例如“晚自习观察员”，可以用中文。" },
    { x: 0, y: 55.85, w: 100, h: 7.62, label: "关联人物档案（可选）", text: "可以保持“不关联，独立论坛身份”。包括学生在内的所有身份类型，都无需先创建人物档案。" },
    { x: 88.91, y: 91, w: 11.09, h: 9, label: "建立身份", text: "填写完成后点击这里。以后可从创作中心的“论坛身份”列表修改资料、补充头像或关联人物。" },
  ] },
  "forum-start": { title: "建立一篇论坛草稿", width: 960, height: 135, marks: [
    { x: 0, y: 45.05, w: 54.39, h: 33.66, label: "主题标题", text: "填写读者进入帖子前看到的标题。示例是“今晚有人一起去观星吗？”" },
    { x: 56.47, y: 46.04, w: 22.92, h: 32.67, label: "版面", text: "选择这篇讨论所属的校园版面。" },
    { x: 81.47, y: 40.1, w: 18.53, h: 38.61, label: "建立草稿并编排楼层", text: "点击后进入楼层编辑页。还没有发言身份时，页面会先引导你建立身份。" },
  ] },
  "forum-floor": { title: "一条发言要填什么？", width: 960, height: 417, marks: [
    { x: 0, y: 34.61, w: 32.64, h: 10.57, label: "发言身份", text: "选择这句话由哪个账号说。一个帖子可以切换多个自己管理的身份。" },
    { x: 33.68, y: 34.61, w: 32.64, h: 10.57, label: "回复对象", text: "开帖时选“独立发言”；接别人的话时选对应楼层。只能回复它之前的楼层。" },
    { x: 0, y: 48.06, w: 100, h: 23.58, label: "正文", text: "在这里写角色说的话。旁边的“戏内时间”可填写故事里的时间，例如 20:10。" },
    { x: 0, y: 74.53, w: 35, h: 9.61, label: "👍 赞同 / ？疑惑", text: "填写剧情里的整数数量，默认 0。数量由作者编写，读者不会通过点击改变它。" },
    { x: 15.23, y: 86.06, w: 7.98, h: 9.61, label: "↳ 添加回复", text: "点击这条发言下方的按钮，在它的分支里续写。要另起一条，则用编辑页底部的“＋ 添加独立发言”。" },
  ] },
  "forum-publish": { title: "保存与发布不是同一个操作", width: 960, height: 86, marks: [
    { x: 74.84, y: 19.53, w: 11.09, h: 60.94, label: "保存草稿", text: "先保存再离开；以后从创作中心或“我的草稿”继续写。当前页面不会自动保存。" },
    { x: 87.17, y: 19.53, w: 11.09, h: 60.94, label: "发布主题", text: "发布后读者可以看到，主题与楼层会冻结，不能直接改写。请先用“阅读预览”检查一遍。" },
  ] },
  "wiki-markdown": { title: "Markdown 正文编辑器", width: 760, height: 655, marks: [
    { x: .09, y: 9.87, w: 99.82, h: 8.65, label: "格式工具栏", text: "选中文字后点“粗体”“斜体”；点“表格”或列表按钮会插入可修改的示例，不用自己记语法。" },
    { x: 76.54, y: 1.93, w: 21.27, h: 6.11, label: "编辑 / 分栏 / 预览", text: "编辑只看输入，分栏同时看两侧，预览只看排版效果。手机分栏会上下排列。" },
    { x: .09, y: 18.53, w: 49.91, h: 75.36, label: "左侧：输入内容", text: "例如 **活动安排** 会显示为粗体。表格每行写一条记录，替换示例文字即可。" },
    { x: 50, y: 18.53, w: 49.91, h: 75.36, label: "右侧：实际排版", text: "对照这里检查标题、列表和表格。预览不会保存内容，完成后仍要点击页面的建立或保存按钮。" },
  ] },
  "wiki-history": { title: "修订历史：选择两版，看清变化", width: 1002, height: 666, marks: [
    { x: 0, y: 10.22, w: 100, h: 17.2, label: "从版本 → 到版本", text: "选择要比较的旧版和新版。截图中是 v1 与 v2 的对比。" },
    { x: 0, y: 38.6, w: 27.94, h: 38.75, label: "修订记录", text: "这里列出修改说明、作者和时间。点击记录，也能切换到对应版本。" },
    { x: 30.74, y: 43.57, w: 69.26, h: 44, label: "差异内容", text: "＋ 是新增，− 是删除。截图中的新增行是补充的 19:30 观测安排。" },
    { x: 30.74, y: 91.18, w: 69.26, h: 8.82, label: "查看完整档案", text: "展开后查看“到版本”的完整内容，再决定是否需要恢复。" },
  ] },
  "wiki-restore": { title: "恢复前，再确认一次", width: 694, height: 135, marks: [
    { x: 0, y: 61.39, w: 18.47, h: 38.61, label: "确认恢复 v1", text: "先把“到版本”选为旧版，再展开“恢复此版本…”。确认后会创建新版本，保留此前所有历史。恢复针对整份档案。" },
  ] },
  "press-blocks": { title: "校刊正文：按段落组织文章", width: 900, height: 892, marks: [
    { x: 2.3, y: 17.06, w: 95.41, h: 5.24, label: "段落样式", text: "把每段设为“正文”“小标题”或“引文”，再在下面输入对应文字。" },
    { x: 2.3, y: 6.96, w: 95.41, h: 4.71, label: "调整段落", text: "↑ / ↓ 改变顺序，“删除”移除这一段。先写再调整结构也可以。" },
    { x: 0, y: 83.67, w: 100, h: 4.71, label: "添加段落 / 引用档案", text: "继续写下一段，或从已有校园档案里选择引用。没有可选档案时，引用按钮不可用。" },
    { x: 0, y: 88.38, w: 100, h: 11.62, label: "选择图片", text: "上传 JPEG、PNG 或 WebP，最大 10MB。完成后填写图片说明，并在预览中确认显示正常。" },
  ] },
  "press-publish": { title: "检查文章，再保存或发布", width: 900, height: 63, marks: [
    { x: 70.44, y: 32.98, w: 10.15, h: 67.02, label: "阅读预览", text: "查看当前输入的排版，不代表已经保存。" },
    { x: 81.93, y: 32.98, w: 6.59, h: 67.02, label: "保存", text: "保存草稿，之后从“我的文章”或创作中心继续编辑。" },
    { x: 89.85, y: 32.98, w: 10.15, h: 67.02, label: "发布文章", text: "文章使用你的创作者资料署名。已发布的文章仍可从创作中心进入编辑。" },
  ] },
  "event-timeline": { title: "事件时间线：一件事，一步步记录", width: 850, height: 546, marks: [
    { x: 5.65, y: 26.67, w: 43.18, h: 8.49, label: "时间标记", text: "填写这个节点发生的时间，例如“19:00”或“秋季学期开学日”。" },
    { x: 51.18, y: 26.67, w: 43.18, h: 8.49, label: "节点标题", text: "用一句话概括这个阶段，例如“图书馆门口集合”。" },
    { x: 5.65, y: 44.14, w: 88.71, h: 23.12, label: "经过", text: "写清具体发生了什么。下方按钮可以调整节点顺序或移除节点。" },
    { x: 3.06, y: 87.11, w: 93.88, h: 8.13, label: "＋ 添加时间节点", text: "继续添加下一阶段。已有补充材料引用的节点需要保留。" },
  ] },
};

export function ScreenshotGuide({ name }: { name: keyof typeof captures }) {
  const shot = captures[name];
  return <figure className="guide-capture">
    <figcaption><h3>{shot.title}</h3><span>原界面截图 · 演示数据 · 点击图片查看原图</span></figcaption>
    <a className="guide-capture-image" href={`/guide/${name}.png`} target="_blank" rel="noopener noreferrer" aria-label={`查看${shot.title}原图（新标签页）`}>
      <img src={`/guide/${name}.png`} width={shot.width} height={shot.height} alt={`${shot.title}，图中编号对应下方操作说明。`} loading="lazy" />
      {shot.marks.map((mark, index) => <span key={mark.label} className="guide-capture-mark" aria-hidden="true" style={{ left: `${mark.x}%`, top: `${mark.y}%`, width: `${mark.w}%`, height: `${mark.h}%` }}><b>{index + 1}</b></span>)}
    </a>
    <ol className="guide-capture-legend">{shot.marks.map((mark, index) => <li key={mark.label}><span className="guide-legend-number" aria-hidden="true">{index + 1}</span><div><strong>{mark.label}</strong><p>{mark.text}</p></div></li>)}</ol>
  </figure>;
}
