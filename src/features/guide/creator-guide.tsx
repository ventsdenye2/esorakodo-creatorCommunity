import { ImportGuide } from "./import-guide";
import Link from "next/link";
import { ForumPractice, MarkdownPractice } from "./practice";
import { ScreenshotGuide } from "./screenshot-guide";
import "./guide.css";

const chapters = [["import", "Markdown 导入"], ["start", "从哪里开始"], ["identity", "作者、角色与论坛身份"], ["forum", "编排论坛主题"], ["wiki", "编写校园档案"], ["history", "比较与恢复版本"], ["press", "写校刊文章"], ["events", "记录事件与补充材料"], ["questions", "遇到问题时"]];

export function CreatorGuide() {
  return <main id="main-content" className="guide-page">
    <header className="guide-heading" id="guide-top"><p className="archive-label">KONGTIAN / CREATOR HANDBOOK</p><h1>看着界面，一步步创作。</h1><p>创作指南 · 找到图中编号，对照下方操作说明</p><p className="guide-intro">这里截取了当前创作页面的真实界面，填入演示内容。橙色编号标出要填写或点击的位置，对应图下同编号说明。手机上可点击图片查看原图。</p><Link href="/creator" className="button button-primary">进入创作中心 →</Link></header>
    <div className="guide-layout"><aside><nav className="guide-toc" aria-label="教程目录"><p>按需要查阅</p>{chapters.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav></aside><div className="guide-chapters">
      <section id="start" className="guide-section"><p className="guide-kicker">开始之前</p><h2>想写什么，就从对应入口开始</h2><p>注册并完成邮箱确认后登录，进入“创作中心”。你保存的作品草稿会出现在“我的作品”中，可以回来继续写。论坛的改写会自动同步，未发出的新回复仍留在输入框；校刊和事件请按页面提示保存。</p>
        <dl className="guide-routes"><div><dt><a href="#forum">论坛主题 ↗</a></dt><dd>让多个角色在一个帖子里发言，编排对话、争论、传闻或校园日常。</dd></div><div><dt><a href="#wiki">校园档案 ↗</a></dt><dd>记录人物、学院或地点的设定，保留每次修改的历史。</dd></div><div><dt><a href="#press">校刊文章 ↗</a></dt><dd>用文章的形式写报道、随笔或专栏，由你的作者资料署名。</dd></div><div><dt><a href="#events">事件档案 ↗</a></dt><dd>整理一件事的背景、经过与影响，也可以为已有事件补充材料。</dd></div></dl>
        <p className="guide-note">第一次写论坛？打开<a href="#forum">论坛创作</a>，先发出楼主首帖，再像回帖一样继续写。昵称和头像自动准备好，需要时再改；无需先建人物档案或论坛身份。</p>
      </section>
      <section id="identity" className="guide-section"><p className="guide-kicker">先认清三个名字</p><h2>你是作者，角色通过论坛身份发言</h2><dl className="guide-definitions"><div><dt>创作者 / Creator</dt><dd>登录网站的你，负责管理自己的作品与论坛身份。</dd></div><div><dt>人物档案 / Student</dt><dd>故事中人物的设定资料，例如姓名、经历、所属学院。</dd></div><div><dt>论坛身份 / Forum Account</dt><dd>出现在帖子里的昵称和 @账号。一个作者可以创建多个身份，同一个人物也可以有不同网名。</dd></div></dl>
        <h3>需要固定角色资料时，再建立身份</h3><p>论坛创作会自动生成可用身份，你也可以进入<Link href="/create/forum/account">“建立论坛身份”</Link>，按图填写：</p><ScreenshotGuide name="identity" /><p className="guide-note">论坛中的发言身份是你自己创建的账号。关联校园档案只建立联系，不会修改该档案的设定。</p>
      </section>
      <section id="forum" className="guide-section"><p className="guide-kicker">第一场校园讨论</p><h2>像回帖一样，把讨论写出来</h2><p>打开<Link href="/create/forum">“创作论坛主题”</Link>，点击“开始写帖子”。直接写下楼主第一条消息，点击“发出首帖”。昵称和默认头像已自动准备好，不用先建人物或论坛账号；顶部可以直接改帖子标题。</p><ScreenshotGuide name="forum-natural-first" />
        <p>已有发言一直按最终阅读样式显示。底部输入框可以接着发言；点击任意消息或它右上角的“···”，打开下面的操作弹窗。</p><ScreenshotGuide name="forum-natural-menu" />
        <ul><li><strong>回复：</strong>新消息追加到帖子末尾，引用所选楼层。切换回复对象时，输入框的正文会保留；“取消引用”可改为独立发言。</li><li><strong>编辑与剧情数值：</strong>编辑正文、图片和可选戏内时间；分别修改点赞数与“？”数。它们是你设定的剧情数据，读者不会通过点击改变数量。</li><li><strong>设为楼主：</strong>让这条消息使用首楼的论坛身份，昵称、头像和黄色楼主标记一起切换，消息位置保持原处。</li><li><strong>向上插楼：</strong>在所选楼层之前插入发言，后续自动编号，已有回复仍引用原来的消息。首楼不能删除，也不能在它之前插楼。</li><li><strong>角色身份选择：</strong>可以使用已有身份，或生成新身份并修改昵称、上传头像。昵称和头像属于这个身份，修改会同步到它的其他发言；只想换一个人说话时选择其他身份。</li><li><strong>删除：</strong>确认后移除该层；若其他楼层引用它，会提示并取消这些直接引用，回复正文保留。</li></ul>
        <p>添加图片可展开输入框下的“添加图片”，支持多选 JPEG、PNG 或 WebP，每张最多 10MB，也可以粘贴图片。上传完成后可在发言效果里检查，删除对应图片行可移除图片。引用只展示直接目标的正文与缩略图，点击缩略图查看完整图片。</p><ScreenshotGuide name="forum-natural-thread" />
        <p>版面、标签、关联校园档案和 Markdown 导入收在“帖子设置与导入”里。关联只建立联系，不修改档案。论坛改写会自动保存和同步；有未发出的新消息时，先发出或清空，再离开。已发布作品的有效改写会实时出现在公开页面。</p>
        <h3>发布后继续改写，也可以一起写</h3><p>在创作中心或公开帖子点击“进入编辑模式”，可继续修改已发布作品。帖子顶部显示在线成员、正在编辑的位置和同步状态。文字改写会实时同步，“完成编辑”只是收起窗口，不会等到它被点击后才保存。</p><p>作者点击“管理协作者”，输入对方的创作者 @账号即可添加。对方能在“我的帖子与协作”进入。协作者可以改写，首次发布和成员管理仍归作者；移除成员后，对方失去后续读写权限，已有内容保留。</p><ScreenshotGuide name="forum-collaboration" /><ScreenshotGuide name="forum-members" /><p>断线时本机保留改写，重新连接后合并。暂时空白或图片不可用的内容保留给编辑者，读者继续看到最近有效版本；同步错误时可以下载当前改写留存。</p><details className="guide-details guide-exercise"><summary>练习：理解楼层引用和剧情数值</summary><ForumPractice /></details>
        <p className="guide-note"><strong>发布前务必检查：</strong>发出消息会加入帖子并自动同步。首次发布由作者完成，发布后作者与获邀协作者都能继续改写；有效改动实时公开。一篇主题最多 100 条发言。</p>
      </section>
      <section id="wiki" className="guide-section"><p className="guide-kicker">留下可追溯的设定</p><h2>校园档案：摘要讲概况，正文写细节</h2><p>打开<Link href="/create/wiki">“建立校园档案”</Link>，选择人物、学院或地点，填写名称、地址和摘要。档案地址例如 <code>star-club</code>，使用 2–64 位小写字母、数字或连字符，创建后不可修改。摘要写概况，下面的正文写详细内容。</p><ScreenshotGuide name="wiki-markdown" /><p className="guide-note">新档案点击“建立档案”后直接公开，并记录首个版本，没有论坛那样的草稿发布步骤。</p>
        <details className="guide-details guide-exercise"><summary>动手试一下：插入表格、粗体和列表</summary><MarkdownPractice /></details>
        <details className="guide-details"><summary>常用 Markdown 写法速查</summary><dl className="guide-syntax"><div><dt>小标题</dt><dd><code>## 人物经历</code></dd></div><div><dt>粗体 / 斜体</dt><dd><code>**重点内容**</code> / <code>*强调内容*</code></dd></div><div><dt>有序 / 无序列表</dt><dd><code>1. 第一项</code> / <code>- 第一项</code>（每项另起一行）</dd></div><div><dt>引用</dt><dd><code>&gt; 一段引用</code></dd></div><div><dt>链接</dt><dd><code>[链接文字](https://example.com)</code></dd></div></dl><p>表格可以直接用工具栏插入，再替换单元格文字。正文最多 50,000 字；摘要不使用 Markdown 排版。</p></details>
        <p>修改已有档案时，打开档案页面的编辑入口，填写“本次修改说明”，例如“补充入学经历”，然后点击“保存 Revision”。Revision 就是一次修订。</p>
      </section>
      <section id="history" className="guide-section"><p className="guide-kicker">像翻阅修改记录一样</p><h2>看清改了什么，也能恢复旧内容</h2><p>从档案页面进入“修订历史”。登录后，选择旧版本可以看到恢复操作。</p><ScreenshotGuide name="wiki-history" /><ScreenshotGuide name="wiki-restore" /><p className="guide-note">例如当前是 v3，恢复 v1 会生成内容与 v1 相同的 v4；v1、v2、v3 都会保留。恢复针对整份档案，请检查其他字段是否也需要一起恢复。</p><p>如果提示“档案已被其他人更新”，先保留自己的修改文本，再重新打开最新档案核对后编辑，避免覆盖他人的内容。</p></section>
      <section id="press" className="guide-section"><p className="guide-kicker">用文章完整讲述</p><h2>校刊：分段写作，再检查阅读效果</h2><p>打开<Link href="/create/article">“校刊投稿”</Link>，填写标题、摘要，最多选择 3 个栏目标签，再在下面的区域写正文。</p><ScreenshotGuide name="press-blocks" /><ScreenshotGuide name="press-publish" /><p>校刊使用你的作者资料署名，不需要为每个段落选择论坛身份。</p></section>
      <section id="events" className="guide-section"><p className="guide-kicker">共同记录校园发生的事</p><h2>事件主档案与补充材料</h2><p>打开<Link href="/create/event">“建立事件档案”</Link>，填写标题、概述、时间说明、背景与影响，再添加时间节点。</p><ScreenshotGuide name="event-timeline" /><p>完成后“预览时间线”，再“保存草稿”或“发布档案”。“完整已保存预览”只显示已经保存的内容。</p><p>你维护自己建立的主档案。想为别人的公开事件提供另一视角时，从事件详情页进入补充资料入口，填写资料标题、性质和正文，选择对应节点或“整个事件”，再保存或发布。补充资料独立署名，不会覆盖主档案。</p><p className="guide-note">校刊、事件及补充材料发布后仍有更新入口。论坛作品的有效改写则会实时同步公开阅读页。已有补充资料引用的时间节点需要保留。</p></section>
      <ImportGuide />
      <section id="questions" className="guide-section"><p className="guide-kicker">随手查一下</p><h2>遇到问题时</h2><details className="guide-details"><summary>找不到我写过的草稿</summary><p>登录原来的创作者账号，打开<Link href="/creator">创作中心</Link>的“我的作品”，或对应创作页的草稿列表。论坛中未发出的新回复仍在输入框，已有楼层的改写会自动同步。其他编辑器请按页面提示保存。</p></details><details className="guide-details"><summary>下拉框里没有想用的发言身份</summary><p>点击消息菜单中的“角色身份选择”，或底部发言框的身份入口，选择“自动生成一个新身份”，设置昵称和头像后使用即可。也可以选择已有身份。可以使用本作品已有身份或你管理的身份，不必先建立人物档案；其他创作者管理的身份资料只能选择，不能替对方改名或改头像。</p></details><details className="guide-details"><summary>保存失败、按钮不可用或提示版本冲突</summary><p>先检查必填项和页面提示，保存中请等待完成。刷新前先复制重要正文到本地，避免丢失未保存输入。版本冲突时重新打开最新内容再核对，不要反复提交旧页面。仍有问题时，记录页面地址、操作步骤和提示文字交给维护者；不要发送密码或完整邮箱确认链接。</p></details><details className="guide-details"><summary>点击档案链接，就会把设定同步进作品吗？</summary><p>不会。关联或引用档案提供阅读线索，不会替你复制正文，也不会因角色在论坛发言而修改人物设定。需要变更设定时，请单独编辑档案并填写修改说明。</p></details><details className="guide-details"><summary>能在写作时保留教程吗？</summary><p>可以。编辑页的教程入口会在新标签页打开，原来的输入仍留在编辑页。教程练习只在当前页面有效，正式作品仍需要在创作页保存。</p></details><div className="guide-finish"><Link className="button button-primary" href="/creator">开始我的创作 →</Link><a href="#guide-top">返回教程顶部 ↑</a></div></section>
    </div></div>
  </main>;
}
