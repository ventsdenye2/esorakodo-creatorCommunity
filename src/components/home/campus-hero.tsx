import Link from "next/link";
import { ArrowIcon } from "../icons/arrow-icon";
import { CampusScene } from "../../features/campus/campus-scene";

export function CampusHero() {
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="hero-kicker">KONGTIAN UNIVERSITY / EARTH CAMPUS</span>
        <h1 id="hero-title">这所大学，<br />仍在被共同书写。</h1>
        <p>从一份人物档案、一段校园讨论开始，走进这所正在形成的大学。</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/wiki">浏览校园档案<ArrowIcon /></Link>
          <Link className="button button-secondary" href="/register">建立 Creator 档案<ArrowIcon /></Link>
        </div>
        <div className="hero-note" aria-label="平台定位">
          <span>ARCHIVE / DISCUSSION / CREATION</span>
          <p>一座持续生长的校园，<br />由每位创作者留下记录。</p>
        </div>
      </div>
      <div className="hero-scene">
        <CampusScene className="hero-scene-art" />
        <div className="hero-scene-title"><span>CAMPUS VIEW</span><strong>校园视界</strong></div>
        <div className="hero-scene-marker hero-scene-marker-archive"><b>A</b><span>校园档案</span></div>
        <div className="hero-scene-marker hero-scene-marker-forum"><b>B</b><span>校园论坛</span></div>
        <div className="hero-scene-marker hero-scene-marker-press"><b>C</b><span>校刊·部刊</span></div>
        <div className="hero-scene-caption"><span>概念沙盘 · 非正式校园地图</span><Link href="/wiki">探索档案 <ArrowIcon /></Link></div>
      </div>
    </section>
  );
}
