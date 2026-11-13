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
# ---- templates
curl -s -b $J -o /tmp/oy_gal.html $T/Popup/SelectTemplate
echo "GALLERY=$(curl -s -b $J -o /dev/null -w '%{http_code}' $T/Popup/SelectTemplate) cards=$(grep -o 'class="tpl"' /tmp/oy_gal.html | wc -l) db_usable=$(sqlite3 $DB 'select count(*) from PopupTemplates where IsActive=1') thumbs=$(grep -o 'src="/img/templates/' /tmp/oy_gal.html | wc -l) sections=$(grep -o '<section id=' /tmp/oy_gal.html | wc -l) unauth=$(curl -s -o /dev/null -w '%{http_code}' $T/Popup/SelectTemplate)"
use() { curl -s -b $J -o /dev/null -w '%{http_code} %{redirect_url}' -H "Origin: $T" -d "id=$1" $T/Popup/UseTemplate | sed "s#$T##"; }
sqlite3 $DB "update SubscriptionPlans set MaxPopups=100"
BEFORE=$(sqlite3 $DB 'select count(*) from Popups')
echo "USE_NO_ORIGIN=$(curl -s -b $J -o /dev/null -w '%{http_code}' -d id=1 $T/Popup/UseTemplate) USE_UNAUTH=$(curl -s -o /dev/null -w '%{http_code}' -H "Origin: $T" -d id=1 $T/Popup/UseTemplate) rows_added=$(( $(sqlite3 $DB 'select count(*) from Popups') - BEFORE ))"
echo "USE_MISSING=$(use 999999) SPIN_OPTIONS=$(sqlite3 $DB 'select substr(TypeSpecificOptions,1,300) from PopupTemplates where Id=6')"
for TY in 0 1 2 3 4 5 6 7; do
  TID=$(sqlite3 $DB "select Id from PopupTemplates where IsActive=1 and Type=$TY order by Id desc limit 1")
  [ -z "$TID" ] && { echo "USE_TYPE_$TY=no template"; continue; }
  R=$(use $TID); NID=$(echo "$R" | grep -o '[0-9]*$')
  echo "USE_TYPE_$TY=$R tenant=$(sqlite3 $DB "select TenantId from Popups where Id=$NID") status=$(sqlite3 $DB "select Status from Popups where Id=$NID") html_len=$(sqlite3 $DB "select length(json_extract(Content,'\$.html')) from Popups where Id=$NID") edit=$(curl -s -b $J -o /dev/null -w '%{http_code}' $T/Popup/Edit/$NID) designer=$(curl -s -b $J -o /dev/null -w '%{http_code}' "$T/Popup/Designer/$NID")"
done
EID=$(sqlite3 $DB "select max(Id) from Popups where Type=1")
echo "EMAIL_POPUP: form=$(sqlite3 $DB "select Content from Popups where Id=$EID" | grep -c 'type=..\"email') success=$(sqlite3 $DB "select Content from Popups where Id=$EID" | grep -c 'data-success') script_tags=$(sqlite3 $DB "select count(*) from Popups where Id>$BEFORE and Content like '%<script%'")"
sqlite3 $DB "update Popups set Status=(select Status from Popups where Id=4) where Id=$EID"
echo "WHEEL: popup=$(sqlite3 $DB "select count(*) from Popups where Type=5 and Content like '%data-oy-wheel-disc%' and Content like '%conic-gradient%'") engine=$(curl -s $T/js/popup-engine.js | grep -c 'spinWheel')"
WID=$(sqlite3 $DB "select max(Id) from Popups where Type=5")
echo "WHEEL_EDIT=$(curl -s -b $J -o /tmp/oy_w.html -w '%{http_code}' $T/Popup/Wheel/$WID) rows=$(grep -o 'name="label[0-9]"' /tmp/oy_w.html | wc -l) stored=$(sqlite3 $DB "select count(*) from Popups where Id=$WID and json_extract(Content,'\$.wheel.Segments[0].Label') is not null") NOT_WHEEL=$(curl -s -b $J -o /dev/null -w '%{http_code}' $T/Popup/Wheel/4) UNAUTH=$(curl -s -o /dev/null -w '%{http_code}' $T/Popup/Wheel/$WID) BAD_ORIGIN=$(curl -s -b $J -o /dev/null -w '%{http_code}' -d heading=x $T/Popup/Wheel/$WID)"
wsave() { curl -s -b $J -o /dev/null -w '%{redirect_url}' -H "Origin: $T" "$@" $T/Popup/Wheel/$WID | sed 's/.*msg=//'; }
echo "WHEEL_SAVE_FEW=$(wsave -d heading=JPW -d label1=Only) WHEEL_SAVE=$(wsave --data-urlencode 'heading=JPW wheel' -d cta=Spin -d bg=%23ffffff -d button=%230F6B6B -d label1=JPW15 -d code1=JPWCODE15 -d chance1=3 -d label2=JPW5 -d code2=JPWCODE5 -d chance2=1) saved=$(sqlite3 $DB "select count(*) from Popups where Id=$WID and Content like '%JPWCODE15%' and Title='JPW wheel' and json_extract(Content,'\$.wheel.Segments[0].Probability')=3") segs=$(sqlite3 $DB "select json_array_length(json_extract(Content,'\$.wheel.Segments')) from Popups where Id=$WID") edit_link=$(curl -s -b $J $T/Popup/Edit/$WID | grep -c 'Edit wheel prizes') other_edit_link=$(curl -s -b $J $T/Popup/Edit/4 | grep -c 'Edit wheel prizes')"
rm -f /tmp/oy_w.html
CE=$(sqlite3 $DB "select max(Id) from Popups where Type=1"); CV=$(sqlite3 $DB "select max(Id) from Popups where Type=6"); CC=$(sqlite3 $DB "select max(Id) from Popups where Type=7")
csave() { I=$1; shift; curl -s -b $J -o /dev/null -w '%{redirect_url}' -H "Origin: $T" "$@" $T/Popup/Content/$I | sed 's/.*msg=//'; }
echo "CONTENT_PAGES=$(for I in $(sqlite3 $DB "select Id from Popups where Id>4 and Type<>5"); do curl -s -b $J -o /dev/null -w '%{http_code} ' $T/Popup/Content/$I; done) WHEEL_REDIRECT=$(curl -s -b $J -o /dev/null -w '%{redirect_url}' $T/Popup/Content/$WID | sed "s#$T##") CUSTOM=$(curl -s -b $J $T/Popup/Content/4 | grep -c 'not made from a template') UNAUTH=$(curl -s -o /dev/null -w '%{http_code}' $T/Popup/Content/$CE) BAD_ORIGIN=$(curl -s -b $J -o /dev/null -w '%{http_code}' -d Heading=x $T/Popup/Content/$CE)"
csave $CE --data-urlencode 'Heading=JPW new headline' --data-urlencode 'ButtonText=JPW go' --data-urlencode 'ImageUrl=https://example.com/jpw.jpg' -d CollectPhone=1 -d BackgroundColor=%23112233 -d ButtonColor=%23FF8A3D > /tmp/oy_cs.txt
echo "CONTENT_SAVE_EMAIL=$(cat /tmp/oy_cs.txt) title=$(sqlite3 $DB "select count(*) from Popups where Id=$CE and Title='JPW new headline'") image=$(sqlite3 $DB "select count(*) from Popups where Id=$CE and Content like '%example.com/jpw.jpg%'") phone=$(sqlite3 $DB "select count(*) from Popups where Id=$CE and Content like '%tel%'") bg=$(sqlite3 $DB "select count(*) from Popups where Id=$CE and Content like '%#112233%'") readable=$(sqlite3 $DB "select count(*) from Popups where Id=$CE and Content like '%color:#ffffff%'") setting=$(sqlite3 $DB "select json_extract(Content,'\$.settings.ButtonText') from Popups where Id=$CE")"
csave $CE --data-urlencode 'Heading=JPW' --data-urlencode 'ImageUrl=javascript:alert(1)' > /dev/null
echo "CONTENT_BAD_IMAGE_STORED=$(sqlite3 $DB "select count(*) from Popups where Id=$CE and Content like '%javascript:%'")"
echo "CONTENT_SAVE_VIDEO=$(csave $CV --data-urlencode 'VideoUrl=https://www.youtube.com/watch?v=dQw4w9WgXcQ' --data-urlencode 'Heading=JPW video') embed=$(sqlite3 $DB "select count(*) from Popups where Id=$CV and Content like '%youtube.com/embed/dQw4w9WgXcQ%'") CONTENT_SAVE_COUPON=$(csave $CC --data-urlencode 'Heading=JPW coupon' --data-urlencode 'CouponCode=JPWSAVE' -d RequireEmail=1) coupon=$(sqlite3 $DB "select count(*) from Popups where Id=$CC and Content like '%JPWSAVE%' and Content like '%data-success%'")"
EIDT=$(sqlite3 $DB "select max(Id) from Popups where Type=1")
tpost() { curl -s -b $J -o /dev/null -w '%{redirect_url}' -H "Origin: $T" "$@" $T/Popup/Test/$EIDT | sed 's/.*msg=//'; }
track() { curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d "$1" $T/api/ab/track; }
echo "AB_PAGE=$(curl -s -b $J -o /dev/null -w '%{http_code}' $T/Popup/Test/$EIDT) UNAUTH=$(curl -s -o /dev/null -w '%{http_code}' $T/Popup/Test/$EIDT) MISSING=$(curl -s -b $J -o /dev/null -w '%{http_code}' $T/Popup/Test/999999) BAD_ORIGIN=$(curl -s -b $J -o /dev/null -w '%{http_code}' -d do=start $T/Popup/Test/$EIDT) edit_link=$(curl -s -b $J $T/Popup/Edit/$EIDT | grep -c '/Popup/Test/')"
echo "AB_SAVE_SAME=$(tpost -d do=save) AB_SAVE=$(tpost -d do=save --data-urlencode 'heading=JPW headline B' --data-urlencode 'button=JPW button B') row=$(sqlite3 $DB "select count(*) from PopupTests where PopupId=$EIDT and TenantId=5 and Html like '%JPW headline B%' and Html like '%JPW button B%' and IsRunning=0")"
echo "AB_NOT_RUNNING: variants=$(curl -s "$T/api/ab/variants?tenantId=5" | grep -c 'JPW headline B') track=$(track "{\"popupId\":$EIDT,\"variant\":\"B\",\"event\":\"view\"}") counted=$(sqlite3 $DB "select ViewsB from PopupTests where PopupId=$EIDT")"
echo "AB_START=$(tpost -d do=start) variants=$(curl -s "$T/api/ab/variants?tenantId=5" | grep -c 'JPW headline B') other_tenant=$(curl -s "$T/api/ab/variants?tenantId=1" | grep -c 'JPW headline B') cors=$(curl -s -D - -o /dev/null "$T/api/ab/variants?tenantId=5" | grep -c -i 'access-control-allow-origin: \*')"
track "{\"popupId\":$EIDT,\"variant\":\"A\",\"event\":\"view\"}" >/dev/null; track "{\"popupId\":$EIDT,\"variant\":\"B\",\"event\":\"view\"}" >/dev/null; track "{\"popupId\":$EIDT,\"variant\":\"B\",\"event\":\"view\"}" >/dev/null; track "{\"popupId\":$EIDT,\"variant\":\"B\",\"event\":\"conversion\"}" >/dev/null
echo "AB_TRACK: counts=$(sqlite3 $DB "select ViewsA||'/'||ConversionsA||'/'||ViewsB||'/'||ConversionsB from PopupTests where PopupId=$EIDT") bad_variant=$(track "{\"popupId\":$EIDT,\"variant\":\"C\",\"event\":\"view\"}") bad_event=$(track "{\"popupId\":$EIDT,\"variant\":\"A\",\"event\":\"x\"}") bad_json=$(track 'nope') page_rate=$(curl -s -b $J $T/Popup/Test/$EIDT | grep -c '50.0%')"
echo "AB_USE_B=$(tpost -d do=useB) popup_has_b=$(sqlite3 $DB "select count(*) from Popups where Id=$EIDT and json_extract(Content,'\$.html') like '%JPW headline B%'") test_rows=$(sqlite3 $DB "select count(*) from PopupTests where PopupId=$EIDT") engine_ab=$(curl -s $T/js/popup-engine.js | grep -c 'pickVariant\|loadVariants\|abTrack')"
echo "SERVED=$(curl -s $T/Popup/GetTenantPopups/5 | grep -o "\"id\":$EID" | head -1) engine_success_hook=$(curl -s $T/js/popup-engine.js | grep -c 'data-success')"
echo "TENANT_COUNT=$(sqlite3 $DB 'select PopupCount from Tenants where Id=5') actual=$(sqlite3 $DB 'select count(*) from Popups where TenantId=5')"
sqlite3 $DB "update SubscriptionPlans set MaxPopups=3"
echo "USE_AT_LIMIT=$(use "$(sqlite3 $DB 'select Id from PopupTemplates where IsActive=1 and Type=1 limit 1')") limit_notice=$(curl -s -b $J "$T/Popup/SelectTemplate?msg=limit" | grep -c 'popup limit is reached')"
curl -s -o /tmp/oy_pub.html $T/Templates
echo "PUBLIC_TEMPLATES=$(curl -s -o /dev/null -w '%{http_code}' $T/Templates) cards=$(grep -o 'class="tpl"' /tmp/oy_pub.html | wc -l) previews=$(grep -o '<template>' /tmp/oy_pub.html | wc -l) dialog=$(grep -c 'dialog id="pv"' /tmp/oy_pub.html) noindex=$(grep -c 'noindex' /tmp/oy_pub.html) use_forms=$(grep -c 'UseTemplate' /tmp/oy_pub.html) signed_in_previews=$(grep -o '<template>' /tmp/oy_gal.html | wc -l) html_closed=$(grep -c '</html>' /tmp/oy_pub.html)"
echo "MENU_TEMPLATES: pricing_page=$(curl -s $T/Home/Pricing | grep -o 'href="/Templates"' | wc -l) login_page=$(curl -s $T/Account/Login | grep -o 'href="/Templates"' | wc -l) link=$(curl -s $T/Home/Pricing | grep -o '<a[^>]*href="/Templates"[^>]*>[^<]*' | head -1 | tr -s ' \n' ' ' | cut -c1-120)"
P=$(sqlite3 $DB 'select Id from PopupTemplates where IsActive=1 and Type=7 limit 1')
echo "START_NEW=$(curl -s -o /dev/null -D /tmp/oy_sh.txt -w '%{http_code} %{redirect_url}' "$T/Templates/Start?id=$P" | sed "s#$T##") cookie=$(grep -c -i 'set-cookie: oy_tpl=' /tmp/oy_sh.txt) START_HAVE=$(curl -s -o /dev/null -w '%{redirect_url}' "$T/Templates/Start?have=1&id=$P" | sed "s#$T##") START_BAD=$(curl -s -o /dev/null -w '%{redirect_url}' "$T/Templates/Start?id=abc" | sed "s#$T##")"
echo "AFTER_SIGNIN=$(curl -s -b $J -b "oy_tpl=$P" -o /dev/null -D /tmp/oy_sh.txt -w '%{http_code} %{redirect_url}' $T/ | sed "s#$T##") cookie_cleared=$(grep -c -i 'set-cookie: oy_tpl=;' /tmp/oy_sh.txt) SIGNED_OUT_WITH_COOKIE=$(curl -s -b "oy_tpl=$P" -o /dev/null -w '%{http_code}' $T/Home/Pricing) REGISTER_WITH_COOKIE=$(curl -s -b "oy_tpl=$P" -o /dev/null -w '%{http_code}' $T/Account/Register) PICK_PAGE=$(curl -s -b $J -o /dev/null -w '%{http_code}' "$T/Popup/SelectTemplate?pick=$P") start_links=$(grep -o 'href="/Templates/Start?id=' /tmp/oy_pub.html | wc -l)"
rm -f /tmp/oy_gal.html /tmp/oy_pub.html /tmp/oy_sh.txt
curl -s -b $J -o /tmp/oy_des.html $T/Popup/Designer/4
echo "DESIGNER: old_brand=$(grep -c '>PopupManager<' /tmp/oy_des.html) new_brand=$(grep -c 'brand-logo[^>]*>OptinYeti<' /tmp/oy_des.html) old_blue=$(grep -c -i '#2563eb\|#667eea' /tmp/oy_des.html) script_ok=$(grep -c 'PopupManager\|popup' /tmp/oy_des.html) MENU_EXTRA: templates=$(grep -o 'href="/Popup/SelectTemplate"' /tmp/oy_dash.html 2>/dev/null | wc -l) dash_now=$(curl -s -b $J $T/Popup | grep -o 'href="/Popup/SelectTemplate"\|href="/admin/Integrations"\|href="/admin/Leads"' | sort -u | wc -l)"
rm -f /tmp/oy_des.html
echo "ADDON_ERRORS=$(docker logs optinyeti-test 2>&1 | grep -c 'OptinYeti.Leads\]')"

docker rm -f optinyeti-test >/dev/null 2>&1
rm -rf $D $J /tmp/oy_dash.html /tmp/oy_l1.html /tmp/oy_l2.html /tmp/oy_h.txt
