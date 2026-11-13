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
curl -s -b $J -o /tmp/oy_dash.html $T/
echo "MENU: leads_links=$(grep -o 'href="/admin/Leads"' /tmp/oy_dash.html | wc -l) analytics_links=$(grep -o 'href="/admin/Analytics"' /tmp/oy_dash.html | wc -l) dashboard_ok=$(grep -c 'Recent Popups\|Quick Actions' /tmp/oy_dash.html) html_closed=$(grep -c '</html>' /tmp/oy_dash.html)"
echo "MENU_LINK=$(grep -o '<a[^>]*href="/admin/Leads"[^>]*>[^<]*' /tmp/oy_dash.html | head -1 | tr -s ' \n' ' ' | cut -c1-140)"
echo "LOGGED_OUT_HOME_UNCHANGED=$(curl -s $T/Account/Login | grep -c 'href="/admin/Leads"')"
echo "INTEG_PAGE=$(curl -s -b $J -o /dev/null -w '%{http_code}' $T/admin/Integrations) unauth=$(curl -s -o /dev/null -w '%{http_code}' $T/admin/Integrations)"
save() { curl -s -b $J -o /dev/null -w '%{redirect_url}' -H "Origin: $T" --data-urlencode "url=$1" -d enabled=1 $T/admin/Integrations/save | sed 's/.*msg=//'; }
echo "SAVE_HTTP=$(save http://example.com/hook) SAVE_PRIVATE=$(save https://10.0.0.5/hook) SAVE_LOCALHOST=$(save https://localhost/hook) SAVE_GOOD=$(save https://example.com/jpw-test-hook)"
echo "SAVE_NO_ORIGIN=$(curl -s -b $J -o /dev/null -w '%{http_code}' -d url=https://example.com/x $T/admin/Integrations/save)"
echo "HOOK_ROW=$(sqlite3 $DB 'select TenantId, Url, IsEnabled from LeadWebhooks')"
echo "TEST_SEND=$(curl -s -b $J -o /dev/null -w '%{redirect_url}' -H "Origin: $T" -X POST $T/admin/Integrations/test | sed 's/.*msg=//') status=$(sqlite3 $DB 'select LastStatus from LeadWebhooks')"
curl -s -X POST -H 'Content-Type: application/json' -o /dev/null -d '{"popupId":4,"email":"jpw-hook@example.com"}' $T/api/leads/capture; sleep 4
echo "CAPTURE_FIRES_HOOK=$(sqlite3 $DB 'select LastStatus, LastAttemptAt from LeadWebhooks')"
pub() { curl -s "$T$1"; }
echo "TITLES: features=[$(pub /Home/Features | grep -o '<title>[^<]*</title>')] demo=[$(pub /Home/Demo | grep -o '<title>[^<]*</title>')]"
echo "CONTACT: old_email=$(pub /Home/Contact | grep -c -i 'popupmanagerpro') new_email=$(pub /Home/Contact | grep -o 'contact@optinyeti.com' | wc -l) dead_named=$(pub /Home/Contact | grep -c -E 'href=\"#\"[^>]*>(FAQ|Schedule a Demo|Video Tutorials)')"
echo "PRICING_QQ=$(pub /Home/Pricing | grep -c '?? <strong>') BLOG_OLD_NAME=$(pub /Blog | grep -c 'Popup Manager') PRICING_OK=$(pub /Home/Pricing | grep -c 'Compare All Features') SCRIPT_OK=$(pub /Popup/GetTenantScript/5 | grep -c 'PopupManager')"
echo "THEME: style=$(pub /Home/Pricing | grep -c 'id=\"oy-theme\"') tailwind_cfg=$(pub /Home/Pricing | grep -c 'tailwind.config') signed_in_style=$(curl -s -b $J $T/ | grep -c 'id=\"oy-theme\"') css_old_blue=$(pub /css/site.css | grep -c -i '#2563eb\|#3ca2ff') css_teal=$(pub /css/site.css | grep -c -i '#0F6B6B') css_status=$(curl -s -o /dev/null -w '%{http_code}' $T/css/site.css)"
echo "OLD_NAMES: popupx=$(for u in / /Home/Features /Home/Pricing /Home/Demo /Home/Contact /Home/Privacy /Account/Login /Account/Register /Blog; do pub $u; done | grep -c -i 'popupx\|popupmanager\|Popup Manager') blog_redirect=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$T/Blog/Post?slug=getting-started-popup-manager")"
echo "APP_GTM_COPIES=$(pub /Home/Pricing | grep -o 'googletagmanager.com/gtm.js' | wc -l) (expected 0 here; the web server adds one in production)"
echo "ADDON_ERRORS=$(docker logs optinyeti-test 2>&1 | grep -c 'OptinYeti.Leads\]')"

docker rm -f optinyeti-test >/dev/null 2>&1
rm -rf $D $J /tmp/oy_dash.html /tmp/oy_l1.html /tmp/oy_l2.html /tmp/oy_h.txt
