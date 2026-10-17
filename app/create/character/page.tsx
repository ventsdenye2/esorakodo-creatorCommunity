import { SiteHeader } from "../../../src/components/layout/site-header";
import { SiteFooter } from "../../../src/components/layout/site-footer";
import { CharacterCreator } from "../../../src/features/character/character-creator";
import { listAbilityExamples, listCharacterColleges } from "../../../src/features/character/queries";
import { getAuthenticatedCreatorId } from "../../../src/features/wiki/queries";
import { isSupabaseConfigured } from "../../../src/lib/supabase/config";
import "../../../src/features/character/character.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "角色创建" };
export default async function CharacterCreationPage() {
  const [colleges, examples, creator] = await Promise.allSettled([listCharacterColleges(), listAbilityExamples(), getAuthenticatedCreatorId()]);
  return <><SiteHeader current="wiki" /><main id="main-content" className="character-page"><CharacterCreator
    colleges={colleges.status === "fulfilled" ? colleges.value.map(({ id, name, summary }) => ({ id, name, summary })) : []}
    examples={examples.status === "fulfilled" ? examples.value : []}
    creatorId={creator.status === "fulfilled" ? creator.value : null}
    sourceFailed={colleges.status === "rejected" || examples.status === "rejected"}
    configured={isSupabaseConfigured()}
  /></main><SiteFooter /></>;
}
