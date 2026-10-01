import { SiteHeader } from "../../src/components/layout/site-header";
import { SiteFooter } from "../../src/components/layout/site-footer";
import { CreatorGuide } from "../../src/features/guide/creator-guide";

export const metadata = { title: "创作指南", description: "从论坛身份到第一份作品：空天大学创作操作教程与练习。" };

export default function GuidePage() {
  return <><SiteHeader /><CreatorGuide /><SiteFooter /></>;
}
