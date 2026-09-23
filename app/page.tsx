import Link from "next/link";
import { CampusActivity } from "../src/components/home/campus-activity";
import { CampusTrace } from "../src/components/home/campus-trace";
import { EditorialFeed } from "../src/components/home/editorial-feed";
import { EventArchive } from "../src/components/home/event-archive";
import { WikiTrail } from "../src/components/home/wiki-trail";
import { ArrowIcon } from "../src/components/icons/arrow-icon";
import { SiteFooter } from "../src/components/layout/site-footer";
import { SiteHeader } from "../src/components/layout/site-header";

export default function Home() {
  return (
    <div className="campus-home">
      <SiteHeader current="campus" />
      <main id="main-content">
        <section className="home-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">这所大学，<br />仍在被共同书写。</h1>
            <p>从一篇校刊文章出发，沿着人物、地点与事件，进入一座持续生长的数字校园。</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/register">建立 Creator 档案<ArrowIcon /></Link>
              <Link className="button button-secondary" href="/wiki">浏览校园档案<ArrowIcon /></Link>
            </div>
            <div className="hero-note" aria-label="平台定位">
              <span>KONGTIAN UNIVERSITY<br />A LIVING ARCHIVE</span>
              <p>连接人与知识，<br />让更多故事被看见。</p>
            </div>
          </div>
          <CampusTrace />
        </section>
        <CampusActivity />
        <EditorialFeed />
        <EventArchive />
        <WikiTrail />
      </main>
      <SiteFooter />
    </div>
  );
}
