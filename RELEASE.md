# Collaboration recovery generation boundary

Built source: a229e34 (deploy/backend), 2026-11-14.
Reject stale pre-recovery submissions, isolate browser backups by recovery generation, and stop live clients before merging rebuilt state.
No database migration. Linux lint/typecheck/build, 26 editor/sync regressions and standalone smoke passed; Recovery generation and real hook backup isolation/reload tests passed. Single-document recovery separately guarded and backed up.
No production data or environment files included. Previous runtime 8228136 retained for rollback.
