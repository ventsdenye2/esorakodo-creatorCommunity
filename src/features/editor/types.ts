import { z } from "zod";

export const structuredBodySchema = z.object({
  schema_version: z.literal(1),
  blocks: z.array(z.discriminatedUnion("type", [
    z.object({ type: z.enum(["paragraph", "heading", "quote"]), text: z.string().max(20000) }),
    z.object({ type: z.literal("entity"), entity_type: z.enum(["student", "college", "place", "event"]), entity_id: z.uuid(), label: z.string().trim().min(1).max(160) }),
    z.object({ type: z.literal("image"), asset_id: z.uuid(), alt: z.string().max(300) }),
  ])).max(150),
});
export type StructuredBody = z.infer<typeof structuredBodySchema>;
export type ContentBlock = StructuredBody["blocks"][number];
export type EditorEntity = { id: string; type: "student" | "college" | "place" | "event"; label: string; href: string };
export const emptyBody: StructuredBody = { schema_version: 1, blocks: [{ type: "paragraph", text: "" }] };
export function parseBody(value: unknown): StructuredBody { const parsed = structuredBodySchema.safeParse(value); return parsed.success ? parsed.data : emptyBody; }
