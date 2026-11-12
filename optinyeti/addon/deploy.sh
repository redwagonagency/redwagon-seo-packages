#!/bin/sh
# Switches production OptinYeti to the given image. Keeps the old container (stopped) as
# "optinyeti-old" and rolls back automatically if the new one fails its health check.
# The database directory is mounted (not just the file) so SQLite's WAL lives on the host.
set -u
IMG="${1:-optinyeti:leads-1}"
DATA=/srv/apps/optinyeti
BACKUPS=/srv/apps/optinyeti-backups
URL=http://127.0.0.1:3201

docker image inspect "$IMG" >/dev/null 2>&1 || { echo "ABORT: image $IMG not found"; exit 1; }
docker inspect optinyeti-old >/dev/null 2>&1 && { echo "ABORT: optinyeti-old already exists; remove it first"; exit 1; }

mkdir -p "$BACKUPS"
docker stop optinyeti >/dev/null || { echo "ABORT: could not stop optinyeti"; exit 1; }

if [ -s "$DATA/PopupManager.db-wal" ]; then
  echo "ABORT: non-empty WAL on host; restarting old container"; docker start optinyeti >/dev/null; exit 1
fi
STAMP=$(date +%Y%m%d-%H%M%S)
cp "$DATA/PopupManager.db" "$BACKUPS/PopupManager.db.$STAMP" || { docker start optinyeti >/dev/null; echo "ABORT: backup failed"; exit 1; }
rm -f "$DATA/PopupManager.db-wal" "$DATA/PopupManager.db-shm"
echo "BACKUP=$BACKUPS/PopupManager.db.$STAMP INTEGRITY=$(sqlite3 "$BACKUPS/PopupManager.db.$STAMP" 'pragma integrity_check')"

docker rename optinyeti optinyeti-old
docker run -d --name optinyeti --restart unless-stopped -p 127.0.0.1:3201:80 \
  -v "$DATA:/data" \
  -e "ConnectionStrings__DefaultConnection=Data Source=/data/PopupManager.db" \
  -e OPTINYETI_DB=/data/PopupManager.db \
  "$IMG" >/dev/null

OK=0
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  sleep 3
  LOGIN=$(curl -s -o /dev/null -w '%{http_code}' $URL/Account/Login)
  CAP=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' $URL/api/leads/capture)
  if [ "$LOGIN" = "200" ] && [ "$CAP" = "400" ]; then OK=1; break; fi
done

if [ "$OK" = "1" ]; then
  echo "DEPLOYED $IMG (login=$LOGIN capture=$CAP). Old container kept stopped as optinyeti-old."
else
  echo "HEALTH CHECK FAILED (login=$LOGIN capture=$CAP) - rolling back"
  docker logs optinyeti 2>&1 | tail -15
  docker rm -f optinyeti >/dev/null
  docker rename optinyeti-old optinyeti
  docker start optinyeti >/dev/null
  echo "ROLLED BACK to previous container"
  exit 1
fi
