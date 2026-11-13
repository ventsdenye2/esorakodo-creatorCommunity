# Forum synchronization reliability fix

Built source: 748296f (deploy/backend), 2026-11-13.
Full-state Yjs submissions, missing dependency rejection, and durable acknowledgement before clearing browser backups.
No database migration. Linux lint/typecheck/build, 12 document regressions and standalone smoke passed; 36 local PostgreSQL checks and actual client hook backup test passed.
No production data or environment files included. Previous runtime 8e166402 retained for rollback.
