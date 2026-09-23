import Link from "next/link";
import { ArrowIcon } from "../icons/arrow-icon";
import { BrandMark } from "./brand-mark";

type Section = "campus" | "forum" | "press" | "events" | "wiki";

const links: Array<{ key: Section; href: string; label: string }> = [
  { key: "campus", href: "/", label: "校园" },
  { key: "forum", href: "/forum", label: "论坛" },
  { key: "press", href: "/press", label: "校刊·部刊" },
  { key: "events", href: "/events", label: "校史事件" },
  { key: "wiki", href: "/wiki", label: "校园档案" },
];

export function SiteHeader({ current }: { current?: Section }) {
  return (
    <>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="空天大学首页">
          <BrandMark />
          <span className="brand-copy">
            <strong>KONGTIAN UNIVERSITY</strong>
            <small>空天大学</small>
          </span>
        </Link>
        <nav aria-label="主导航">
          {links.map((link) => (
            <Link key={link.key} aria-current={current === link.key ? "page" : undefined} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="text-link" href="/login">登录</Link>
          <Link className="button button-primary header-primary" href="/register">
            <span>进入校园</span><ArrowIcon />
          </Link>
        </div>
      </header>
    </>
  );
}
