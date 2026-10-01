import Link from "next/link";
import type { ReactNode } from "react";

export function GuideLink({ section, children }: { section: string; children: ReactNode }) {
  return <p className="creator-guide-link"><Link href={`/guide#${section}`} target="_blank" rel="noopener noreferrer">{children} <span>↗ 新标签页</span></Link></p>;
}
