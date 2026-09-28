"use client";
export default function EventsError({ reset }: { reset: () => void }) { return <main id="main-content" style={{ padding: "6rem 8%" }}><h1>档案暂时无法调阅</h1><p>请稍后重试，或返回其他校园栏目。</p><button className="button button-primary" onClick={reset}>重新调阅</button></main>; }
