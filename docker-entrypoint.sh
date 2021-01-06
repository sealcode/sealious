#!/usr/bin/env sh
set -euo pipefail

whoami;

echo "$@";

chown -R $UID:$GID /opt/sealious/node_modules

PROGRAM=$1;
shift;

echo "/sbin/tini -s \"$PROGRAM\" $*";
su node -c "/sbin/tini -s \"$PROGRAM\" $*";


