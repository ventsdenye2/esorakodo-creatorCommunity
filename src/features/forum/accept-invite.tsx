"use client";
import { useEffect, useState } from "react";
export function AcceptInvite() {
  const [token, setToken] = useState(""), [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [login, setLogin] = useState(false);
  useEffect(() => {
    let value = location.hash.slice(1);
    try { value ||= sessionStorage.getItem("ktu-pending-forum-invite") ?? ""; } catch { /* The original fragment still works without browser storage. */ }
    queueMicrotask(() => { setToken(/^[a-f0-9]{64}$/.test(value) ? value : ""); setReady(true); });
  }, []);
  async function accept() {
    if (busy) return; setBusy(true); setError("");
    try {
      const response = await fetch("/api/forum/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await response.json();
      if (!response.ok) { if (response.status === 401) { setLogin(true); try { sessionStorage.setItem("ktu-pending-forum-invite", token); } catch { /* Reopen the original link after login if storage is unavailable. */ } } throw new Error(data.error); }
      try { sessionStorage.removeItem("ktu-pending-forum-invite"); } catch { /* Joining succeeded independently of local storage. */ }
      location.replace(`/create/forum/${data.topicId}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "加入失败，请重试。"); setBusy(false); }
  }
  return <section className="forum-invite-accept"><h1>一起写这个帖子</h1><p>接受邀请后，你可以和作者共同改写正文，并从创作中心再次进入。</p>
    {!ready ? <p role="status">正在读取邀请…</p> : !token ? <p role="alert">邀请地址不完整，请打开作者分享的完整链接。</p> : <button type="button" className="button button-primary" disabled={busy} onClick={() => void accept()}>{busy ? "正在加入…" : "接受邀请并进入编辑"}</button>}
    {error && <p role="alert" className="forum-error">{error}</p>}
    {login && <><a className="button button-secondary" href="/login?next=%2Fforum%2Finvite">登录后继续</a><p>若登录后未恢复邀请，请重新打开作者分享的原链接。</p></>}
  </section>;
}
