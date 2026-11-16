"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImageUpload } from "../media/image-upload";
import { forumImageMarkdown, parseForumBody } from "../forum/body";

export function PortraitEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const latest = useRef(value);
  const [error, setError] = useState("");
  useEffect(() => { latest.current = value; }, [value]);
  const { images } = parseForumBody(value);
  return <section className="student-portrait-editor" aria-label="人物图片与立绘"><h2>人物图片 / 立绘</h2><p>图片随本次档案修改一起保存，也会保留在修订历史中。</p>
    <div className="student-portrait-previews">{images.map((image, index) => <figure key={`${image.id}-${index}`}><Image unoptimized src={image.url} width={200} height={240} alt={image.alt || "人物图片"} /><figcaption>{image.alt || `图片 ${index + 1}`}</figcaption><button type="button" onClick={() => {
      let seen = -1;
      onChange(value.split(/\r?\n/).filter(line => { const media = parseForumBody(line).images; if (!media.length) return true; seen++; return seen !== index; }).join("\n"));
    }}>移除图片 {index + 1}</button></figure>)}</div>
    <ImageUpload disabled={value.length > 49700} onUploaded={asset => {
      const next = latest.current + "\n" + forumImageMarkdown(asset.id, "人物立绘") + "\n";
      if (next.length > 50000) { setError("正文已达字数上限，请缩短后重新添加图片。"); return; }
      latest.current = next; onChange(next); setError("");
    }} />
    {error && <p role="alert">{error}</p>}
  </section>;
}
