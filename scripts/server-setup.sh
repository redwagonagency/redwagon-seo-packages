#!/bin/bash
# =============================================================
# SearchAudit Pro — Server Bootstrap Script
# Run this ONCE on a fresh Ubuntu server as root:
#   bash scripts/server-setup.sh
# =============================================================
set -e

APP_DIR="/root/searchauditpro"
REPO_URL="https://github.com/redwagonagency/redwagon-seo-packages.git"
NODE_VERSION="20"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   SearchAudit Pro — Server Bootstrap         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. System packages ──────────────────────────────────────
echo ">>> [1/8] Installing system packages..."
apt-get update -qq
apt-get install -y git curl nginx ufw 2>/dev/null

# ── 2. Node.js via NodeSource ───────────────────────────────
echo ">>> [2/8] Installing Node.js $NODE_VERSION..."
if ! command -v node &>/dev/null || [[ "$(node -v)" != v${NODE_VERSION}* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
fi
echo "    Node: $(node -v)  npm: $(npm -v)"

# ── 3. PM2 ──────────────────────────────────────────────────
echo ">>> [3/8] Installing PM2..."
npm install -g pm2@latest
pm2 startup systemd -u root --hp /root | bash 2>/dev/null || true

# ── 4. Clone repo ────────────────────────────────────────────
echo ">>> [4/8] Cloning application..."
if [ -d "$APP_DIR/.git" ]; then
  echo "    Repo already cloned — pulling latest..."
  cd "$APP_DIR" && git fetch origin main && git reset --hard origin/main
else
  git clone "$REPO_URL" "$APP_DIR"
fi

# ── 5. Write production .env ─────────────────────────────────
echo ">>> [5/8] Writing .env.production..."
mkdir -p "$APP_DIR/data" "$APP_DIR/logs"

cat > "$APP_DIR/.env.production" << 'EOF'
# ─── EDIT THESE VALUES BEFORE RUNNING ───────────────────────
DATABASE_URL="file:/root/searchauditpro/data/prod.db"

# ⚠  Change to your real domain once DNS is pointed at this server
AUTH_URL="http://187.124.238.244"
NEXTAUTH_URL="http://187.124.238.244"

NEXTAUTH_SECRET="CHANGE_ME_USE_A_LONG_RANDOM_STRING"
AUTH_SECRET="CHANGE_ME_USE_A_LONG_RANDOM_STRING"

GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

GSC_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GSC_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

GA4_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GA4_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

DATAFORSEO_LOGIN="YOUR_DATAFORSEO_EMAIL"
DATAFORSEO_PASSWORD="YOUR_DATAFORSEO_PASSWORD"

SERPAPI_KEY=""

SUPERADMIN_EMAIL="admin@searchauditpro.com"
SUPERADMIN_PASSWORD="CHANGE_ME_STRONG_PASSWORD"
EOF

echo "    ⚠  Review and update $APP_DIR/.env.production before going live!"

# ── 6. Install deps + migrate + build ────────────────────────
echo ">>> [6/8] Installing dependencies..."
cd "$APP_DIR"
npm ci

echo ">>> Running Prisma migrations..."
DATABASE_URL="file:/root/searchauditpro/data/prod.db" npx prisma migrate deploy
DATABASE_URL="file:/root/searchauditpro/data/prod.db" npx prisma generate

echo ">>> Building Next.js (this takes ~2-4 minutes)..."
NODE_ENV=production npm run build

# ── 7. PM2 start ─────────────────────────────────────────────
echo ">>> [7/8] Starting app with PM2..."
cd "$APP_DIR"
pm2 delete searchauditpro 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# ── 8. Nginx reverse-proxy ────────────────────────────────────
echo ">>> [8/8] Configuring nginx..."
cat > /etc/nginx/sites-available/searchauditpro << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/searchauditpro /etc/nginx/sites-enabled/searchauditpro
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── Firewall ──────────────────────────────────────────────────
ufw allow 22   2>/dev/null || true
ufw allow 80   2>/dev/null || true
ufw allow 443  2>/dev/null || true
# ufw --force enable  # uncomment once you've confirmed SSH works

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Bootstrap complete! ✓                      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  App URL:   http://187.124.238.244"
echo "  PM2 logs:  pm2 logs searchauditpro"
echo "  PM2 list:  pm2 list"
echo ""
echo "  Next steps:"
echo "  1. Update NEXTAUTH_SECRET in $APP_DIR/.env.production"
echo "  2. Add http://187.124.238.244/api/auth/callback/google"
echo "     to your Google Cloud Console authorized redirect URIs"
echo "  3. Set GitHub Secrets (see README.deploy.md) for auto-deploy"
echo ""
