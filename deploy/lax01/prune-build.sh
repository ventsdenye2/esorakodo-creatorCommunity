#!/bin/sh
set -eu
release=/srv/ktu-community/releases/20260928-01
test "$(readlink -f "$release")" = "$release"
test "$(readlink -f /srv/ktu-community/current)" = "$release"
test -f "$release/dist/standalone/server.js"
# Preserve the independently runnable artifact and a small smoke-test script.
install -m 644 "$release/deploy/ubuntu/smoke-standalone.mjs" /etc/ktu-community/smoke-standalone.mjs
sha256sum /etc/ktu-community/source.tar.gz > /etc/ktu-community/source-20260928-01.sha256
for path in "$release"/* "$release"/.[!.]*; do
  test -e "$path" || continue
  test "$path" = "$release/dist" && continue
  case "$(readlink -f "$path")" in "$release"/*) rm -rf -- "$path" ;; *) echo 'Unsafe release path'; exit 1 ;; esac
done
for name in client server .openai; do
  path="$release/dist/$name"
  test ! -e "$path" || { test "$(readlink -f "$path")" = "$path" && rm -rf -- "$path"; }
done
test "$(readlink -f /srv/ktu-community/.npm)" = /srv/ktu-community/.npm
rm -rf -- /srv/ktu-community/.npm
rm -f -- /etc/ktu-community/source.tar.gz
# This dedicated Node installation is used only by KTU; keep node and licenses.
for path in /opt/ktu-node/include /opt/ktu-node/share /opt/ktu-node/lib; do
  test ! -e "$path" || { test "$(readlink -f "$path")" = "$path" && rm -rf -- "$path"; }
done
rm -f -- /opt/ktu-node/bin/npm /opt/ktu-node/bin/npx /opt/ktu-node/bin/corepack
systemctl restart ktu-community
printf 'Build-only files removed; runtime restarted.\n'
du -sh /opt/ktu-node "$release" /etc/ktu-community
df -h /
