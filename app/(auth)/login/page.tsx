import Link from "next/link";
import { AuthNotice, AuthShell } from "../../../src/components/auth/auth-shell";
import { signIn } from "../../../src/features/auth/actions";

export const metadata = { title: "登录" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      title="返回校园"
      description="使用真实 Creator 身份管理作品、人物与共创记录。校内角色身份将在创作流程中另行选择。"
      alternate={<>还没有 Creator 档案？ <Link href="/register">注册</Link></>}
    >
      <AuthNotice tone="error">{params.error}</AuthNotice>
      <AuthNotice tone="message">{params.message}</AuthNotice>
      <form className="auth-form" action={signIn}>
        <label>邮箱<input name="email" type="email" autoComplete="email" required /></label>
        <label>密码<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
        <button className="button button-primary" type="submit">登录</button>
      </form>
    </AuthShell>
  );
}
