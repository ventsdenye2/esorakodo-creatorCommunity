import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "空天大学共创平台", template: "%s · 空天大学" },
  description: "以空天大学数字校园为界面的 IP 共创平台。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
