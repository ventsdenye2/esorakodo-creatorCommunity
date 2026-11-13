import Link from "next/link";
import type { ForumAccount } from "../../types/database";
import { groupForumAccounts } from "./account-groups";

export function CreatorForumIdentities({ accounts, failed = false }: { accounts: ForumAccount[]; failed?: boolean }) {
  const identityGroups = groupForumAccounts(accounts);
  return <section aria-label="我的论坛身份"><h2>论坛身份</h2><Link href="/create/forum/account">建立角色身份 ↗</Link>{failed?<p role="alert">身份列表暂时无法加载。</p>:<ul className="portal-list">{identityGroups.characters.map(account=><li key={account.id}><Link href={`/create/forum/account/${account.id}`}>{account.display_name}<span>编辑 ↗</span></Link><p>@{account.handle} · <Link href={`/forum/accounts/${account.handle}`}>公开档案</Link></p></li>)}</ul>}{!failed&&!identityGroups.characters.length&&<p className="portal-empty">还没有独立角色身份。默认路人统一使用 momo。</p>}{!!identityGroups.legacy.length&&<details className="portal-legacy-accounts"><summary>历史自动路人（{identityGroups.legacy.length}）</summary><p>保留原帖发言与引用；改成独立昵称或补充角色资料后，会回到上方角色列表。</p><ul className="portal-list">{identityGroups.legacy.map(account=><li key={account.id}><Link href={`/create/forum/account/${account.id}`}>{account.display_name}<span>编辑 ↗</span></Link></li>)}</ul></details>}</section>;
}
