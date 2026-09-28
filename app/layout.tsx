import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "空天大学 · Kongtian University", template: "%s · 空天大学" },
  description: "欢迎来到空天大学。了解校园资讯、师生生活、学院档案与校史。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
