# Kongtian University Linux runtime

Source revision: d906cf0e887039a7c9762f511d9f9f5fbfe45762 (deploy/backend).
Release: 2026-10-12 forum multi-image upload/paste, direct-floor quote thumbnails,
full-image viewer, topic-owner badges and synchronized Markdown/editor guide.
Requires additive migration 202610120001_forum_images (already applied).

Linux x86_64 runtime built in WSL Ubuntu with Node 24.19.0. Entry point:
dist/standalone/server.js. Server uses its existing isolated Node 22 runtime.
Local Linux standalone startup, callback and media-origin smoke checks passed.
Guide: forum floor screenshot and image instructions synchronized. Browser UI and
responsive checks recorded on the source branch; no production creator writes.

No environment files, credentials, local tests or creator fixture data included.
Only NEXT_PUBLIC deployment configuration is compiled. Server configuration
remains in /etc/ktu-community. Deploy with its existing update-runtime.sh,
which fetches this artifact branch, switches releases and checks health.
