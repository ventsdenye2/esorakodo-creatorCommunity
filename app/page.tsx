import { CampusActivity } from "../src/components/home/campus-activity";
import { CampusHero } from "../src/components/home/campus-hero";
import { CampusTrace } from "../src/components/home/campus-trace";
import { EditorialFeed } from "../src/components/home/editorial-feed";
import { EventArchive } from "../src/components/home/event-archive";
import { WikiTrail } from "../src/components/home/wiki-trail";
import { SiteFooter } from "../src/components/layout/site-footer";
import { SiteHeader } from "../src/components/layout/site-header";

export default function Home() {
  return (
    <div className="campus-home">
      <SiteHeader current="campus" />
      <main id="main-content">
        <CampusHero />
        <CampusActivity />
        <CampusTrace />
        <EditorialFeed />
        <EventArchive />
        <WikiTrail />
      </main>
      <SiteFooter />
    </div>
  );
}
