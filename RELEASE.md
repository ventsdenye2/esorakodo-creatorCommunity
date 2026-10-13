# Kongtian University Linux runtime

Source revision: eb3d6d3f03e728d320b775584eeefdb659a43aa8 (deploy/backend).
Release: 2026-10-13 creator form retention, upload/save locking, accurate saved
notices, safe login return, Chinese errors, stable revision hydration and comment pages.
Requires additive migration 202610130001_publication_body_guard (already applied).

Linux x86_64 runtime built in WSL Ubuntu with Node 24.19.0. Entry point:
dist/standalone/server.js. Server uses its existing isolated Node 22 runtime.
Local Linux standalone startup, callback and media-origin smoke checks passed.
99 isolated PostgreSQL checks passed, including Unicode whitespace rejection and
111 same-timestamp comment paging. Real component browser/SSR/mobile checks passed.
Production verification follows deployment; no synthetic public posts are published.

No environment files, credentials, local tests or creator fixture data included.
Only NEXT_PUBLIC deployment configuration is compiled. Server configuration
remains in /etc/ktu-community. Deploy with its existing update-runtime.sh,
which fetches this artifact branch, switches releases and checks health.
