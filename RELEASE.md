# Campus component motion Linux runtime

Source: e986aac (deploy/backend), 2026-10-15.
Adds official-site entrance rhythm, staggered archive rows, pointer feedback and
campus guide dialog transitions. No new dependencies or database migrations.

Validation: lint/typecheck, Windows and Linux five-stage builds, 121-package
standalone completion and Linux origin/callback smoke. Playwright verified
1440x1000 and 390x844, real 47-record wiki and one-record keyword filter,
four primary route transitions, six-card homepage, manual carousel, dialog
Escape/Tab/focus return, reduced motion and JavaScript off. Press and Events
have no current public records; their empty states were checked.
Previous runtime 020a810 remains the rollback target. Release using only
/etc/ktu-community/update-runtime.sh on the existing campus service.

No environment files, credentials, screenshots or application fixtures included.
Existing third-party package sources are retained by the standalone packager.
