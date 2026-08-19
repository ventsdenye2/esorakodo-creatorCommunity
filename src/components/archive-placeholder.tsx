import { SiteHeader } from "./layout/site-header";

type Section = "forum" | "press" | "events" | "wiki";

export function ArchivePlaceholder({
  section,
  title,
  description,
}: {
  section: Section;
  title: string;
  description: string;
}) {
  return (
    <main>
      <SiteHeader current={section} />
      <section className="placeholder-page">
        <p className="archive-label">M0 / INFORMATION ARCHITECTURE</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="placeholder-rule" />
        <p className="placeholder-note">本阶段保留路由与媒介边界，复杂编辑和发布流程将在对应里程碑实现。</p>
      </section>
    </main>
  );
}
