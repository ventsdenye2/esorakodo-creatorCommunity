#!/bin/sh
set -eu
# Install only this application's isolated runtime; never replace /usr/bin/node.
test "$(id -u)" = 0
if test -e /opt/ktu-node || test -e /srv/ktu-community || test -e /etc/ktu-community; then
  echo 'KTU paths already exist; inspect before retrying.' >&2
  exit 1
fi
if getent passwd ktu >/dev/null; then
  echo 'KTU user already exists; inspect before retrying.' >&2
  exit 1
fi
work=$(mktemp -d /tmp/ktu-node.XXXXXX)
trap 'rm -f "$work/SHASUMS256.txt" "$work/selected.sha256" "$work/$archive"; rmdir "$work"' EXIT
archive='not-downloaded'
curl --fail --silent --show-error --location --max-time 60 https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt -o "$work/SHASUMS256.txt"
archive=$(awk '$2 ~ /^node-v22\.[0-9]+\.[0-9]+-linux-x64.tar.gz$/ {print $2}' "$work/SHASUMS256.txt")
test -n "$archive"
version=${archive#node-}
version=${version%-linux-x64.tar.gz}
curl --fail --silent --show-error --location --max-time 180 "https://nodejs.org/dist/$version/$archive" -o "$work/$archive"
awk -v name="$archive" '$2 == name {print}' "$work/SHASUMS256.txt" > "$work/selected.sha256"
(cd "$work" && sha256sum -c selected.sha256)
install -d -m 755 /opt/ktu-node
tar -xzf "$work/$archive" -C /opt/ktu-node --strip-components=1 --no-same-owner
useradd --system --user-group --home-dir /srv/ktu-community --no-create-home --shell /usr/sbin/nologin ktu
install -d -o root -g ktu -m 750 /srv/ktu-community /srv/ktu-community/releases /etc/ktu-community
/opt/ktu-node/bin/node --version
printf 'Isolated KTU runtime and directories ready. No service or proxy enabled.\n'
