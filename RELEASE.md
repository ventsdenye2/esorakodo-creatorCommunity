# Shared encyclopedia Linux runtime -- prepared, NOT deployed

Feature source: b8ef879 (deploy/backend), 2026-10-15.
Adds Other wiki records and an anonymous public feed for the read-only official site.
Requires migration 202610150001_shared_wiki AND reviewed 21-entry official import.
Production migration/import was rejected by automatic approval review pending
explicit user authorization. Do not deploy before that approval and migration.

Validation: lint/typecheck, Windows and Linux five-stage builds, standalone
dependency completion (121 packages), 124 PostgreSQL acceptance checks, Windows
and Linux built feed handler (22 synthetic records), desktop/390px browser reading,
search, HTML/URL sanitization and actual campus /wiki edit-link navigation.
Production ROLLBACK rehearsal passed; read-only follow-up confirms no new schema
or canonical record changes persisted. No synthetic production records created.

Prepared local artifact commit only. No push, deployment or service restart.
No environment files, credentials or test fixture data included.
