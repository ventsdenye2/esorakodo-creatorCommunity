import assert from "node:assert/strict";
import test from "node:test";
import { authErrorMessage } from "../src/features/auth/error-message.mjs";
import { safeNextPath } from "../src/features/auth/safe-next.mjs";

test("login and registration errors are understandable and never expose provider internals", () => {
  assert.match(authErrorMessage({ code: "invalid_credentials" }), /邮箱或密码不正确/);
  assert.match(authErrorMessage({ code: "email_not_confirmed" }), /邮箱尚未验证/);
  assert.match(authErrorMessage({ status: 429 }), /频繁/);
  assert.equal(authErrorMessage({ message: "Internal SQL error; private detail" }), "操作未完成，请检查输入或稍后重试。");
});

test("post-login destination preserves local deep links and rejects ambiguous external URLs", () => {
  const origin = "https://campus.kongtian.university";
  for (const next of ["//%", "/\n/other.invalid", "/\t/other.invalid", "https://other.invalid", "//other.invalid"]) assert.equal(safeNextPath(next, origin), "/creator");
  assert.equal(safeNextPath("/create/article?draft=1#editor", origin), "/create/article?draft=1#editor");
});
