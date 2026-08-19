import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children,
  alternate,
}: {
  title: string;
  description: string;
  children: ReactNode;
  alternate: ReactNode;
}) {
  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/">
        <span className="brand-mark">KTU</span>
        <span><strong>KONGTIAN UNIVERSITY</strong><small>空天大学共创平台</small></span>
      </Link>
      <section className="auth-panel">
        <div className="auth-intro">
          <span className="archive-label">CREATOR ACCESS / M1</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="auth-orbit" aria-hidden="true"><span>KTU</span></div>
        </div>
        <div className="auth-form-column">
          {children}
          <p className="auth-alternate">{alternate}</p>
        </div>
      </section>
    </main>
  );
}

export function AuthNotice({
  tone,
  children,
}: {
  tone: "error" | "message";
  children?: string;
}) {
  if (!children) return null;
  return <p className={`auth-notice auth-notice-${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</p>;
}
