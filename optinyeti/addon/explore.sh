#!/bin/sh
# Read-only exploration of how popups are stored and created (runs against a DB copy).
. "$(dirname "$0")/sidelib.sh"
P="file:/srv/apps/optinyeti/PopupManager.db?mode=ro"
echo "--- Popups schema"
sqlite3 "$P" ".schema Popups" | tr '\n' ' ' | fold -w 250
echo
echo "--- popup rows (no content)"
sqlite3 -header "$P" "select Id, Name, Type, Status, Trigger, DelayMs, Frequency, ShowOnMobile, ShowOnDesktop, TenantId, length(Content) clen, substr(Content,1,60) chead, TargetingRules from Popups;"
echo "--- tenant 5 counters"
sqlite3 -header "$P" "select Id, PopupCount, MonthlyPopupViews, SubscriptionPlanId from Tenants where Id=5;"
sqlite3 -header "$P" "select * from SubscriptionPlans;" | cut -c1-200
side_start "${1:-optinyeti:leads-7}"
echo "--- GetTenantPopups/5 (first 400 chars)"
curl -s "$T/Popup/GetTenantPopups/5" | cut -c1-400
echo
echo "--- POST CreateFromTemplate variants"
TK=$(side_token /Popup/Create)
for body in "templateId=12" "id=12" "TemplateId=12&Name=JPW+Test+From+Template"; do
  echo "$body -> $(curl -s -b $J -o /dev/null -w '%{http_code} %{redirect_url}' -d "$body" --data-urlencode "__RequestVerificationToken=$TK" $T/Popup/CreateFromTemplate)"
done
echo "popups after: $(sqlite3 $DB 'select count(*) from Popups')"
sqlite3 $DB "select Id, Name, Type, Status, length(Content), substr(Content,1,200) from Popups where Id > 4;"
echo "--- Designer with name/type (what the stock chooser links to)"
curl -s -b $J -o /tmp/oy_des.html -w 'status=%{http_code}\n' "$T/Popup/Designer?name=Newsletter&type=0"
grep -o -E '<title>[^<]*' /tmp/oy_des.html
grep -o -E "(fetch|\\\$\\.(post|ajax))\\([^)]{0,120}" /tmp/oy_des.html | head -6
grep -o -E "url: *['\"][^'\"]*" /tmp/oy_des.html | head -6
side_stop
rm -f /tmp/oy_des.html
