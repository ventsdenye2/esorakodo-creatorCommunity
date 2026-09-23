import Link from "next/link";
import { ArrowIcon } from "../icons/arrow-icon";

const entities = [
  { code: "#P-00427", kind: "人物", label: "林若岚" },
  { code: "#ORG-0003", kind: "学院", label: "玄学院" },
  { code: "#E-2187-0417", kind: "事件", label: "北校区大停电" },
  { code: "#SRC-011", kind: "来源", label: "@北楼观察者" },
];

export function WikiTrail() {
  return (
    <section className="wiki-trail" aria-labelledby="wiki-trail-title">
      <div className="home-section-heading wiki-heading">
        <div><h2 id="wiki-trail-title">探索更多校园 Wiki</h2><p>从一个人，到一个事件，再到更广阔的知识网络。</p></div>
        <Link className="section-link" href="/wiki">进入 Wiki<ArrowIcon /></Link>
      </div>
      <div className="wiki-trail-layout">
        <ol className="entity-path">
          {entities.map((entity, index) => (
            <li key={entity.code}>
              <Link href="/wiki">{entity.label}</Link>
              <span>{entity.kind} · {entity.code}</span>
              {index < entities.length - 1 ? <ArrowIcon /> : null}
            </li>
          ))}
        </ol>
        <p className="wiki-statement">每一条记录，<br />都通向另一段校园历史。</p>
      </div>
    </section>
  );
}
