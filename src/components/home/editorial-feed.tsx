import Link from "next/link";
import { ArrowIcon } from "../icons/arrow-icon";

const forumRows = [
  { author: "校务处", board: "公告与通知", title: "关于图书馆系统升级的说明" },
  { author: "林若岚", board: "学术交流", title: "关于引力透镜课程作业的一点疑问" },
  { author: "一颗橙子", board: "校园日常", title: "二食堂二楼的那台旧钢琴" },
];

const recentWorks = [
  { date: "2187-05-12", title: "《北楼传真：一次关于观测与沉默的记录》" },
  { date: "2187-05-09", title: "《玄学院课程备忘录（节选）》" },
  { date: "2187-05-04", title: "《从电力中断到系统重启》" },
];

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link className="section-link" href={href}>{children}<ArrowIcon /></Link>;
}

export function EditorialFeed() {
  return (
    <section className="editorial-feed" aria-label="校园论坛和近期校刊">
      <article className="forum-feed">
        <div className="home-section-heading">
          <div><h2>校园论坛</h2><p>概念演示 · 以下条目不是已发布的帖子。</p></div>
          <SectionLink href="/forum">进入论坛</SectionLink>
        </div>
        <div className="forum-feed-head" aria-hidden="true">
          <span>板块</span><span>主题</span><span>发布者</span>
        </div>
        <ol className="forum-feed-list">
          {forumRows.map((row) => (
            <li key={row.title}>
              <span>{row.board}</span>
              <Link href="/forum">{row.title}</Link>
              <span>{row.author}</span>
            </li>
          ))}
        </ol>
      </article>

      <article className="press-feed">
        <div className="home-section-heading">
          <div><h2>校刊·部刊</h2><p>概念演示 · 以下刊物尚未发布。</p></div>
          <SectionLink href="/press">进入校刊</SectionLink>
        </div>
        <ol className="press-feed-list">
          {recentWorks.map((work, index) => (
            <li key={work.title}>
              <span className="press-index">{String(index + 1).padStart(2, "0")}</span>
              <div><Link href="/press">{work.title}</Link><small>校刊 · {work.date}</small></div>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}
