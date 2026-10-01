"use client";

import { useState } from "react";
import { ThreadTree, type ThreadNode } from "../forum/thread-tree";
import { MarkdownEditor } from "../wiki/markdown-editor";
import "../forum/forum.css";

const markdownExample = `## 观星社

这里记录社团的**活动安排**与*观测笔记*。

1. 集合并清点器材
2. 前往观测地点

| 时间 | 安排 |
| --- | --- |
| 19:00 | 集合 |
| 19:30 | 开始观测 |

> 示例设定，仅用于练习。`;

export function ForumPractice() {
  const [parent, setParent] = useState("two");
  const [likes, setLikes] = useState(12);
  const nodes: ThreadNode[] = [
    { id: "one", parentId: null, floor: 1, name: "晚自习观察员", handle: "night_study", body: "今晚有人一起去观星吗？", time: "20:10", likes: 8, questions: 0 },
    { id: "two", parentId: "one", floor: 2, name: "带了望远镜", handle: "telescope", body: "我去，带上望远镜。在哪里集合？", time: "20:12", likes: 5, questions: 1 },
    { id: "three", parentId: parent || null, floor: 3, name: "晚自习观察员", handle: "night_study", body: "图书馆门口见！", time: "20:13", likes, questions: 0 },
  ];
  return <div className="guide-practice" aria-label="论坛回复练习">
    <div className="guide-practice-heading"><h3>试一试：这句话在回复谁？</h3><span>练习区 · 不会保存或发布</span></div>
    <div className="guide-practice-controls">
      <label>第 3 层回复对象<select value={parent} onChange={event => setParent(event.target.value)}><option value="two">#02 · 带了望远镜</option><option value="one">#01 · 晚自习观察员</option><option value="">独立发言</option></select></label>
      <label>第 3 层 👍 赞同<input type="number" min={0} max={999999999} step={1} value={likes} onChange={event => setLikes(Math.min(999999999, Math.max(0, Math.trunc(event.target.valueAsNumber || 0))))} /></label>
    </div>
    <p className="guide-practice-status" role="status">{parent === "two" ? "第 3 层接在第 2 层下面，形成连续对话。" : parent === "one" ? "第 2、3 层都回复第 1 层，成为并列回复。" : "第 3 层现在是独立发言，与第 1 层处于同一级。"} 楼层编号仍是 #03。</p>
    <ThreadTree key={parent} prefix="guide-floor" nodes={nodes} renderEditor={node => <><p className="thread-body">{node.body}</p><div className="thread-reactions" aria-label="剧情中的反应数量"><span>👍 <b>{node.likes}</b></span><span>？ <b>{node.questions}</b></span></div></>} />
    <p className="guide-caption">也可以点击“收起 / 展开”查看分支。示例昵称不是站内账号。</p>
  </div>;
}

export function MarkdownPractice() {
  const [reset, setReset] = useState(0);
  return <div className="guide-practice" aria-label="Markdown 练习">
    <div className="guide-practice-heading"><h3>试一试：编辑一份小档案</h3><button type="button" onClick={() => setReset(value => value + 1)}>重置示例</button></div>
    <p>选中文字后点击“粗体”，或在新的一行点击“表格”，再切换到“预览”。这里只练习排版，不会保存；刷新页面会重置。</p>
    <MarkdownEditor key={reset} initialValue={markdownExample} />
  </div>;
}
