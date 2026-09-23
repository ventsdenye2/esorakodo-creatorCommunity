import Link from "next/link";
import { ArrowIcon } from "../icons/arrow-icon";

const timeline = [
  { description: "校区电力系统突发故障，北区全部区域失去供电。", time: "21:14", title: "北区失去供电" },
  { description: "多名师生报告实验设备异常，并伴随未知的电磁干扰。", time: "21:41", title: "玄学院区域出现异常报告" },
  { description: "出于安全考虑，校方启动应急预案，封锁北区。", time: "22:03", title: "校方封锁北区" },
];

export function EventArchive() {
  return (
    <section className="event-archive" aria-labelledby="event-title">
      <div className="event-archive-inner">
        <div className="event-heading-row">
          <span>EVENT ARCHIVE · #2187-0417</span>
          <Link href="/events">查看事件档案<ArrowIcon /></Link>
        </div>
        <div className="event-intro">
          <div>
            <h2 id="event-title">2187 年北校区大停电</h2>
            <p>在那个夜晚，整个北校区陷入黑暗。这不只是一次电力中断，更成为许多人记忆中无法忽视的转折点。</p>
          </div>
          <blockquote>“有些黑暗，反而让我们看见更远的东西。”<cite>— 北楼观察者 · 2187</cite></blockquote>
        </div>
        <ol className="event-timeline">
          {timeline.map((item, index) => (
            <li className={index === 0 ? "is-signal" : undefined} key={item.time}>
              <time>{item.time}</time>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
