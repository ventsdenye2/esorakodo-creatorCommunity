import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.match(html, /空天大学/);
  assert.match(html, /立足此间/);
  assert.match(html, /CAMPUS VIEW/);
  assert.match(html, /下一张/);
  assert.match(html, /Campus Trace/);
  assert.match(html, /检索校园/);
  assert.match(html, /校园论坛/);
  assert.doesNotMatch(html, /campus-trace\.png/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("server-renders public media boundaries", async () => {
  for (const [pathname, heading] of [
    ["/forum", "校园论坛"],
    ["/press", "空天校刊"],
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
  ]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, new RegExp(heading), pathname);
    assert.doesNotMatch(html, /SUPABASE_SERVICE_ROLE_KEY|your-anon-or-publishable-key/i);
  }

  const creatorResponse = await render("/creator");
  if (creatorResponse.status === 307) {
    assert.match(creatorResponse.headers.get("location") ?? "", /\/login(?:\?|$)/);
  } else {
    assert.equal(creatorResponse.status, 200);
    assert.match(await creatorResponse.text(), /Creator 档案/);
  }
});

test("server-renders the wiki directory and create states", async () => {
  const indexResponse = await render("/wiki");
  assert.equal(indexResponse.status, 200);
  const indexHtml = await indexResponse.text();
  assert.match(indexHtml, /校园档案/);
  if (indexHtml.includes("等待连接开发数据库")) {
    assert.match(indexHtml, /还没有校园档案/);
  }

  const createResponse = await render("/create/wiki");
  if (createResponse.status === 307) {
    assert.match(createResponse.headers.get("location") ?? "", /\/login(?:\?|$)/);
  } else {
    assert.equal(createResponse.status, 200);
    const createHtml = await createResponse.text();
    assert.match(createHtml, /建立校园档案/);
    assert.match(createHtml, /建立档案/);
    if (createHtml.includes("档案服务暂未开放")) {
      assert.match(createHtml, /disabled/);
    }
  }
});

test("wiki migration preserves the RPC-only write contract", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/202609220001_m2_wiki_revisions.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /revoke insert, update, delete on public\.colleges, public\.places, public\.students from authenticated/i);
  assert.match(migration, /revoke insert, update, delete on public\.wiki_revisions from authenticated/i);
  assert.match(migration, /revoke execute on function public\.apply_wiki_revision[\s\S]*from public, anon/i);
  assert.match(migration, /grant execute on function public\.apply_wiki_revision[\s\S]*to authenticated/i);
  assert.match(migration, /p_expected_version is null or p_expected_version <= 0/i);
  assert.match(migration, /p_patch is null or jsonb_typeof\(p_patch\) <> 'object' or p_patch = '\{\}'::jsonb/i);
});

test("server-renders integrated discovery and author boundaries", async () => {
  for (const [pathname, heading] of [["/search", "在空天"], ["/search?q=%E6%A0%A1%E5%9B%AD&kind=article", "检索结果|没有找到"], ["/wiki?type=place", "校园档案"]]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, new RegExp(heading));
    assert.doesNotMatch(html, /R2_SECRET_ACCESS_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  }
  for (const pathname of ["/press/not-a-uuid", "/events/not-a-uuid", "/creator/nonexistent_qa_profile"]) {
    const response = await render(pathname);
    // App Router can stream a not-found boundary with 200 after headers flush.
    assert.ok([200,404].includes(response.status), pathname);
    assert.match(await response.text(), /未找到这份内容|NEXT_HTTP_ERROR_FALLBACK;404/);
  }
});
