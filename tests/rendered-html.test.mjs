import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(new URL(pathname, "http://localhost/"), {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the campus homepage", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /空天大学共创平台/);
  assert.match(html, /这所大学/);
  assert.match(html, /校园论坛/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("server-renders public media boundaries", async () => {
  for (const [pathname, heading] of [
    ["/forum", "校园论坛"],
    ["/press", "校刊 · 部刊"],
    ["/events", "校史事件"],
    ["/wiki", "校园档案"],
  ]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), new RegExp(heading), pathname);
  }
});

test("renders auth foundations without leaking configuration", async () => {
  for (const [pathname, heading] of [
    ["/login", "返回校园"],
    ["/register", "建立 Creator 档案"],
    ["/creator", "Creator 档案"],
  ]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, new RegExp(heading), pathname);
    assert.doesNotMatch(html, /SUPABASE_SERVICE_ROLE_KEY|your-anon-or-publishable-key/i);
  }
});
