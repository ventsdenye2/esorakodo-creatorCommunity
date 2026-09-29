/** @param {unknown} error */
export function callbackFailureNotice(error) {
  if (error && typeof error === "object" && (
    ("code" in error && error.code === "pkce_code_verifier_not_found") ||
    ("name" in error && error.name === "AuthPKCECodeVerifierMissingError")
  )) {
    return { key: "message", text: "无法在当前浏览器自动登录，请用注册邮箱和密码登录。" };
  }
  return { key: "error", text: "暂时无法完成登录。请尝试用注册邮箱和密码登录；如仍提示邮箱未确认，请重新打开确认邮件中的链接。" };
}
