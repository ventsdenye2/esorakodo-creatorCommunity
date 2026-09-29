import assert from "node:assert/strict";
import test from "node:test";
import { isSameMediaOrigin } from "../src/features/media/same-origin.mjs";

const siteUrl = "https://campus.kongtian.university";
const options = { production: true, siteUrl };
function request(origin, extra = {}, url = "http://127.0.0.1:3107/api/media/upload") {
  return new Request(url, { headers: { ...(origin === undefined ? {} : { origin }), ...extra } });
}

test("public HTTPS origin passes behind internal HTTP proxy", () => {
  assert.equal(isSameMediaOrigin(request(siteUrl), options), true);
  assert.equal(isSameMediaOrigin(request(siteUrl), { ...options, siteUrl: `${siteUrl}/` }), true);
});

test("missing, opaque, foreign, and internal origins fail", () => {
  for (const origin of [undefined, "null", "https://other.invalid", "http://127.0.0.1:3107", `${siteUrl}/`, `${siteUrl}.other.invalid`]) {
    assert.equal(isSameMediaOrigin(request(origin), options), false);
  }
});

test("forged host and forwarding headers do not authorize a foreign origin", () => {
  assert.equal(isSameMediaOrigin(request("https://other.invalid", {
    host: "other.invalid", "x-forwarded-host": "other.invalid", "x-forwarded-proto": "https",
    forwarded: "host=other.invalid;proto=https",
  }), options), false);
  assert.equal(isSameMediaOrigin(request(siteUrl, { "x-forwarded-host": "other.invalid" }), options), true);
});

test("production configuration fails closed, without request-origin fallback", () => {
  for (const invalid of [undefined, "", "not a URL", "//campus.kongtian.university", "ftp://campus.kongtian.university", "https://user:pass@campus.kongtian.university", `${siteUrl}/path`, `${siteUrl}?q=1`, `${siteUrl}#hash`]) {
    assert.equal(isSameMediaOrigin(request(siteUrl, {}, `${siteUrl}/api/media/upload`), { production: true, siteUrl: invalid }), false);
  }
});

test("development uses request origin, invalid explicit config still fails closed", () => {
  const local = "http://localhost:3001";
  assert.equal(isSameMediaOrigin(request(local, {}, `${local}/api/media/upload`), { production: false, siteUrl }), true);
  assert.equal(isSameMediaOrigin(request(siteUrl, {}, `${local}/api/media/upload`), { production: false, siteUrl }), false);
  assert.equal(isSameMediaOrigin(request(local, {}, `${local}/api/media/upload`), { production: false, siteUrl: "invalid" }), false);
});

test("standalone local media fixture can explicitly configure its loopback origin", () => {
  const local = "http://127.0.0.1:3005";
  assert.equal(isSameMediaOrigin(request(local), { production: true, siteUrl: local }), true);
});
