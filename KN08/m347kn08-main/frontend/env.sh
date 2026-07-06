#!/bin/sh
set -e
ROOT=/usr/share/nginx/html
echo "[env.sh] injecting runtime configuration..."
for VAR in FRONTEND_MS_ACCOUNT_HOLDINGS FRONTEND_MS_ACCOUNT_FRIENDS \
           FRONTEND_MS_BUYSELL_BUY FRONTEND_MS_BUYSELL_SELL \
           FRONTEND_MS_SENDRECEIVE_SEND; do
  VALUE=$(eval echo "\$$VAR")
  if [ -n "$VALUE" ]; then
    # escape sed-special chars (& and \) in the replacement value
    ESCAPED=$(printf '%s' "$VALUE" | sed -e 's/[\\&]/\\&/g')
    find "$ROOT" -type f -name '*.js' -exec sed -i "s|$VAR|$ESCAPED|g" {} +
    echo "[env.sh]   $VAR -> $VALUE"
  fi
done
echo "[env.sh] done."
