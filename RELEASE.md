# Direct forum like editing

Built source: d1df000 (deploy/backend), 2026-11-14.
Editor likes support click +1 and accelerating pointer holds; cancellation and count cap; shared draft persistence.
No database migration. Linux lint/typecheck/build, 24 editor/sync regressions and standalone smoke passed; 1440/390/320px click, keyboard, accelerated hold, release/blur/cancel, real touch, cap and actual draft serialization checks passed.
No production data or environment files included. Previous runtime ed53567 retained for rollback.
