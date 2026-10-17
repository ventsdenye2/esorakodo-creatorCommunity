"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function PublicForumLive({ id, version }: { id: string; version: number }) {
  const router = useRouter(), current = useRef(version);
  useEffect(() => { current.current = version; }, [version]);
  useEffect(() => {
    const events = new EventSource(`/api/forum/${id}/stream`);
    let timer: ReturnType<typeof setTimeout> | undefined;
    function refresh() { if (!timer) timer = setTimeout(() => { timer = undefined; router.refresh(); }, 300); }
    events.onmessage = event => { const data = JSON.parse(event.data) as { version: number }; if (data.version !== current.current) refresh(); };
    events.addEventListener("unavailable", () => { events.close(); refresh(); });
    return () => { events.close(); clearTimeout(timer); };
  }, [id, router]);
  return null;
}
