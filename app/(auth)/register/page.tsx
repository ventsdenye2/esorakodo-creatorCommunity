import Link from "next/link";
import { AuthNotice, AuthShell } from "../../../src/components/auth/auth-shell";
import { signUp } from "../../../src/features/auth/actions";

export const metadata = { title: "注册" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  if (process.env.KTU_REGISTRATION_ENABLED === "false") {
    return (
      <AuthShell
        title="暂未开放注册"
        description="当前处于受限测试阶段，注册将在准备完成后开放。"
        alternate={<>已有账户？ <Link href="/login">登录</Link></>}
      >
        <AuthNotice tone="message">已有账户仍可正常登录。</AuthNotice>
        <Link className="button button-primary" href="/login">前往登录</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="建立 Creator 档案"
      description="Creator 是现实中的创作者账户。它负责署名、权限与贡献记录，不等同于空天大学里的 Student。"
      alternate={<>已有账户？ <Link href="/login">登录</Link></>}
    >
      <AuthNotice tone="error">{params.error}</AuthNotice>
      <form className="auth-form" action={signUp}>
        <label>显示名称<input name="displayName" type="text" autoComplete="name" maxLength={60} required /></label>
        <label>Creator 用户名<input name="handle" type="text" autoComplete="username" minLength={3} maxLength={32} pattern="[a-z0-9_]+" required /><small>仅小写字母、数字和下划线；后续用于公开主页地址。</small></label>
        <label>邮箱<input name="email" type="email" autoComplete="email" required /></label>
        <label>密码<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        <button className="button button-primary" type="submit">注册并建立档案</button>
      </form>
    </AuthShell>
  );
}
