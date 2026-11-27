#!/usr/bin/env bash
# Asks for the MyZone database password and stores it in DB_PASSWORD of the server's api.pm2.json, without
# it showing on screen, in shell history or in the repository. Run deploy/zone/deploy.sh afterwards.
set -euo pipefail

cd "$(dirname "$0")/../.."
# shellcheck source=/dev/null
source deploy/zone/zone.env

read -rsp "MariaDB password for $DB_USER: " password
echo
[[ -n $password ]] || { echo "No password given." >&2; exit 1; }

# The password goes over stdin, so it never appears in a command line on either machine.
printf '%s' "$password" | ssh "$ZONE_SSH" "node -e '
  const fs = require(\"node:fs\")
  const file = \"$REMOTE_HOME/prokathub/api.pm2.json\"
  const config = JSON.parse(fs.readFileSync(file, \"utf8\"))
  config.apps[0].env.DB_PASSWORD = fs.readFileSync(0, \"utf8\")
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + \"\\n\", { mode: 0o600 })
'"
echo "Saved. Now run: deploy/zone/deploy.sh"
