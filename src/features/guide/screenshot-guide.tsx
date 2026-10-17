/* eslint-disable @next/next/no-img-element -- Local, original UI screenshots; native image keeps intrinsic dimensions and opens at full resolution. */
type Mark = { x: number; y: number; w: number; h: number; label: string; text: string };
type Capture = { title: string; width: number; height: number; marks: Mark[] };
const captures: Record<string, Capture> = {
  "forum-natural-first": { title: "先写下楼主首帖", width: 960, height: 942, marks: [
    { x: 0, y: 1.06, w: 100, h: 7.75, label: "帖子标题", text: "直接改这里，和读者看到的帖子标题保持一致。" },
    { x: 2.60, y: 35.92, w: 31.74, h: 4.67, label: "默认身份", text: "昵称和字头像已自动准备好；点击可选其他身份、改昵称或上传头像。" },
    { x: 2.60, y: 42.08, w: 94.79, h: 10.49, label: "第一条消息", text: "写楼主想说的话，也可以粘贴图片。还没有首帖时，先完成这一条。" },
    { x: 86.24, y: 59.15, w: 11.16, h: 5.52, label: "发出首帖", text: "将消息加入当前帖子，随后就能像回帖一样继续写。离开前检查顶部同步状态。" },
  ] },
  "forum-natural-menu": { title: "点击消息，选择下一步", width: 520, height: 508, marks: [
    { x: 4.81, y: 16.73, w: 90.38, h: 9.45, label: "回复", text: "在底部输入框接着写，新消息追加末尾并引用这条消息。" },
    { x: 4.81, y: 65.94, w: 90.38, h: 9.45, label: "设为楼主", text: "把所选消息切换为楼主身份，昵称、头像和楼主标记一起跟随。" },
    { x: 4.81, y: 75.79, w: 90.38, h: 9.45, label: "向上插入楼层", text: "在这条消息之前插入发言，已有回复仍指向原消息。首楼前不能插入。" },
    { x: 4.81, y: 85.63, w: 90.38, h: 9.45, label: "角色身份选择", text: "不是必填步骤。需要时选择已有身份，或设置昵称和头像；编辑和反应数也在本菜单里。" },
  ] },
  "forum-natural-thread": { title: "在成品样式中继续讨论", width: 960, height: 1648, marks: [
    { x: 95.42, y: 22.09, w: 4.58, h: 2.67, label: "消息操作", text: "点击消息正文或右上角的省略号，打开操作弹窗。键盘可用 Tab 到达这个按钮。" },
    { x: 0, y: 59.34, w: 100, h: 21.99, label: "底部发言框", text: "直接发表独立发言，或在选中回复对象后继续写。取消引用不会清空正文。" },
    { x: 0, y: 82.54, w: 100, h: 3.22, label: "帖子设置与导入", text: "版面、标签、关联档案和 Markdown 导入都收在这里，需要时再展开。" },
    { x: 0, y: 9.57, w: 100, h: 4.49, label: "同步状态", text: "离开前确认同步完成。首次发布由作者负责；发布后的有效改写实时公开。" },
  ] },
  "forum-collaboration": { title: "同步改写，继续共同创作", width: 960, height: 330, marks: [
    { x: 0, y: 48, w: 25, h: 22, label: "真实在线成员", text: "这里显示正在打开作品的创作者；下方提示对方正在查看或编辑的位置。" },
    { x: 77, y: 52, w: 11, h: 14, label: "同步状态", text: "确认“改写已同步”后离开。断线或内容不完整时，这里会给出相应提示。" },
    { x: 88.5, y: 52, w: 11.5, h: 14, label: "管理协作者", text: "只有作者可以添加或移除协作者。首次发布也由作者完成。" },
    { x: 0, y: 76, w: 100, h: 12, label: "实时公开", text: "已发布作品的有效改写会直接同步给读者，无需再次发布。" },
  ] },
  "forum-members": { title: "按创作者账号邀请", width: 520, height: 475, marks: [
    { x: 4.81, y: 31.6, w: 90.38, h: 10, label: "输入创作者 @账号", text: "填写对方的创作者账号。故事里的论坛身份不能代替这个账号。" },
    { x: 4.81, y: 44.6, w: 24, h: 11, label: "添加协作者", text: "添加后，对方能从自己的创作中心进入，并同时改写这个帖子。" },
    { x: 82, y: 78, w: 13, h: 10, label: "移除成员", text: "停止对方后续读写，已经写入的贡献继续保留。" },
  ] },
  "markdown-import": { title: "把 Markdown 文件填入编辑器", width: 900, height: 625, marks: [
    { x: 1.85, y: 18.98, w: 96.3, h: 7.73, label: "选择文件", text: "下载对应模板，整理好作品后选择 UTF-8 的 .md 文件。也可以直接粘贴全文。" },
    { x: 1.85, y: 37.59, w: 96.3, h: 36.62, label: "核对文件内容", text: "这里显示读取的全文，可以修改格式。格式说明、完整模板和 AI 提示词见本节下方。" },
    { x: 1.85, y: 79.8, w: 96.3, h: 6.5, label: "确认替换", text: "导入会替换当前编辑内容。论坛还会创建缺少的独立身份，请确认后再继续。" },
    { x: 1.85, y: 89.95, w: 17.93, h: 7.38, label: "导入并填入编辑器", text: "格式正确时填入内容；有错误会提示并保留原输入。完成后检查内容与同步状态，再由作者首次发布。" },
  ] },
  identity: { title: "建立论坛身份", width: 960, height: 578, marks: [
    { x: 0, y: 5.54, w: 100, h: 7.85, label: "账号标识", text: "填写 @ 后面的名字，例如 night_study；使用 2–32 位英文字母、数字或下划线。" },
    { x: 0, y: 22.39, w: 100, h: 7.85, label: "显示名称", text: "填写帖子里显示的昵称，例如“晚自习观察员”，可以用中文。" },
    { x: 0, y: 55.85, w: 100, h: 7.62, label: "关联人物档案（可选）", text: "可以保持“不关联，独立论坛身份”。包括学生在内的所有身份类型，都无需先创建人物档案。" },
    { x: 88.91, y: 91, w: 11.09, h: 9, label: "建立身份", text: "填写完成后点击这里。以后可从创作中心的“论坛身份”列表修改资料、补充头像或关联人物。" },
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
