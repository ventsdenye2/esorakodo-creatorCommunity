/* Images use the authenticated media redirect rather than Next image optimization. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { EditorEntity, StructuredBody } from "../types";

export function StructuredBodyRenderer({ body, entities = [] }: { body: StructuredBody; entities?: EditorEntity[] }) {
  return <div className="structured-body">{body.blocks.map((block, index) => {
    if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
    if (block.type === "quote") return <blockquote key={index}>{block.text}</blockquote>;
    if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
    if (block.type === "image") return <figure key={index}><img src={`/api/media/${block.asset_id}`} alt={block.alt} loading="lazy" /><figcaption>{block.alt}</figcaption></figure>;
    if (block.type === "entity") {
      const entity = entities.find((item) => item.id === block.entity_id && item.type === block.entity_type);
      return <aside className="body-reference" key={index}><span>相关档案</span>{entity ? <Link href={entity.href}>{entity.label} ↗</Link> : <span>{block.label} · 档案暂不可用</span>}</aside>;
    }
  })}</div>;
}
