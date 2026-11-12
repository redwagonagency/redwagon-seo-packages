#!/bin/sh
# Signed-in checks for the Leads pages, run on a side port against a COPY of the database.
# Registers a throwaway JPW test user in the copy; production data is never touched.
IMG="${1:-optinyeti:leads-2}"
T=http://127.0.0.1:3299
D=/tmp/oy_testdir
J=/tmp/oy_jar
DB=$D/PopupManager.db
U=jpw-test-user@example.com
PW="Jpw-$(head -c 12 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')-9a!"

docker rm -f optinyeti-test >/dev/null 2>&1
rm -rf $D $J && mkdir -p $D
sqlite3 "file:/srv/apps/optinyeti/PopupManager.db?mode=ro" ".backup $DB"
docker run -d --name optinyeti-test -p 127.0.0.1:3299:80 -v $D:/data \
  -e "ConnectionStrings__DefaultConnection=Data Source=/data/PopupManager.db" \
  -e OPTINYETI_DB=/data/PopupManager.db "$IMG" >/dev/null
sleep 8

token() { curl -s -b $J -c $J "$T$1" | grep -o '__RequestVerificationToken[^>]*' | grep -o 'value="[^"]*"' | head -1 | cut -d'"' -f2; }

TK=$(token /Account/Register)
echo "REGISTER=$(curl -s -b $J -c $J -o /dev/null -w '%{http_code}' \
  --data-urlencode "FirstName=JPW" --data-urlencode "LastName=Test" --data-urlencode "CompanyName=JPW Test Co" \
  --data-urlencode "Email=$U" --data-urlencode "Password=$PW" --data-urlencode "ConfirmPassword=$PW" \
  --data-urlencode "__RequestVerificationToken=$TK" $T/Account/Register)"
echo "USER_CREATED=$(sqlite3 $DB "select count(*) from AspNetUsers where Email='$U'")"

TK=$(token /Account/Login)
echo "LOGIN=$(curl -s -b $J -c $J -o /dev/null -w '%{http_code}' \
  --data-urlencode "Email=$U" --data-urlencode "Password=$PW" --data-urlencode "RememberMe=false" \
  --data-urlencode "__RequestVerificationToken=$TK" $T/Account/Login)"

curl -s -X POST -H 'Content-Type: application/json' -o /dev/null \
  -d '{"tenantId":5,"popupId":4,"email":"jpw-lead@example.com","name":"JPW Lead","source":"=jpw-formula-check"}' $T/api/leads/capture

echo "LIST_OTHER_TENANT=$(curl -s -b $J -o /tmp/oy_l1.html -w '%{http_code}' $T/admin/Leads) shows_lead=$(grep -c 'jpw-lead@example.com' /tmp/oy_l1.html) empty_state=$(grep -c 'No leads yet' /tmp/oy_l1.html)"
echo "EXPORT_OTHER_TENANT_ROWS=$(curl -s -b $J $T/admin/Leads/export | grep -c 'jpw-lead')"
LEAD_ID=$(sqlite3 $DB "select Id from EmailCaptures where Email='jpw-lead@example.com'")
echo "DELETE_OTHER_TENANT=$(curl -s -b $J -o /dev/null -w '%{http_code}' -H "Origin: $T" -d "id=$LEAD_ID" $T/admin/Leads/delete) rows_after=$(sqlite3 $DB 'select count(*) from EmailCaptures')"

sqlite3 $DB "update AspNetUsers set TenantId=5 where Email='$U'"
echo "LIST_OWN_TENANT=$(curl -s -b $J -o /tmp/oy_l2.html -w '%{http_code}' $T/admin/Leads) shows_lead=$(grep -c 'jpw-lead@example.com' /tmp/oy_l2.html) shows_name=$(grep -c 'JPW Lead' /tmp/oy_l2.html)"
echo "SEARCH_MISS=$(curl -s -b $J "$T/admin/Leads?q=zzzz" | grep -c 'Nothing matches')"
echo "EXPORT=$(curl -s -b $J -D /tmp/oy_h.txt $T/admin/Leads/export | tail -1 | cut -c1-150)"
echo "EXPORT_TYPE=$(grep -i -E 'content-type|content-disposition' /tmp/oy_h.txt | tr -d '\r' | tr '\n' ' ')"
echo "DELETE_BAD_ORIGIN=$(curl -s -b $J -o /dev/null -w '%{http_code}' -H 'Origin: https://evil.example' -d "id=$LEAD_ID" $T/admin/Leads/delete) rows_after=$(sqlite3 $DB 'select count(*) from EmailCaptures')"
echo "DELETE_OK=$(curl -s -b $J -o /dev/null -w '%{http_code}' -H "Origin: $T" -d "id=$LEAD_ID" $T/admin/Leads/delete) rows_after=$(sqlite3 $DB 'select count(*) from EmailCaptures')"
echo "ADDON_ERRORS=$(docker logs optinyeti-test 2>&1 | grep -c 'OptinYeti.Leads\]')"

docker rm -f optinyeti-test >/dev/null 2>&1
rm -rf $D $J /tmp/oy_l1.html /tmp/oy_l2.html /tmp/oy_h.txt
