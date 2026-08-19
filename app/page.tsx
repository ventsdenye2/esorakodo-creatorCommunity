import Link from "next/link";
import { SiteHeader } from "../src/components/layout/site-header";

const recentWorks = [
  { title: "《北楼传真：一次关于观测与沉默的记录》", meta: "校刊 · 林若岚 · 2187-05-12" },
  { title: "《玄学院课程备忘录（节选）》", meta: "部刊 · 玄学院 · 2187-05-09" },
  { title: "《从电力中断到系统重启》", meta: "研究纪要 · 校史研究会 · 2187-05-04" },
];

const forumRows = [
  ["公告与通知", "关于图书馆系统升级的说明", "校务处"],
  ["学术交流", "关于引力透镜课程作业的一点疑问", "林若岚"],
  ["校园日常", "二食堂二楼的那台旧钢琴", "一颗橙子"],
];

export default function Home() {
  return (
    <main>
      <SiteHeader current="campus" />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">这所大学，<br />仍在被共同书写。</h1>
          <p>从一篇校刊文章出发，沿着人物、地点与事件，进入一座持续生长的数字校园。</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/register">创建 Creator 档案</Link>
            <Link className="text-link arrow-link" href="/wiki">浏览校园档案</Link>
          </div>
        </div>
        <div className="orbit-archive" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="archive-core">KTU<br /><small>2187</small></span>
          <span className="archive-node node-one" />
          <span className="archive-node node-two" />
          <span className="archive-node node-three" />
        </div>
      </section>

      <section className="campus-grid" aria-label="校园最新内容">
        <article className="publication-panel">
          <div className="section-heading"><h2>近期校刊</h2><Link href="/press">查看全部</Link></div>
          <ol className="editorial-list">
            {recentWorks.map((work, index) => (
              <li key={work.title}>
                <span className="index">0{index + 1}</span>
                <div><Link href="/press">{work.title}</Link><small>{work.meta}</small></div>
              </li>
            ))}
          </ol>
        </article>

        <article className="forum-panel">
          <div className="section-heading"><h2>校园论坛</h2><Link href="/forum">进入论坛</Link></div>
          <div className="forum-table" role="table" aria-label="论坛最新话题">
            {forumRows.map(([board, topic, author]) => (
              <div className="forum-row" role="row" key={topic}>
                <span role="cell">{board}</span><Link role="cell" href="/forum">{topic}</Link><span role="cell">{author}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="archive-strip">
        <div><span className="archive-label">校史事件 · ARCHIVE 0218</span><h2>2187 年北校区大停电</h2></div>
        <p>一条事件主档案，连接时间节点、目击者、学院记录与仍未证实的传闻。</p>
        <Link className="arrow-link" href="/events">查看事件时间线</Link>
      </section>
    </main>
  );
}
