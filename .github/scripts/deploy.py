#!/usr/bin/env python3
"""
Deploy searchauditpro to VPS via SSH using Paramiko.
Supports password and keyboard-interactive authentication.
"""
import os, sys, time, textwrap
import paramiko

# ── Config ────────────────────────────────────────────────────────────────────
HOST     = os.environ["SERVER_HOST"]
USER     = os.environ["SERVER_USER"]
PASSWORD = os.environ["SERVER_PASSWORD"]
APP_DIR  = "/root/searchauditpro"
APP2_DIR = "/root/unboundkeyword"
REPO_URL = "https://github.com/redwagonagency/redwagon-seo-packages.git"

DOMAIN = "searchauditpro.com"
EMAIL  = "joe@redwagon.agency"

ENV_CONTENT = textwrap.dedent(f"""\
    DATABASE_URL="file:{APP_DIR}/data/prod.db"
    AUTH_URL="https://{DOMAIN}"
    NEXTAUTH_URL="https://{DOMAIN}"
    NEXTAUTH_SECRET="{os.environ['NEXTAUTH_SECRET']}"
    AUTH_SECRET="{os.environ['NEXTAUTH_SECRET']}"
    GOOGLE_CLIENT_ID="{os.environ['GOOGLE_CLIENT_ID']}"
    GOOGLE_CLIENT_SECRET="{os.environ['GOOGLE_CLIENT_SECRET']}"
    GSC_CLIENT_ID="{os.environ['GOOGLE_CLIENT_ID']}"
    GSC_CLIENT_SECRET="{os.environ['GOOGLE_CLIENT_SECRET']}"
    GA4_CLIENT_ID="{os.environ['GOOGLE_CLIENT_ID']}"
    GA4_CLIENT_SECRET="{os.environ['GOOGLE_CLIENT_SECRET']}"
    DATAFORSEO_LOGIN="{os.environ['DATAFORSEO_LOGIN']}"
    DATAFORSEO_PASSWORD="{os.environ['DATAFORSEO_PASSWORD']}"
    SERPAPI_KEY="{os.environ.get('SERPAPI_KEY', '')}"
    SUPERADMIN_EMAIL="{os.environ['SUPERADMIN_EMAIL']}"
    SUPERADMIN_PASSWORD="{os.environ['SUPERADMIN_PASSWORD']}"
""")

# HTTP-only config used initially so certbot can complete HTTP-01 challenge
NGINX_CONFIG_HTTP = textwrap.dedent("""\
    server {
        listen 80;
        server_name searchauditpro.com;
        client_max_body_size 50M;
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 120s;
        }
    }
""")

# Full config with SSL + HTTP redirect (written after cert is obtained)
NGINX_CONFIG = textwrap.dedent("""\
    server {
        listen 80;
        server_name searchauditpro.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name searchauditpro.com;

        ssl_certificate     /etc/letsencrypt/live/searchauditpro.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/searchauditpro.com/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache   shared:SSL:10m;
        ssl_session_timeout 1d;
        add_header Strict-Transport-Security "max-age=63072000" always;

        client_max_body_size 50M;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 120s;
        }
    }
""")

# ── SSH helpers ───────────────────────────────────────────────────────────────
def run(client, cmd, desc="", timeout=600):
    if desc:
        print(f"\n{'='*60}\n>>> {desc}\n{'='*60}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    # Stream stdout
    for line in iter(stdout.readline, ""):
        print(line, end="")
        sys.stdout.flush()
    # Print stderr
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        print(err, file=sys.stderr)
    rc = stdout.channel.recv_exit_status()
    if rc != 0:
        print(f"\nERROR: exit code {rc}", file=sys.stderr)
        sys.exit(rc)

def sftp_write(client, remote_path, content):
    sftp = client.open_sftp()
    # Ensure parent directory exists
    parent = remote_path.rsplit("/", 1)[0]
    try:
        sftp.stat(parent)
    except FileNotFoundError:
        # mkdir -p equivalent
        parts = parent.split("/")
        path = ""
        for part in parts:
            if not part:
                continue
            path += "/" + part
            try:
                sftp.stat(path)
            except FileNotFoundError:
                sftp.mkdir(path)
    with sftp.open(remote_path, "w") as f:
        f.write(content)
    sftp.close()
    print(f"  Wrote {remote_path}")

# ── Connect ───────────────────────────────────────────────────────────────────
print(f"\nConnecting to {USER}@{HOST}:22 ...")

# First: probe what auth methods the server supports
transport = paramiko.Transport((HOST, 22))
transport.start_client(timeout=30)
try:
    transport.auth_none(USER)
except paramiko.BadAuthenticationType as e:
    allowed = e.allowed_types
    print(f"Server supported auth methods: {allowed}")
except Exception as e:
    print(f"Probe failed: {e} — continuing anyway")
    allowed = ["password", "keyboard-interactive"]

# Try keyboard-interactive auth explicitly
def ki_handler(title, instructions, prompts):
    print(f"  KI challenge: {repr(title)}, prompts={len(prompts)}")
    return [PASSWORD for _ in prompts]

connected = False

# Method 1: keyboard-interactive
if not connected and "keyboard-interactive" in allowed:
    try:
        if transport.is_authenticated():
            transport.close()
            transport = paramiko.Transport((HOST, 22))
            transport.start_client(timeout=30)
        transport.auth_interactive(USER, ki_handler)
        print("Connected via keyboard-interactive!")
        connected = True
    except paramiko.AuthenticationException as e:
        print(f"keyboard-interactive failed: {e}")
        transport.close()

# Method 2: password
if not connected and "password" in allowed:
    try:
        transport = paramiko.Transport((HOST, 22))
        transport.start_client(timeout=30)
        transport.auth_password(USER, PASSWORD)
        print("Connected via password!")
        connected = True
    except paramiko.AuthenticationException as e:
        print(f"password auth failed: {e}")
        transport.close()

# Method 3: fallback with paramiko SSHClient (tries all methods)
if not connected:
    try:
        transport = paramiko.Transport((HOST, 22))
        transport.start_client(timeout=30)
        transport.auth_interactive_dumb(USER, handler=ki_handler)
        print("Connected via interactive-dumb!")
        connected = True
    except Exception as e:
        print(f"interactive-dumb failed: {e}")
        transport.close()

if not connected:
    print(f"\nERROR: Could not authenticate to {USER}@{HOST}", file=sys.stderr)
    print("Please verify:", file=sys.stderr)
    print("  1. SSH password is correct in SERVER_PASSWORD secret", file=sys.stderr)
    print("  2. PasswordAuthentication or KbdInteractiveAuthentication is enabled on server", file=sys.stderr)
    sys.exit(1)

# Attach transport to SSHClient
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client._transport = transport
print("SSH session established!")

# ── Bootstrap: install Node 20, PM2, git, nginx ───────────────────────────────
run(client, r"""
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y git curl

# Node.js 20
if ! command -v node &>/dev/null || [ "$(node -v 2>/dev/null | cut -d. -f1 | tr -d 'v')" -lt "20" ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node $(node -v), npm $(npm -v)"

# PM2
command -v pm2 &>/dev/null || npm install -g pm2

# nginx
command -v nginx &>/dev/null || apt-get install -y nginx

echo "Bootstrap OK"
""", "Bootstrapping server prerequisites")

# ── Clone or pull ─────────────────────────────────────────────────────────────
run(client, f"""
if [ -d "{APP_DIR}/.git" ]; then
  echo "Pulling latest..."
  cd "{APP_DIR}"
  git fetch origin main
  git reset --hard origin/main
else
  echo "Cloning repo..."
  git clone {REPO_URL} "{APP_DIR}"
fi
""", "Clone / pull latest code")

# ── Write config files via SFTP ───────────────────────────────────────────────
print("\n>>> Writing config files via SFTP")
sftp_write(client, f"{APP_DIR}/.env.production", ENV_CONTENT)
sftp_write(client, "/etc/nginx/sites-available/searchauditpro", NGINX_CONFIG)

# Write unboundkeyword env only if it doesn't already exist
run(client, f"""
if [ ! -f "{APP2_DIR}/.env.production" ]; then
  mkdir -p {APP2_DIR}
  cat > {APP2_DIR}/.env.production << 'ENVEOF'
DATABASE_URL="file:{APP2_DIR}/data/prod.db"
NEXTAUTH_SECRET="ubk-prod-secret-2025-xK9mPq3wL7vN5rTy"
NEXTAUTH_URL="https://unboundkeyword.com"
AUTH_URL="https://unboundkeyword.com"
AUTH_SECRET="ubk-prod-secret-2025-xK9mPq3wL7vN5rTy"
GOOGLE_CLIENT_ID="{os.environ['GOOGLE_CLIENT_ID']}"
GOOGLE_CLIENT_SECRET="{os.environ['GOOGLE_CLIENT_SECRET']}"
DATAFORSEO_LOGIN="{os.environ['DATAFORSEO_LOGIN']}"
DATAFORSEO_PASSWORD="{os.environ['DATAFORSEO_PASSWORD']}"
ENVEOF
  echo "unboundkeyword env written"
else
  echo "unboundkeyword env already exists, keeping"
fi
""", "Writing unboundkeyword env file")

# ── Enable nginx site (HTTP first, for certbot challenge) ─────────────────────
sftp_write(client, "/etc/nginx/sites-available/searchauditpro", NGINX_CONFIG_HTTP)
run(client, """
ln -sf /etc/nginx/sites-available/searchauditpro /etc/nginx/sites-enabled/searchauditpro
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx && echo "nginx HTTP OK"
""", "Configuring nginx (HTTP for certbot)")

# ── SSL via Let's Encrypt ──────────────────────────────────────────────────────
run(client, f"""
export DEBIAN_FRONTEND=noninteractive
apt-get install -y -q certbot python3-certbot-nginx 2>&1 | tail -3
certbot certonly --nginx \\
  -d searchauditpro.com \\
  --non-interactive --agree-tos --email {EMAIL} \\
  --keep-until-expiring 2>&1 | tail -20 || echo "certbot failed or cert already valid"
echo "Certbot exit: $?"

if [ -f "/etc/letsencrypt/live/searchauditpro.com/fullchain.pem" ]; then
  echo "Cert obtained - writing SSL nginx config..."
fi
""", "Obtaining SSL certificate via Let's Encrypt")

# Conditionally write SSL nginx config
run(client, f"""
if [ -f "/etc/letsencrypt/live/searchauditpro.com/fullchain.pem" ]; then
  cat > /etc/nginx/sites-available/searchauditpro << 'NGINX_EOF'
{NGINX_CONFIG}NGINX_EOF
  echo "SSL nginx config written"
fi
nginx -t && systemctl reload nginx && echo "nginx OK"
""", "Activating nginx config")

# ── Install dependencies ──────────────────────────────────────────────────────
run(client, f"cd {APP_DIR} && npm ci", "Installing npm dependencies", timeout=300)

# ── Prisma setup ─────────────────────────────────────────────────────────────
run(client, f"""
mkdir -p {APP_DIR}/data
cd {APP_DIR}
DATABASE_URL="file:{APP_DIR}/data/prod.db" npx prisma db push --accept-data-loss
DATABASE_URL="file:{APP_DIR}/data/prod.db" npx prisma generate
echo "Prisma OK"
""", "Prisma DB setup", timeout=120)

# ── Seed superadmin ───────────────────────────────────────────────────────────
run(client, f"""
cd {APP_DIR}
DATABASE_URL="file:{APP_DIR}/data/prod.db" npx tsx prisma/seed.ts && echo "Seed OK" || echo "Seed skipped (may already exist)"
""", "Seeding superadmin user", timeout=60)

# ── Build Next.js ─────────────────────────────────────────────────────────────
run(client, f"cd {APP_DIR} && NODE_ENV=production npm run build", "Building Next.js app", timeout=900)

# ── Start / restart PM2 ───────────────────────────────────────────────────────
run(client, f"""
cd {APP_DIR}
if pm2 describe searchauditpro > /dev/null 2>&1; then
  pm2 reload searchauditpro --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
echo "PM2 OK"
""", "Starting app with PM2")

# ── Deploy unboundkeyword app ─────────────────────────────────────────────────
run(client, f"""
echo "Syncing unboundkeyword from git repo..."
git clone --depth 1 --filter=blob:none --no-checkout {REPO_URL} /tmp/ub-repo 2>/dev/null || (cd /tmp/ub-repo && git fetch --depth 1 origin main && git checkout FETCH_HEAD)
cd /tmp/ub-repo
git sparse-checkout init --cone
git sparse-checkout set unboundkeyword
git checkout HEAD -- unboundkeyword 2>/dev/null || git read-tree --prefix=unboundkeyword -u HEAD:unboundkeyword 2>/dev/null || true

rsync -av --delete \\
  --exclude=node_modules \\
  --exclude=.next \\
  --exclude=/data \\
  --exclude=.env.production \\
  --exclude=tsconfig.tsbuildinfo \\
  /tmp/ub-repo/unboundkeyword/ {APP2_DIR}/

rm -rf /tmp/ub-repo
echo "Sync complete"
""", "Syncing unboundkeyword source code", timeout=120)

run(client, f"cd {APP2_DIR} && npm ci --prefer-offline 2>&1 | tail -5 && echo 'npm OK'", "Installing unboundkeyword dependencies", timeout=300)

run(client, f"""
mkdir -p {APP2_DIR}/data
cd {APP2_DIR}
DATABASE_URL="file:{APP2_DIR}/data/prod.db" npx prisma db push --accept-data-loss
DATABASE_URL="file:{APP2_DIR}/data/prod.db" npx prisma generate
echo "Prisma OK"
""", "Prisma setup for unboundkeyword", timeout=120)

run(client, f"cd {APP2_DIR} && NODE_ENV=production npm run build", "Building unboundkeyword Next.js app", timeout=900)

run(client, f"""
cd {APP2_DIR}
if pm2 describe unboundkeyword > /dev/null 2>&1; then
  pm2 reload unboundkeyword --update-env
else
  pm2 start ecosystem.config.js --only unboundkeyword 2>/dev/null || pm2 start npm --name unboundkeyword -- start -- -p 3001
fi
pm2 save
echo "PM2 unboundkeyword OK"
""", "Restarting unboundkeyword with PM2")

# ── Done ──────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print(f"  Deployment complete!")
print(f"  searchauditpro → https://searchauditpro.com")
print(f"  unboundkeyword → https://unboundkeyword.com")
print("=" * 60)
client.close()
