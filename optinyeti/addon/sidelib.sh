# Shared helpers: start the image on a side port against a COPY of the database and sign in
# as a throwaway JPW user that sits in the owner's tenant (in the copy only).
T=http://127.0.0.1:3299
D=/tmp/oy_testdir
J=/tmp/oy_jar
DB=$D/PopupManager.db
U=jpw-test-user@example.com

side_start() {
  PW="Jpw-$(head -c 12 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')-9a!"
  docker rm -f optinyeti-test >/dev/null 2>&1
  rm -rf $D $J && mkdir -p $D
  sqlite3 "file:/srv/apps/optinyeti/PopupManager.db?mode=ro" ".backup $DB"
  docker run -d --name optinyeti-test -p 127.0.0.1:3299:80 -v $D:/data \
    -e "ConnectionStrings__DefaultConnection=Data Source=/data/PopupManager.db" \
    -e OPTINYETI_DB=/data/PopupManager.db "$1" >/dev/null
  sleep 8
  TK=$(side_token /Account/Register)
  curl -s -b $J -c $J -o /dev/null --data-urlencode "FirstName=JPW" --data-urlencode "LastName=Test" --data-urlencode "CompanyName=JPW Test Co" \
    --data-urlencode "Email=$U" --data-urlencode "Password=$PW" --data-urlencode "ConfirmPassword=$PW" \
    --data-urlencode "__RequestVerificationToken=$TK" $T/Account/Register
  sqlite3 $DB "update AspNetUsers set TenantId=5, Role=(select Role from AspNetUsers where TenantId=5 and Email not like 'jpw-%' limit 1) where Email='$U';"
  sqlite3 $DB "insert or ignore into AspNetUserRoles (UserId, RoleId) select (select Id from AspNetUsers where Email='$U'), RoleId from AspNetUserRoles where UserId=(select Id from AspNetUsers where TenantId=5 and Email not like 'jpw-%' limit 1);"
  TK=$(side_token /Account/Login)
  curl -s -b $J -c $J -o /dev/null --data-urlencode "Email=$U" --data-urlencode "Password=$PW" --data-urlencode "RememberMe=false" \
    --data-urlencode "__RequestVerificationToken=$TK" $T/Account/Login
}

side_token() { curl -s -b $J -c $J "$T$1" | grep -o '__RequestVerificationToken[^>]*' | grep -o 'value="[^"]*"' | head -1 | cut -d'"' -f2; }

side_stop() { docker rm -f optinyeti-test >/dev/null 2>&1; rm -rf $D $J; }
