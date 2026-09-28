"use client";
export default function ArticleError({ reset }: { reset: () => void }) { return <main id="main-content" className="press-shell"><h1>文章暂时无法载入</h1><p>请稍后重试，已保存的文章不会受到影响。</p><button onClick={reset}>重新载入</button></main>; }
