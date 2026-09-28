import type { ReactNode } from "react";
import { SiteHeader } from "../../../components/layout/site-header";
import { SiteFooter } from "../../../components/layout/site-footer";
import "../events.css";
import "../../editor/editor.css";
export function EventShell({ children }: { children: ReactNode }) { return <div><SiteHeader current="events" /><main id="main-content" className="events-shell">{children}</main><SiteFooter /></div>; }
