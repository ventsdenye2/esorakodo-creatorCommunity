"use client";
export default function ModerationError({ reset }: { reset: () => void }) { return <main id="main-content" className="portal-page"><h1>管理记录暂时无法读取</h1><p role="alert">请重试以重新核验权限并调阅内容，加载完成前不要执行处置。</p><button className="button" onClick={reset}>重新调阅</button></main>; }
