#!/usr/bin/env bash
# Opens the app's settings on the server in an editor, then reloads the app with them.
#   deploy/zone/edit-env.sh          the API      (~/prokathub/api.pm2.json)
#   deploy/zone/edit-env.sh worker   the worker   (~/prokathub/worker.pm2.json)
#
# Settings are the "env" values. Nested ASP.NET settings use __ for ":", e.g. Seed__DemoData or
# Serilog__MinimumLevel__Default. Edits survive deploys; only the address, path, database and the worker's
# login (from zone.env and the API's Service password) are rewritten by deploy.sh.
# After changing DB_PASSWORD, run deploy.sh so the connection string is rebuilt.
set -euo pipefail

cd "$(dirname "$0")/../.."
# shellcheck source=/dev/null
source deploy/zone/zone.env

case ${1:-api} in
  api) name=api ;;
  worker) name=worker ;;
  *) echo "Usage: $0 [api|worker]" >&2; exit 2 ;;
esac
file=$REMOTE_HOME/prokathub/$name.pm2.json
editor=${ZONE_EDITOR:-nano}

# Edits a copy; the real file and the app change only if the copy is still valid JSON.
ssh -t "$ZONE_SSH" "
  set -e
  tmp=\$(mktemp ~/prokathub/.$name.XXXXXX.json)
  trap 'rm -f \"\$tmp\"' EXIT
  cp '$file' \"\$tmp\"
  while true; do
    $editor \"\$tmp\"
    if cmp -s '$file' \"\$tmp\"; then echo 'No changes.'; exit 0; fi
    if node -e 'JSON.parse(require(\"fs\").readFileSync(process.argv[1], \"utf8\"))' \"\$tmp\" 2>/dev/null; then break; fi
    read -rp 'That is not valid JSON. Edit again? [Y/n] ' answer
    [[ \$answer =~ ^[Nn] ]] && { echo 'Nothing changed.'; exit 1; }
  done
  cat \"\$tmp\" > '$file'
  pm2 startOrReload '$file' --update-env >/dev/null && pm2 save --force >/dev/null
  echo 'Saved and reloaded prokathub-$name.'
"
