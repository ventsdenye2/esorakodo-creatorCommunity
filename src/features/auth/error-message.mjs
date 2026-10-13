/** Translate provider codes without exposing internal Auth errors. */
export function authErrorMessage(error) {
  const messages = {
    invalid_credentials: "邮箱或密码不正确，请重新输入。",
    email_not_confirmed: "邮箱尚未验证，请先完成邮件中的验证。",
    user_already_exists: "该邮箱已注册，请登录或找回密码。",
    email_exists: "该邮箱已注册，请登录或找回密码。",
    weak_password: "密码强度不足，请使用更长且包含多种字符的密码。",
    signup_disabled: "当前暂未开放注册，请稍后再试。",
    over_request_rate_limit: "操作过于频繁，请稍后再试。",
    over_email_send_rate_limit: "验证邮件发送过于频繁，请稍后再试。",
    request_timeout: "服务响应超时，请稍后重试。",
  };
  return messages[error.code] ?? (error.status === 429 ? "操作过于频繁，请稍后再试。" : "操作未完成，请检查输入或稍后重试。");
}
