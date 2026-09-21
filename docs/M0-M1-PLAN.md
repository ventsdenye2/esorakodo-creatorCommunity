# M0 / M1 implementation plan

This plan turns the product baseline into a deliberately small, extensible first engineering slice.

> Historical stage record: ongoing milestone and task status now lives in `ROADMAP.md` and `engineering/DPS.md`. Keep this file for the original M0/M1 scope and exit criteria.

## M0 — engineering skeleton

- [x] Initialize a Git-backed TypeScript App Router project for Sites.
- [x] Establish thin route files plus `src/components`, `src/features`, `src/lib`, and `src/types` boundaries.
- [x] Add a provisional institutional/editorial campus shell using replaceable CSS design tokens.
- [x] Add public route placeholders for Campus, Forum, Press, Events, and Wiki without implementing their business workflows.
- [x] Add environment templates and local Supabase configuration.
- [x] Add the first reproducible SQL migration, indexes, grants, and RLS policies.
- [x] Document setup, verification commands, product invariants, and architecture constraints.

## M1 — account foundation

- [x] Add browser/server Supabase wrappers with cookie-based SSR session support.
- [x] Add register, login, email callback/confirmation, sign-out, and a protected Creator page shell.
- [x] Create `profiles` from `auth.users` through a database trigger.
- [x] Model Creator/Profile, Student, College, Place, Forum Account, and Wiki Revision foundations.
- [x] Keep Forum Account independent from Student, with an optional Student link.
- [x] Add basic ownership RLS and public-read policies.
- [ ] Connect a real Supabase dev project and apply the migration.
- [ ] Add database-backed integration tests once the dev project exists.

## Deferred by design

- Forum Topic/Message authoring, Articles, Events, Timeline Nodes, and Event Supplements.
- Collaborative wiki edit transactions and rollback UI (M2).
- Cloudflare R2 media upload and processing.
- Full-text search, moderation automation, social incentives, and final visual art direction.

## Exit criteria

The local project must pass lint, typecheck, build, and route rendering without Supabase credentials. With credentials supplied, registration creates both an Auth user and a Creator profile, login establishes a server-readable session, and protected Creator access works.
