"use client";
export default function PressError({ reset }: { reset: () => void }) { return <main id="main-content" className="press-shell"><h1>校刊暂时无法载入</h1><p>请稍后重试。</p><button onClick={reset}>重新载入</button></main>; }
