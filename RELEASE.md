# Kongtian University Linux runtime

Source revision: 75e29ecc15f3ee28031fcdc17a62753ca7adc522 (deploy/backend).
Release: 2026-10-01 Markdown import for forum, articles and event drafts,
strict versioned templates, identity creation and illustrated format guide.
No new database migration. Previous schema 202609290001 remains in use.

Linux x86_64 runtime built in WSL Ubuntu with Node 24.19.0. Entry point:
dist/standalone/server.js. Server uses its existing isolated Node 22 runtime.
Local Linux standalone startup, callback and media-origin smoke checks passed.
Guide: 11 original interface captures and 38 numbered explanations. Browser UI and
responsive checks recorded on the source branch; no production creator writes.

No environment files, credentials, local tests or creator fixture data included.
Only NEXT_PUBLIC deployment configuration is compiled. Server configuration
remains in /etc/ktu-community. Deploy with its existing update-runtime.sh,
which fetches this artifact branch, switches releases and checks health.
