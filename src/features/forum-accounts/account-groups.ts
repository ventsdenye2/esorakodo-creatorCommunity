import type { ForumAccount } from "../../types/database";

type AccountSummary = Pick<ForumAccount, "is_default" | "handle" | "display_name" | "account_type" | "student_id" | "avatar_asset_id" | "avatar_key" | "signature">;
const generatedName = /^(路过图书馆|晚自习观察员|食堂排队中|走廊的风|今天没有早八|操场散步中|窗边的位置|课间十分钟)\d{4}$/;
// Presentation grouping only. Never merge/delete historic identities by their name.
export function isLegacyGeneratedAccount(account: AccountSummary) {
  return !account.is_default && /^campus_[a-f0-9]{12}$/.test(account.handle)
    && generatedName.test(account.display_name) && account.account_type === "unknown"
    && !account.student_id && !account.avatar_asset_id && !account.avatar_key && !account.signature;
}
export function groupForumAccounts<T extends AccountSummary>(accounts: T[]) {
  return { characters: accounts.filter(a => !a.is_default && !isLegacyGeneratedAccount(a)),
    legacy: accounts.filter(isLegacyGeneratedAccount), defaults: accounts.filter(a => a.is_default) };
}
