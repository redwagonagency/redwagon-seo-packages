#!/bin/sh
# Read-only exploration of how popups are created from templates and how they are stored.
. "$(dirname "$0")/sidelib.sh"
S=/tmp/oy_app_strings.txt
echo "--- controller actions"
for c in PopupController PopupApiController TrackingController AnalyticsController PopupAnalyticsApiController; do
  echo "$c: $(grep -o -E "$c\+<[A-Za-z]+>" $S | sed 's/.*<//;s/>//' | sort -u | tr '\n' ' ')"
done
echo "--- Popups columns"
sqlite3 "file:/srv/apps/optinyeti/PopupManager.db?mode=ro" "select group_concat(name || ':' || type, ' ') from pragma_table_info('Popups');"
side_start "${1:-optinyeti:leads-7}"
echo "--- SelectTemplate page"
curl -s -b $J -o /tmp/oy_sel.html -w 'status=%{http_code}\n' "$T/Popup/SelectTemplate"
grep -o -E 'href="[^"]*"' /tmp/oy_sel.html | grep -i -E 'popup|template' | sort | uniq -c | sort -rn | head -12
grep -o -E '<form[^>]*>' /tmp/oy_sel.html | head -5
grep -o -E 'onclick="[^"]{0,120}' /tmp/oy_sel.html | sort | uniq -c | sort -rn | head -5
grep -o -E '(fetch|\$\.(post|ajax|get))\([^)]{0,140}' /tmp/oy_sel.html | head -8
echo "--- SelectTemplate?type=EmailCollector"
curl -s -b $J -o /tmp/oy_sel2.html -w 'status=%{http_code}\n' "$T/Popup/SelectTemplate?type=EmailCollector"
grep -c 'Exit-Intent Lead Magnet' /tmp/oy_sel2.html
grep -o -E 'href="[^"]*"' /tmp/oy_sel2.html | grep -i -E 'template|Create' | sort | uniq -c | sort -rn | head -8
grep -o -E '<form[^>]*>' /tmp/oy_sel2.html | head -5
grep -o -E 'name="[A-Za-z_.]+"' /tmp/oy_sel2.html | sort -u | tr '\n' ' '
echo
echo "--- Create page forms"
curl -s -b $J -o /tmp/oy_cr.html "$T/Popup/Create"
grep -o -E '<form[^>]*>' /tmp/oy_cr.html | head -3
grep -o -E 'href="/Popup/[^"]*"' /tmp/oy_cr.html | sort -u | head -12
side_stop
rm -f /tmp/oy_sel.html /tmp/oy_sel2.html /tmp/oy_cr.html
