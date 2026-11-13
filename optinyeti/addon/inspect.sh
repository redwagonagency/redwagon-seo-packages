#!/bin/sh
# Read-only look at leftover old-brand settings and data. Prints no secret values.
D='file:/srv/apps/optinyeti/PopupManager.db?mode=ro'
echo "--- appsettings (secret-looking lines hidden)"
docker exec optinyeti sh -c 'cat /app/appsettings.json' | grep -v -i -E 'password|secret|apikey|api_key|"key|token' | cut -c1-110 | sed -n '1,48p'
echo "--- users on old-brand domains"
sqlite3 "$D" "select count(*) from AspNetUsers where Email like '%popupmanager%' or Email like '%popupx%';"
echo "--- users by role/active"
sqlite3 "$D" "select Role, IsActive, count(*) from AspNetUsers group by 1,2;"
echo "--- blog columns"
sqlite3 "$D" "select group_concat(name,' ') from pragma_table_info('BlogPosts');"
echo "--- blog rows with old names"
sqlite3 "$D" "select Id, Slug, Title from BlogPosts where Title like '%Popup Manager%' or Content like '%Popup Manager%' or Content like '%PopupX%' or Slug like '%popup-manager%';"
echo "--- templates/popups with old names"
sqlite3 "$D" "select 'templates', count(*) from PopupTemplates where Name like '%Popup Manager%' or Content like '%Popup Manager%' or Content like '%PopupX%' or Content like '%popupmanager%';"
sqlite3 "$D" "select 'tenants', Id, Name, Domain from Tenants where Name like '%Popup%' or Domain like '%popup%';"
echo "--- seo files mentioning old slug"
grep -c 'popup-manager' /var/www/_seo/optinyeti.com/* 2>/dev/null
