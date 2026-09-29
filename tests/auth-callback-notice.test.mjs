import assert from "node:assert/strict";
import test from "node:test";
import { AuthPKCECodeVerifierMissingError } from "@supabase/auth-js";
import { callbackFailureNotice } from "../src/features/auth/callback-notice.mjs";

const recovery = { key: "message", text: "无法在当前浏览器自动登录，请用注册邮箱和密码登录。" };

test("real SDK missing-verifier error offers password login without claiming confirmation succeeded", () => {
  assert.deepEqual(callbackFailureNotice(new AuthPKCECodeVerifierMissingError()), recovery);
  assert.doesNotMatch(recovery.text, /验证成功|确认成功|已验证|已确认/);
});

test("SDK code or name independently identify missing verifier", () => {
  assert.deepEqual(callbackFailureNotice({ code: "pkce_code_verifier_not_found" }), recovery);
  assert.deepEqual(callbackFailureNotice({ name: "AuthPKCECodeVerifierMissingError" }), recovery);
});

test("unrelated failures use a safe Chinese notice without echoing service details", () => {
  for (const error of [new Error("secret_token=do-not-echo"), { code: "flow_state_expired", message: "Internal upstream details" }, null, "untrusted raw failure"]) {
    const notice = callbackFailureNotice(error);
    assert.equal(notice.key, "error");
    assert.match(notice.text, /邮箱和密码/);
    assert.doesNotMatch(notice.text, /secret_token|upstream|untrusted|验证成功|已确认/);
  }
});
