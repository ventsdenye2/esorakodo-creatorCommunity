# KTU Co-Creation Platform — project instructions

## Source of truth

- `docs/KTU_CoCreation_Platform_Design_v0.1.docx` is the product and engineering baseline.
- This file records long-lived implementation constraints. If a later user request conflicts with it, follow the user and update the relevant documentation.
- Preserve migrations, code, and decisions in Git. Do not make production-only schema changes in the Supabase dashboard.

## Product model

- The site is the digital campus of Kongtian University, not an external fandom community or a reskinned social network.
- Creator/Profile is a real authenticated author. Student is an in-world person. Forum Account is an in-world internet identity. Never collapse these three concepts.
- One Creator may create many Students and Forum Accounts. A Forum Account may optionally reference one Student and may remain unknown or represent an organization/bot.
- The three eventual creative media are Campus Forum, Press/Publications, and Event Archives. Keep their layouts and domain models distinct.
- Student, College, Place, and Event are stable-ID wiki entities. Store relationships by UUID, not by display name.
- Published works tell stories; Wiki records traceable shared canon. Using a character in a work is not the same operation as editing that character's Wiki.
- Wiki changes require revision history. Do not add direct client-side wiki updates that bypass a revision-producing transaction.
- Event main archives have one maintaining Creator; other Creators extend them through Event Supplements.

## Engineering baseline

- TypeScript strict mode and App Router semantics are mandatory.
- The current Sites deployment uses Vinext's App Router-compatible runtime. Keep route and component code compatible with standard Next.js APIs; isolate runtime-specific behavior so a later move to canonical Next.js remains bounded.
- Use Supabase PostgreSQL + Auth + RLS. Keep `service_role` keys server-only and out of browser bundles.
- Use `@supabase/ssr`; do not reintroduce deprecated Supabase Auth Helpers.
- Use explicit relational tables. Do not replace the domain with a universal Entity/JSON table.
- Database migrations live in `supabase/migrations`. Every client-accessible table needs grants, RLS, indexes for its foreign keys, and a documented ownership policy.
- Cloudflare R2 is deferred. When introduced, PostgreSQL stores metadata/object keys and R2 stores bytes.
- Route files should stay thin. Put reusable UI in `src/components`, domain workflows in `src/features`, infrastructure in `src/lib`, and shared types in `src/types`.
- Prefer Server Components and server-side authorization. Add Client Components only for real browser interaction.

## UI direction: Living Campus v2 (proposed)

- `docs/design/living-campus-v2.md` is the current **proposed** front-end design guide; `docs/design/homepage-concept-v1.md` records the **implemented** homepage baseline. Do not describe planned Campus Layer or 3D behavior as shipped.
- Design the co-creation site as a campus that can be explored, read, traced and written: Entity (what), Relation/Trace (how connected), Campus/Space (where), Time (when). This is an interface model, not a universal Entity database table.
- Preserve Institutional × Editorial × Spatial × Living Archive, grounded in a university, archive and publication system. Avoid generic SaaS dashboards, uniform card waterfalls, dark neon HUDs, glassmorphism and decorative relationship lines.
- Keep the current five primary routes. Make Campus Layer a progressive, optional way to explore; 2D navigation and ordinary entity links must remain complete and accessible. Do not add inactive creation or search controls.
- Start with a lightweight SVG/CSS campus preview. Do not add Three.js or canonical building locations before actual 3D assets and Place-to-object bindings exist. Model data and business ownership stay separate; illustrative locations must be marked as demos.
- Preserve distinct structures: Forum as a BBS with ordered in-world floors, Press as an editorial publication, Events as an archive/timeline, Wiki as a revisioned record. Real Creator operations and fictional Forum Account speech must remain visibly separate.
- Keep visual decisions behind CSS custom properties, semantic component names and layout primitives. The v2 token values are proposals, not a completed visual migration.
- Before creating or substantially reshaping user-facing UI, invoke the `frontend-design` skill. Record the page subject, audience, single job, compact token/type/layout plan, one justified signature element, and a critique against generic templates before implementation.
- Implement the v2 guide in bounded stages. Every UI batch must cover responsive behavior, keyboard/touch access, focus return, reduced motion, and loading/empty/error/unauthorized/conflict states. Verify representative desktop and mobile renders before marking the stage complete.

## Security and delivery

- Treat hidden buttons as UX only, never authorization. Enforce ownership and permissions in server code and RLS.
- Validate untrusted input at the server boundary.
- Never commit `.env.local`, secrets, generated credentials, or production dumps.
- Do not implement later milestones speculatively. Prefer the smallest vertical slice that proves the current domain boundary.
- Before handoff, run `npm run lint`, `npm run typecheck`, and `npm run build`; fix failures rather than documenting them away.
- For each independent stage, leave a concise change note or Git commit explaining scope, migrations, and verification.
- Sync **every** code, configuration, UI, migration and test change with the relevant design/engineering documents in the same batch. Record progress, blockers, current commit/working-tree state, next step and actual verification in `docs/engineering/progress.md` and `docs/engineering/verification.md`; never let a code-only batch appear complete while its documents are stale.
- Use `docs/ROADMAP.md` as the milestone entrypoint and `docs/engineering/{RAS,RDS,DPS,progress,verification}.md` for requirement, design, task, recovery, and evidence tracking. Update the documents whenever scope, contracts, status, decisions or verification changes, including before pausing unfinished work.
