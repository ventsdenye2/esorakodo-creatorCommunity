import { z } from "zod";

export const DEFAULT_PORTRAIT = "/character-maker/default-portrait.png";
export const DRAFT_KEY = "ktu-character-draft-v1";
const adjustment = z.object({ x: z.number().min(-80).max(80), y: z.number().min(-80).max(80), scale: z.number().min(75).max(125), width: z.number().min(80).max(120) });
export const appearanceSchema = z.object({
  version: z.literal(1),
  parts: z.record(z.string().max(32), z.string().max(40).nullable()),
  adjustments: z.record(z.string().max(32), adjustment),
  hairColor: z.string().max(32), hairPreset: z.string().max(40),
}).strict();
export type Appearance = z.infer<typeof appearanceSchema>;
export const characterSchema = z.object({
  requestId: z.uuid(), name: z.string().trim().max(32), collegeId: z.uuid().nullable(),
  ability: z.string().trim().max(2000), traits: z.string().trim().max(4000),
  portraitAssetId: z.uuid(), cardAssetId: z.uuid(),
  appearance: appearanceSchema.nullable(),
});
export type CharacterInput = z.infer<typeof characterSchema>;
export const draftSchema = characterSchema.omit({ portraitAssetId: true, cardAssetId: true }).extend({
  version: z.literal(1), step: z.number().int().min(0).max(5),
  portrait: z.string().max(2500000).refine(value => value === DEFAULT_PORTRAIT || /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value)),
});
export type CharacterDraft = z.infer<typeof draftSchema>;
export function newDraft(): CharacterDraft {
  return { version: 1, requestId: crypto.randomUUID(), step: 0, name: "", collegeId: null, ability: "", traits: "", portrait: DEFAULT_PORTRAIT, appearance: null };
}
export function studentNumber(id: string) { return `KTU-${id.replaceAll("-", "").slice(0, 12).toUpperCase()}`; }
export type AbilityExample = { name: string; slug: string; text: string };
export function extractAbility(body: string): string | null {
  const labelled = body.match(/(?:\|\s*(?:特殊)?(?:能力|技能)\s*\|\s*([^|\n]+)|(?:^|\n)\s*(?:[-*]\s*)?(?:\*\*)?(?:特殊)?(?:能力|技能)(?:\*\*)?\s*[：:]\s*([^\n]+))/);
  const section = body.match(/(?:^|\n)#{1,4}\s*[^\n]*(?:能力|技能)[^\n]*\n+([\s\S]*?)(?=\n#{1,4}\s|$)/);
  const value = (labelled?.[1] ?? labelled?.[2] ?? section?.[1])?.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*#>|`]/g, "").trim();
  return value ? value.slice(0, 180) : null;
}
