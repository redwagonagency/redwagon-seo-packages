#!/bin/sh
# Renders one popup per template type on a side port (database COPY) and saves a static
# preview page plus the gallery page into a random folder under the public /img/ path.
# Delete the folder after viewing: rm -rf /srv/apps/optinyeti-site/img/pv-*
. /srv/apps/optinyeti-addon/sidelib.sh
side_start "$1"
R=pv-$(head -c 6 /dev/urandom | base64 | tr -dc 'a-z0-9' | cut -c1-6)
O=/srv/apps/optinyeti-site/img/$R
mkdir -p $O
curl -s -b $J -o $O/gallery.html $T/Popup/SelectTemplate
sqlite3 $DB "update SubscriptionPlans set MaxPopups=100"
START=$(sqlite3 $DB 'select max(Id) from Popups')
for TID in $(sqlite3 $DB "select min(Id) from PopupTemplates where IsActive=1 and Type<>5 group by Type; select max(Id) from PopupTemplates where IsActive=1 and Type in (1,2,7) group by Type"); do
  curl -s -b $J -o /dev/null -H "Origin: $T" -d "id=$TID" $T/Popup/UseTemplate
done
{
  echo '<!doctype html><meta charset="utf-8"><title>Template preview</title><body style="margin:0;padding:30px;background:#5b6b70;font-family:sans-serif">'
  sqlite3 $DB "select '<p style=\"color:#fff;margin:26px 0 8px\">' || Name || ' (type ' || Type || ')</p><div style=\"background:#fff;border-radius:12px;padding:40px;max-width:500px;position:relative\">' || json_extract(Content,'\$.html') || '</div>' from Popups where Id > $START order by Id"
  echo '</body>'
} > $O/popups.html
echo "CONTAINER_STYLE=$(curl -s $T/js/popup-engine.js | grep -n -o 'padding: *[0-9]*px[^;]*;[^\\n]\{0,80\}' | head -5 | tr '\n' '|')"
echo "MADE=$(sqlite3 $DB "select count(*) from Popups where Id > $START")"
echo "VIEW=https://optinyeti.com/img/$R/gallery.html and /popups.html"
side_stop
