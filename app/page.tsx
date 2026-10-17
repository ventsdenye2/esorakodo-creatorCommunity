import Link from "next/link";
import { Suspense } from "react";
import { CampusCardStack } from "../src/components/home/campus-card-stack";
import { getCampusCards } from "../src/components/home/campus-view-data";
import { CampusHero } from "../src/components/home/campus-hero";
import { SiteHeader } from "../src/components/layout/site-header";
import "../src/components/home/home-welcome.css";

async function CampusNews() {
  const { cards, failed } = await getCampusCards();
  return <CampusCardStack cards={cards} failed={failed} />;
}
export default function Home() {
  return (
    <div className="campus-home">
      <SiteHeader current="campus" compact />
      <main id="main-content">
        <CampusHero>
          <Suspense fallback={<CampusCardStack cards={[]} failed={false} />}>
            <CampusNews />
          </Suspense>
        </CampusHero>
      </main>
      <footer className="home-footer">
        <Link href="https://kongtian.university/">空天大学官网</Link>
        <Link href="/guide">创作指南</Link>
      </footer>
    </div>
  );
}
