#!/bin/sh
# Saves rendered copies of the signed-in app pages for visual review.
# Runs the image on a side port against a COPY of the database with a throwaway JPW user,
# and writes the pages to a randomly named folder under the static site. Pages that can show
# keys or account details (Settings, Subscription, Profile, Admin) are deliberately not saved. Remove with:
#   rm -rf /srv/apps/optinyeti-site/img/pv-*
IMG="${1:-optinyeti:leads-6}"
T=http://127.0.0.1:3299
D=/tmp/oy_testdir
J=/tmp/oy_jar
DB=$D/PopupManager.db
U=jpw-test-user@example.com
PW="Jpw-$(head -c 12 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')-9a!"
OUT=/srv/apps/optinyeti-site/img/pv-$(head -c 9 /dev/urandom | base64 | tr -dc 'a-z0-9' | cut -c1-10)

docker rm -f optinyeti-test >/dev/null 2>&1
rm -rf $D $J /srv/apps/optinyeti-site/img/pv-* && mkdir -p $D "$OUT"
sqlite3 "file:/srv/apps/optinyeti/PopupManager.db?mode=ro" ".backup $DB"
docker run -d --name optinyeti-test -p 127.0.0.1:3299:80 -v $D:/data \
  -e "ConnectionStrings__DefaultConnection=Data Source=/data/PopupManager.db" \
  -e OPTINYETI_DB=/data/PopupManager.db "$IMG" >/dev/null
sleep 8
token() { curl -s -b $J -c $J "$T$1" | grep -o '__RequestVerificationToken[^>]*' | grep -o 'value="[^"]*"' | head -1 | cut -d'"' -f2; }
TK=$(token /Account/Register)
curl -s -b $J -c $J -o /dev/null --data-urlencode "FirstName=JPW" --data-urlencode "LastName=Test" --data-urlencode "CompanyName=JPW Test Co" \
  --data-urlencode "Email=$U" --data-urlencode "Password=$PW" --data-urlencode "ConfirmPassword=$PW" \
  --data-urlencode "__RequestVerificationToken=$TK" $T/Account/Register
# Give the throwaway user the same tenant and role as the real owner, in the copy only.
sqlite3 $DB "update AspNetUsers set TenantId=5, Role=(select Role from AspNetUsers where TenantId=5 and Email not like 'jpw-%' limit 1) where Email='$U';"
sqlite3 $DB "insert or ignore into AspNetUserRoles (UserId, RoleId) select (select Id from AspNetUsers where Email='$U'), RoleId from AspNetUserRoles where UserId=(select Id from AspNetUsers where TenantId=5 and Email not like 'jpw-%' limit 1);"
TK=$(token /Account/Login)
curl -s -b $J -c $J -o /dev/null --data-urlencode "Email=$U" --data-urlencode "Password=$PW" --data-urlencode "RememberMe=false" \
  --data-urlencode "__RequestVerificationToken=$TK" $T/Account/Login

save() { CODE=$(curl -s -b $J -o "$OUT/$2.html" -w '%{http_code}' "$T$1"); echo "$1 -> $2.html ($CODE, $(wc -c < "$OUT/$2.html") bytes)"; }
save / dashboard
save /Popup popups
save /Popup/Create create
save /Popup/Edit/4 edit
save /Popup/Designer/4 designer
save /Popup/Preview/4 preview
save /admin/Templates templates
save /admin/Analytics analytics
save /admin/Support support
save /admin/Leads leads
save /admin/Integrations integrations
sqlite3 -json $DB 'select * from PopupTemplates' > "$OUT/templates.json"
sqlite3 -json $DB 'select Id, Name, Type, Status, Trigger, Frequency, Content from Popups' > "$OUT/popups.json"
grep -o -E 'href="/[A-Za-z][^"#]*"' "$OUT"/*.html | cut -d'"' -f2 | sort | uniq -c | sort -rn | head -40 > "$OUT/links.txt"
chmod -R a+rX "$OUT"
docker rm -f optinyeti-test >/dev/null 2>&1
rm -rf $D $J
echo "PREVIEW_DIR=$(basename "$OUT")"
