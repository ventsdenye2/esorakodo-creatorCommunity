/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Scroll regions need keyboard focus. */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./markdown.css";

export function Markdown({ children }: { children: string }) {
  return <div className="wiki-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml
    components={{ table: ({ children }) => <div className="markdown-table-scroll" tabIndex={0} role="region" aria-label="表格，可横向滚动"><table>{children}</table></div> }}>{children}</ReactMarkdown></div>;
}
