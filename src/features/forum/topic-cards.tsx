import Image from "next/image";
import Link from "next/link";
import { parseForumBody } from "./body";
import { boardLabel } from "./schemas";
import type { ForumTopicView } from "./queries";

export function TopicCards({ topics, board, tag }: { topics: ForumTopicView[]; board?: string; tag?: string }) {
  const context = new URLSearchParams();
  context.set("board", board ?? "all");
  if (tag) context.set("tag", tag);
  const suffix = context.size ? `?${context}` : "";
  return <ul className="forum-waterfall">{topics.map(topic => {
    const { text, images } = parseForumBody(topic.firstBody);
    return <li key={topic.id}><article className="forum-topic-card">
      <Link className="forum-card-open" href={`/forum/${topic.id}${suffix}`}>
        {images[0] && <Image unoptimized width={600} height={600} className="forum-card-image" src={images[0].url} alt={images[0].alt || "主楼图片"} />}
        <div className="forum-card-copy"><h2>{topic.title}</h2>{text && <p>{text}</p>}<span className="forum-card-read">阅读全部 {topic.floorCount} 层 →</span></div>
      </Link>
      <div className="forum-card-meta"><span>{boardLabel(topic.board)}</span><time dateTime={topic.published_at ?? ""}>{topic.published_at ? new Date(topic.published_at).toLocaleDateString("zh-CN") : ""}</time></div>
      {topic.tags.length > 0 && <div className="forum-tags">{topic.tags.map(name => <Link key={name} href={`/forum?tag=${encodeURIComponent(name)}`}>#{name}</Link>)}</div>}
    </article></li>;
  })}</ul>;
}
