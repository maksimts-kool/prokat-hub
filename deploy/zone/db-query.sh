#!/usr/bin/env bash
# Runs SQL against the server's MariaDB with the credentials from api.pm2.json, without printing them.
# Usage: deploy/zone/db-query.sh "SELECT ..."   (or SQL on stdin)
set -euo pipefail

cd "$(dirname "$0")/../.."
# shellcheck source=/dev/null
source deploy/zone/zone.env

sql=${1:-$(cat)}
# The SQL goes over stdin; the password reaches mysql as MYSQL_PWD, never on a command line.
printf '%s' "$sql" | ssh "$ZONE_SSH" "node -e '
  const env = require(\"$REMOTE_HOME/prokathub/api.pm2.json\").apps[0].env
  const { spawnSync } = require(\"node:child_process\")
  const r = spawnSync(\"mysql\", [\"--no-defaults\", \"-t\", \"-h\", \"$DB_HOST\", \"-u\", \"$DB_USER\", \"$DB_NAME\"],
    { input: require(\"node:fs\").readFileSync(0), stdio: [\"pipe\", \"inherit\", \"inherit\"], env: { ...process.env, MYSQL_PWD: env.DB_PASSWORD } })
  process.exit(r.status ?? 1)
'"
