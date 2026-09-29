# Kongtian University Linux runtime

Artifact release: 2026-09-29, Chinese PKCE callback recovery and media origin validation.

This branch contains only the prebuilt Linux x86_64 runtime. Source belongs to
the deploy/backend branch. There is no build or dependency installation step on
the server. Keep application secrets outside this checkout in the existing
/etc/ktu-community environment file.

Entrypoint: dist/standalone/server.js. Preserve this directory layout because
the service uses current/dist/standalone/server.js.

Built with WSL Ubuntu Node 24.19.0. Standalone startup and trusted public HTTPS
origin behind internal HTTP were tested locally; a foreign origin was rejected.
The runtime still follows the project's Node >=22.13 requirement.

Source revision: 6b83219 (deploy/backend).
Original standalone tar SHA256:
d830482cdc013f67eb951bab595441e03d1bad5a2846eaea659ba4ccb001aa56

No local environment files, service credentials, or acceptance fixtures are
included. NEXT_PUBLIC deployment settings are compiled public configuration.

For updates, fetch deploy/runtime into a separate staging checkout. Export the
verified commit to a new releases directory, then atomically replace the current
symlink. Restart only ktu-community, check its loopback endpoint, and restore the
previous symlink if verification fails. Never git pull into the active release.

Missing-code and missing-PKCE callback routes were tested in standalone: safe Chinese notices, no untrusted redirect, and password-login recovery without claiming email confirmation succeeded.
