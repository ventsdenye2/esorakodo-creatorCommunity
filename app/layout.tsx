import type { Metadata } from "next";
import { CampusMotion } from "../src/components/layout/campus-motion";
import "./globals.css";
import "./motion.css";
import "./campus-theme.css";

export const metadata: Metadata = {
  title: { default: "空天大学 · Kongtian University", template: "%s · 空天大学" },
  description: "欢迎来到空天大学。了解校园资讯、师生生活、学院档案与校史。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="campus-theme">{children}<CampusMotion /></body>
    </html>
  );
}
