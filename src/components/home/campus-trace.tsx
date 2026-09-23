"use client";

import Link from "next/link";
import { type KeyboardEvent, useRef, useState } from "react";
import { ArrowIcon } from "../icons/arrow-icon";

const traceTabs = [
  {
    id: "event",
    label: "事件",
    marker: "EVT",
    sequence: "01",
    code: "EVT-2187-0417",
    title: "2187 北校区大停电",
    description: "一场突发停电，让人物、机构与论坛记录在同一晚发生交汇。",
    href: "/events",
    action: "查看事件档案",
    relations: ["林若岚", "玄学院", "@北楼观察者"],
  },
  {
    id: "person",
    label: "人物",
    marker: "PER",
    sequence: "02",
    code: "PER-00427",
    title: "林若岚",
    description: "从课程提问、校刊署名到事件见证，一份仍在持续增长的人物档案。",
    href: "/wiki",
    action: "查看人物档案",
    relations: ["玄学院", "《轨道与群星》", "北校区大停电"],
  },
  {
    id: "organization",
    label: "机构",
    marker: "ORG",
    sequence: "03",
    code: "ORG-0003",
    title: "玄学院",
    description: "连接课程、研究者与校史事件的学院节点，也保存尚未回答的问题。",
    href: "/wiki",
    action: "查看机构档案",
    relations: ["引力透镜课程", "林若岚", "异常报告"],
  },
  {
    id: "account",
    label: "论坛身份",
    marker: "USR",
    sequence: "04",
    code: "USR-11893",
    title: "@北楼观察者",
    description: "一个持续记录校园边角的论坛身份，也是多条档案线索的来源。",
    href: "/forum",
    action: "进入相关讨论",
    relations: ["北楼传真", "停电目击", "校园日常"],
  },
] as const;

export function CampusTrace() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = traceTabs[activeIndex];

  function selectTab(index: number, moveFocus = false) {
    setActiveIndex(index);
    if (moveFocus) {
      requestAnimationFrame(() => tabRefs.current[index]?.focus());
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % traceTabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + traceTabs.length) % traceTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = traceTabs.length - 1;
    else return;

    event.preventDefault();
    selectTab(nextIndex, true);
  }

  return (
    <section className="campus-trace" aria-labelledby="campus-trace-title">
      <div className="trace-heading">
        <h2 id="campus-trace-title">Campus Trace</h2>
        <span>人物 · 机构 · 事件 · 讨论</span>
      </div>

      <div className="trace-tablist" role="tablist" aria-label="切换校园档案类型">
        {traceTabs.map((tab, index) => {
          const selected = activeIndex === index;
          return (
            <button
              aria-controls={`trace-panel-${tab.id}`}
              aria-selected={selected}
              className="trace-tab"
              id={`trace-tab-${tab.id}`}
              key={tab.id}
              onClick={() => selectTab(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <strong>{tab.label}</strong>
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby={`trace-tab-${active.id}`}
        className="trace-panel"
        id={`trace-panel-${active.id}`}
        key={active.id}
        role="tabpanel"
        tabIndex={0}
      >
        <div className="trace-panel-copy">
          <div className="trace-record-meta">
            <span>{active.marker} / ACTIVE RECORD</span>
            <span>{active.code}</span>
          </div>
          <h3>{active.title}</h3>
          <p>{active.description}</p>
          <ul className="trace-relations" aria-label="关联档案">
            {active.relations.map((relation) => <li key={relation}>{relation}</li>)}
          </ul>
          <Link className="trace-action" href={active.href}>
            <span>{active.action}</span><ArrowIcon />
          </Link>
        </div>

        <div className="trace-orbit" aria-hidden="true">
          <span className="trace-orbit-grid" />
          <span className="trace-orbit-ring trace-orbit-ring-one" />
          <span className="trace-orbit-ring trace-orbit-ring-two" />
          <span className="trace-orbit-ring trace-orbit-ring-three" />
          <div className="trace-orbit-core">
            <small>{active.marker}</small>
            <strong>{active.sequence}</strong>
            <span>ACTIVE TRACE</span>
          </div>
          {active.relations.map((relation, index) => (
            <span className={`trace-satellite trace-satellite-${index + 1}`} key={relation}>
              <i />{relation}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
