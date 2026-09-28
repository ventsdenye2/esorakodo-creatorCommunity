import Link from "next/link";
import { ArrowIcon } from "../icons/arrow-icon";
import { CampusCardStack } from "./campus-card-stack";
import { getCampusCards } from "./campus-view-data";

export async function CampusHero() {
  const { cards, failed } = await getCampusCards();
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="hero-kicker">KONGTIAN UNIVERSITY / EARTH CAMPUS</span>
        <h1 id="hero-title">立足此间，<br /><span className="hero-emphasis">望向更远的天空。</span></h1>
        <p>欢迎来到空天大学。<br />在这里，认识我们的师生，发现校园里的日常与新知。</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/wiki">走进空天<ArrowIcon /></Link>
          <Link className="button button-secondary" href="/forum">校园生活<ArrowIcon /></Link>
        </div>
        <div className="hero-note" aria-label="校园寄语">
          <span>KNOWLEDGE / DISCOVERY / COMMUNITY</span>
          <p>求知于广阔天地，<br />相逢于日常之间。</p>
        </div>
      </div>
      <CampusCardStack cards={cards} failed={failed} />
    </section>
  );
}
