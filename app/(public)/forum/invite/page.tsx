import { SiteHeader } from "../../../../src/components/layout/site-header";
import { SiteFooter } from "../../../../src/components/layout/site-footer";
import { AcceptInvite } from "../../../../src/features/forum/accept-invite";
import "../../../../src/features/forum/forum.css";
export const metadata = { title: "共同写作邀请", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function ForumInvitePage() {
  return <div><SiteHeader current="forum" /><main id="main-content" className="forum-shell"><AcceptInvite /></main><SiteFooter /></div>;
}
