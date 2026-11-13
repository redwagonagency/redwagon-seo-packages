#!/bin/sh
# Saves rendered copies of signed-in app pages for visual review, from a side-port container
# running against a COPY of the database (throwaway JPW user). Pages that can show keys or
# account details (Settings, Subscription, Profile, Admin) are deliberately not saved.
# Usage: snapshot.sh IMAGE [path=name ...]     Remove with: rm -rf /srv/apps/optinyeti-site/img/pv-*
. "$(dirname "$0")/sidelib.sh"
IMG="${1:-optinyeti:leads-7}"
shift 2>/dev/null
OUT=/srv/apps/optinyeti-site/img/pv-$(head -c 9 /dev/urandom | base64 | tr -dc 'a-z0-9' | cut -c1-10)
rm -rf /srv/apps/optinyeti-site/img/pv-* && mkdir -p "$OUT"
side_start "$IMG"
save() { CODE=$(curl -s -b $J -o "$OUT/$2.html" -w '%{http_code}' "$T$1"); echo "$1 -> $2.html ($CODE, $(wc -c < "$OUT/$2.html") bytes)"; }
if [ $# -gt 0 ]; then
  for pair in "$@"; do save "${pair%%=*}" "${pair##*=}"; done
else
  save / dashboard
  save /Popup popups
  save /Popup/Create create
  save /Popup/SelectTemplate select
  save /Popup/Edit/4 edit
  save /Popup/Designer/4 designer
  save /admin/Templates templates
  save /admin/Analytics analytics
  save /admin/Support support
  save /admin/Leads leads
  save /admin/Integrations integrations
fi
chmod -R a+rX "$OUT"
side_stop
echo "PREVIEW_DIR=$(basename "$OUT")"
