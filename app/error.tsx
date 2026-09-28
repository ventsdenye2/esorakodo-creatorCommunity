"use client";
import Link from 'next/link';
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <main className="creator-page" id="main-content"><p className="archive-label">TEMPORARILY UNAVAILABLE</p><h1>这一页暂时无法打开。</h1><p>内容加载未完成，请重试，或返回校园首页。</p><div className="creator-toolbar"><button type="button" className="button button-primary" onClick={reset}>重新加载</button><Link className="button" href="/">返回校园</Link></div></main>;
}
