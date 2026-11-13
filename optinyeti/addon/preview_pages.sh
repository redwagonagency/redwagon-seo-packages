#!/bin/sh
# Saves the wheel prize editor and an A/B test page (with sample JPW numbers) from a side-port
# container on a database COPY, for visual review. Remove after viewing:
#   rm -rf /srv/apps/optinyeti-site/img/pv-*
. /srv/apps/optinyeti-addon/sidelib.sh
side_start "$1"
R=pv-$(head -c 9 /dev/urandom | base64 | tr -dc 'a-z0-9' | cut -c1-8)
O=/srv/apps/optinyeti-site/img/$R
rm -rf /srv/apps/optinyeti-site/img/pv-* && mkdir -p $O
sqlite3 $DB "update SubscriptionPlans set MaxPopups=100"
use() { curl -s -b $J -o /dev/null -H "Origin: $T" -d "id=$1" $T/Popup/UseTemplate; }
use "$(sqlite3 $DB 'select min(Id) from PopupTemplates where IsActive=1 and Type=5')"
use "$(sqlite3 $DB 'select min(Id) from PopupTemplates where IsActive=1 and Type=1')"
W=$(sqlite3 $DB 'select max(Id) from Popups where Type=5')
E=$(sqlite3 $DB 'select max(Id) from Popups where Type=1')
curl -s -b $J -o /dev/null -H "Origin: $T" -d do=save --data-urlencode 'heading=JPW: Get 10% off your first order' --data-urlencode 'button=JPW: Send my code' $T/Popup/Test/$E
curl -s -b $J -o /dev/null -H "Origin: $T" -d do=start $T/Popup/Test/$E
sqlite3 $DB "update PopupTests set ViewsA=412, ConversionsA=21, ViewsB=398, ConversionsB=39 where PopupId=$E"
curl -s -b $J -o $O/wheel.html $T/Popup/Wheel/$W
curl -s -b $J -o $O/test.html $T/Popup/Test/$E
curl -s -b $J -o $O/edit.html $T/Popup/Edit/$W
curl -s -b $J -o /dev/null -H "Origin: $T" --data-urlencode 'Heading=JPW: Grab the spring lookbook' --data-urlencode 'SubHeading=Fresh looks, first access, zero spam.' --data-urlencode 'ButtonText=Send it over' --data-urlencode 'ImageUrl=https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=70' -d CollectName=1 -d BackgroundColor=%23FFF7ED -d ButtonColor=%230F6B6B $T/Popup/Content/$E
curl -s -b $J -o $O/content.html $T/Popup/Content/$E
chmod -R a+rX $O
side_stop
echo "PREVIEW_DIR=$R $(wc -c < $O/wheel.html) $(wc -c < $O/test.html) $(wc -c < $O/edit.html)"
