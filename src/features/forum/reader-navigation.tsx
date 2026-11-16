import Link from "next/link";
export function ReaderNavigation({ previous, next, query = "" }: { previous?: { id: string; title: string }; next?: { id: string; title: string }; query?: string }) {
  return <nav className="forum-reader-navigation" aria-label="连续阅读">
    {previous ? <Link href={`/forum/${previous.id}${query}`} rel="prev"><span aria-hidden="true">←</span><span><small>上一篇</small>{previous.title}</span></Link> : <span className="forum-navigation-edge">已是第一篇</span>}
    {next ? <Link href={`/forum/${next.id}${query}`} rel="next"><span><small>下一篇</small>{next.title}</span><span aria-hidden="true">→</span></Link> : <span className="forum-navigation-edge">已读到最后一篇</span>}
  </nav>;
}
