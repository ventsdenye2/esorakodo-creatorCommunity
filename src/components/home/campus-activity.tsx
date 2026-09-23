import Link from "next/link";
import { ArrowIcon } from "../icons/arrow-icon";

export function CampusActivity() {
  return (
    <section className="activity-rail" aria-labelledby="activity-title">
      <div className="activity-heading">
        <div><span>CAMPUS / LIVE</span><h2 id="activity-title">校园正在被书写</h2></div>
        <Link href="/wiki">查看校园档案<ArrowIcon /></Link>
      </div>
      <div className="activity-empty">
        <p>这里将呈现已发布的共创记录。现在，从档案或讨论开始探索。</p>
        <Link href="/forum">进入论坛<ArrowIcon /></Link>
      </div>
    </section>
  );
}
