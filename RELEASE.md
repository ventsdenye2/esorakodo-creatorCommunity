# Kongtian University Linux runtime

Source revision: 72210ce853c6f81abf74e91e32da1c073d653b3c (deploy/backend).
Release: 2026-09-29 forum reply trees, inline authoring, authored reaction counts,
independent forum identities, Markdown wiki bodies and revision comparison.
Required database migration: 202609290001 (already applied and verified).

Linux x86_64 runtime built in WSL Ubuntu with Node 24.19.0. Entry point:
dist/standalone/server.js. Server uses its existing isolated Node 22 runtime.
Local Linux standalone startup, callback and media-origin smoke checks passed.
Database tests: 38 assertions in isolated PostgreSQL 17. Browser component and
real public data read checks recorded on the source branch.

No environment files, credentials, local tests or creator fixture data included.
Only NEXT_PUBLIC deployment configuration is compiled. Server configuration
remains in /etc/ktu-community. Deploy with its existing update-runtime.sh,
which fetches this artifact branch, switches releases and checks health.
