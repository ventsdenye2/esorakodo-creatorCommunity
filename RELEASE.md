# Reusable momo default identity

Built source: 82a8dab (deploy/backend), 2026-11-13.
One default momo identity per Creator across topics; explicit character creation and folded historical placeholders.
Requires additive migration 202611130001_forum_default_momo (applied with existing-data fingerprint checks). Linux lint/typecheck/build, 24 editor/sync regressions and standalone smoke passed; 16 default-identity database checks, 36 collaboration checks and desktop/mobile picker/list interactions passed.
No production data or environment files included. Previous runtime ee3a954 retained for rollback.
