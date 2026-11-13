"use client";

import { useEffect, useRef } from "react";
import { AuthorDialog } from "./author-dialog";

export type SaveFeedbackPhase = "saving" | "success" | "error";
export function SaveFeedbackDialog({ phase, error, publishing, onClose, onRetry, onDownload }: {
  phase: SaveFeedbackPhase; error?: string; publishing: boolean;
  onClose: () => void; onRetry: () => void; onDownload?: () => void;
}) {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (phase !== "success") return;
    const timer = setTimeout(() => close.current(), 1500);
    return () => clearTimeout(timer);
  }, [phase]);
  const title = phase === "saving" ? publishing ? "正在发布…" : "正在保存…"
    : phase === "success" ? publishing ? "发布成功" : "保存成功" : publishing ? "发布未完成" : "保存未完成";
  return <AuthorDialog title={title} locked={phase === "saving"} onClose={onClose}>
    <div className="forum-save-feedback" data-phase={phase}>
      <span className="forum-save-symbol" aria-hidden="true">{phase === "success" ? "✓" : phase === "error" ? "!" : ""}</span>
      <p role={phase === "error" ? "alert" : "status"} aria-live={phase === "error" ? "assertive" : "polite"} data-dialog-focus tabIndex={-1}>
        {phase === "saving" ? "正在确认保存结果，请稍候。" : phase === "success" ? "内容已确认保存。" : error || "未能确认保存成功，当前内容仍保留，请重试。"}
      </p>
      {phase === "success" && <small>{publishing ? "即将打开帖子。" : "此提示将自动关闭。"}</small>}
      {phase === "error" && <div className="forum-save-actions"><button type="button" className="button button-primary" onClick={onRetry}>重试</button>{onDownload && <button type="button" className="button button-secondary" onClick={onDownload}>下载改写备份</button>}<button type="button" className="button button-secondary" onClick={onClose}>返回编辑</button></div>}
    </div>
  </AuthorDialog>;
}
