#!/bin/sh
# Runs the given image on a side port against a COPY of the database and checks the add-on.
IMG="${1:-optinyeti:leads-1}"
T=http://127.0.0.1:3299
docker rm -f optinyeti-test >/dev/null 2>&1
rm -rf /tmp/oy_testdir && mkdir -p /tmp/oy_testdir
sqlite3 "file:/srv/apps/optinyeti/PopupManager.db?mode=ro" ".backup /tmp/oy_testdir/PopupManager.db"
docker run -d --name optinyeti-test -p 127.0.0.1:3299:80 -v /tmp/oy_testdir:/data \
  -e "ConnectionStrings__DefaultConnection=Data Source=/data/PopupManager.db" \
  -e OPTINYETI_DB=/data/PopupManager.db "$IMG" >/dev/null
sleep 8
post() { curl -s -X POST -H 'Content-Type: application/json' -d "$1" $T/api/leads/capture; }
P='{"tenantId":5,"popupId":4,"email":"jpw-test@example.com","name":"JPW Test","source":"jpw-side-port-test"}'
echo "LOGIN=$(curl -s -o /dev/null -w '%{http_code}' $T/Account/Login)"
echo "CAP1=$(post "$P")"
echo "CAP2=$(post "$P")"
echo "BAD=$(post '{"popupId":4,"email":"nope"}')"
echo "WRONGTENANT=$(post '{"tenantId":1,"popupId":4,"email":"jpw2@example.com"}')"
echo "NOPOPUP=$(post '{"popupId":99999,"email":"jpw3@example.com"}')"
echo "ROWS=$(sqlite3 /tmp/oy_testdir/PopupManager.db 'select count(*), min(Email), min(FirstName), min(LastName), min(TenantId) from EmailCaptures')"
echo "PREFLIGHT=$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS -H 'Origin: https://example.com' -H 'Access-Control-Request-Method: POST' $T/api/leads/capture)"
echo "LEADS_UNAUTH=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' $T/admin/Leads)"
echo "EXPORT_UNAUTH=$(curl -s -o /dev/null -w '%{http_code}' $T/admin/Leads/export)"
echo "DELETE_NO_ORIGIN=$(curl -s -o /dev/null -w '%{http_code}' -X POST -d id=1 $T/admin/Leads/delete)"
echo "ENGINE=$(curl -s $T/js/popup-engine.js | grep -c -E 'wireLeadCapture|api/leads/capture')"
echo "TRACK_CORS=$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS -H 'Origin: https://example.com' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type' $T/api/tracking/event)"
echo "HEADERS=$(curl -s -D - -o /dev/null $T/Account/Login | grep -i -E 'x-content|referrer|x-frame' | tr -d '\r' | tr '\n' ';')"
echo "STARTUP_ERRORS=$(docker logs optinyeti-test 2>&1 | grep -c -E 'Hosting startup assembly exception|OptinYeti.Leads\]')"
echo "USERS_VISIBLE=$(sqlite3 /tmp/oy_testdir/PopupManager.db 'select count(*) from AspNetUsers')"
echo "DATA_DIR=$(ls /tmp/oy_testdir | tr '\n' ' ')"
echo "APP_DIR_DB=$(docker exec optinyeti-test sh -c 'ls /app | grep -c PopupManager.db')"
