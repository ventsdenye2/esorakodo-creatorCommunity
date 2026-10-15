# Official university visual theme -- Linux runtime

Source: 80309f8, design/official-campus-theme, 2026-10-15.
Aligns existing campus components to the official university palette, 8px controls,
18px panels and 28px feature surfaces, with existing content and motion preserved.
No dependency, database or data contract changes.

Source baseline: 39d592b, saved and pushed as annotated tag
checkpoint/campus-before-official-theme-20261015.
Runtime rollback: 195b8576222873bf0d481691598dc9f2078f409b.

Validation: lint/typecheck, Windows/Linux five-stage builds, 121-package completion,
Linux origin/callback smoke, actual Linux standalone desktop/mobile inspection,
four client route transitions, real 47-record wiki and one-record keyword filter,
6-card carousel, dialog Tab/Escape/focus return, reduced motion, JavaScript off,
login error notice, text contrast and 320/768/1024/1920px prototype layout checks.
Press/Events public empty states verified; no authenticated production writes.
5904 files, 58228930 bytes; every file matches the Linux build by SHA-256.
No environment files, credentials, screenshots or application fixtures included.

Deploy using only /etc/ktu-community/update-runtime.sh; keep the previous release.
