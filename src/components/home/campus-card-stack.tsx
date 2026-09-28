"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowIcon } from "../icons/arrow-icon";
import type { CampusCard } from "./campus-view-data";

const invitations: CampusCard[] = [
  { id: "visit-student", title: "在空天，\n遇见同行的人。", summary: "了解我们的师生与学院，从一个名字开始，认识空天大学。", kind: "走进空天 · 人物", motif: "人物", href: "/wiki", date: null },
  { id: "visit-forum", title: "课堂之外，\n校园生活继续。", summary: "课程交流、校园见闻与日常讨论。这里是属于空天人的公共空间。", kind: "校园生活 · 交流", motif: "对话", href: "/forum", date: null },
  { id: "visit-place", title: "行走校园，\n发现身边的新知。", summary: "从学院到校园一隅，了解与学习和生活相伴的地方。", kind: "校园导览 · 地点", motif: "地点", href: "/wiki?type=place", date: null },
];

export function CampusCardStack({ cards, failed }: { cards: CampusCard[]; failed: boolean }) {
  const items = cards.length ? cards : invitations;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [hidden, setHidden] = useState(false);
  const current = active % items.length;
  const playing = !paused && !hovered && !focused && !reduced && !hidden && items.length > 1;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduced(media.matches);
    const syncVisibility = () => setHidden(document.hidden);
    syncMotion();
    syncVisibility();
    media.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      media.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % items.length), 5500);
    return () => window.clearInterval(timer);
  }, [playing, items.length]);

  function step(direction: number) {
    setActive((value) => (value + direction + items.length) % items.length);
  }

  return (
    <section className="campus-view" aria-label="校园视界" aria-roledescription="轮播"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="campus-view-heading"><div><span>CAMPUS VIEW</span><h2>空天 · 近况</h2></div><span className="view-status">{cards.length ? "校园新讯" : "校园一览"}</span></div>
      <div className="campus-deck" aria-live={playing ? "off" : "polite"}>
        {items.map((card, index) => {
          const position = (index - current + items.length) % items.length;
          return (
            <article key={card.id} className="campus-card" data-position={position} data-tone={index % 3}
              aria-hidden={position !== 0} inert={position !== 0} aria-roledescription="幻灯片" aria-label={`${index + 1} / ${items.length}`}>
              <div className="card-topline"><span>{card.kind}</span><span>{cards.length && index === 0 ? "NEWEST" : "KTU / ARCHIVE"}</span></div>
              <div className="card-art" aria-hidden="true"><span>{card.motif}</span><i /><b>KONGTIAN<br />UNIVERSITY</b></div>
              <div className="card-copy"><h3>{card.title}</h3><p>{card.summary}</p></div>
              <div className="card-bottom"><span>{card.date ? <time dateTime={card.date}>{new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Shanghai" }).format(new Date(card.date))}</time> : "KONGTIAN UNIVERSITY"}</span><Link href={card.href}>{cards.length ? "阅读全文" : "了解更多"}<ArrowIcon /></Link></div>
            </article>
          );
        })}
      </div>
      <div className="deck-toolbar"><span className="deck-count">{String(current + 1).padStart(2, "0")} <span>/ {String(items.length).padStart(2, "0")}</span></span>
        <div className="deck-dots" aria-hidden="true">{items.map((item, index) => <i key={item.id} data-active={index === current} />)}</div>
        <div className="deck-controls"><button type="button" onClick={() => step(-1)} disabled={items.length < 2} aria-label="上一张">←</button>
          <button type="button" onClick={() => setPaused((value) => !value)} disabled={reduced || items.length < 2} aria-label={paused ? "开启自动切换" : "暂停自动切换"} aria-pressed={paused}>{paused || reduced ? "播放" : "暂停"}</button>
          <button type="button" onClick={() => step(1)} disabled={items.length < 2} aria-label="下一张">→</button></div>
      </div>
      <p className="deck-caption">{failed ? "部分校园资讯暂时无法加载，请稍后刷新。" : "人物、见闻与日常。与空天保持联系。"}</p>
    </section>
  );
}
