import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="footer-brand" href="/" aria-label="空天大学首页">
        <BrandMark />
        <span><strong>空天大学共创平台</strong><small>KONGTIAN UNIVERSITY</small></span>
      </Link>
      <nav aria-label="页脚导航">
        <Link href="/wiki">校园档案</Link>
        <Link href="/events">校史事件</Link>
        <Link href="/press">校刊·部刊</Link>
      </nav>
      <p>探索更大的天空，连接仍在生长的校园历史。</p>
    </footer>
  );
}
