#!/bin/sh
# Run as root; only the campus service and release directories are changed.
set -eu
base=/srv/ktu-community
repo=$base/runtime-repository.git
remote=https://github.com/ventsdenye2/esorakodo-creatorCommunity.git
if [ ! -d "$repo" ]; then git init --bare "$repo"; fi
git --git-dir="$repo" fetch --depth=1 "$remote" refs/heads/deploy/runtime
revision=$(git --git-dir="$repo" rev-parse FETCH_HEAD)
release=$base/releases/git-$revision
previous=$(readlink "$base/current")
if [ ! -d "$release" ]; then
  mkdir "$release"
  git --git-dir="$repo" archive "$revision" | tar -x -C "$release"
  test -f "$release/dist/standalone/server.js"
  chown -R ktu:ktu "$release"
fi
ln -s "$release" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
systemctl restart ktu-community
attempt=0
until curl --fail --silent --output /dev/null http://127.0.0.1:3107/login; do
  attempt=$((attempt+1))
  if [ "$attempt" -ge 15 ]; then
    ln -s "$previous" "$base/current.rollback"
    mv -Tf "$base/current.rollback" "$base/current"
    systemctl restart ktu-community
    echo 'Health check failed; previous release restored.' >&2
    exit 1
  fi
  sleep 1
done
printf 'Deployed runtime %s\n' "$revision"
# No source checkout, dependency install, build, database change or other service restart.
