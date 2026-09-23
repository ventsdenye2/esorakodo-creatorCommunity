import Link from "next/link";
import { ArrowIcon } from "../icons/arrow-icon";

const activity = [
  { date: "2187.05.20", href: "/press", text: "《轨道与群星》新刊发布" },
  { date: "2187.05.18", href: "/forum", text: "讨论：关于北校区能源系统" },
  { date: "2187.05.12", href: "/wiki", text: "新增档案：林若岚" },
  { date: "2187.05.01", href: "/events", text: "校史事件：北校区大停电" },
];

export function CampusActivity() {
  return (
    <section className="activity-rail" aria-labelledby="activity-title">
      <div className="activity-heading">
        <h2 id="activity-title">校园动态</h2>
        <Link href="/forum">查看全部<ArrowIcon /></Link>
      </div>
      <div className="activity-list">
        {activity.map((item) => (
          <Link href={item.href} key={item.text}>
            <time>{item.date}</time>
            <span>{item.text}</span>
            <ArrowIcon />
          </Link>
        ))}
      </div>
    </section>
  );
}
