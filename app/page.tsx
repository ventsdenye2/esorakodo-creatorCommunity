import Link from "next/link";
import { CampusHero } from "../src/components/home/campus-hero";
import { SiteHeader } from "../src/components/layout/site-header";
import "../src/components/home/home-welcome.css";

// A single, focused campus entrance.
export default function Home() {
  return (
    <div className="campus-home">
      <SiteHeader current="campus" compact />
      <main id="main-content">
        <CampusHero />
      </main>
      <footer className="home-footer">
        <Link href="https://kongtian.university/">空天大学官网</Link>
        <Link href="/guide">创作指南</Link>
      </footer>
    </div>
  );
}
