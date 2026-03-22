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
REPO_URL = "https://github.com/redwagonagency/redwagon-seo-packages.git"

ENV_CONTENT = textwrap.dedent(f"""\
    DATABASE_URL="file:{APP_DIR}/data/prod.db"
    AUTH_URL="http://{HOST}"
    NEXTAUTH_URL="http://{HOST}"
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

NGINX_CONFIG = textwrap.dedent("""\
    server {
        listen 80 default_server;
        server_name _;
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
print(f"Connecting to {USER}@{HOST}:22 ...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(
        HOST, 22,
        username=USER,
        password=PASSWORD,
        allow_agent=False,
        look_for_keys=False,
        timeout=30,
        auth_timeout=30,
        banner_timeout=30,
    )
    print("Connected!")
except Exception as e:
    print(f"Connection failed: {e}", file=sys.stderr)
    sys.exit(1)

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

# ── Enable nginx site ─────────────────────────────────────────────────────────
run(client, """
ln -sf /etc/nginx/sites-available/searchauditpro /etc/nginx/sites-enabled/searchauditpro
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx && echo "nginx OK"
""", "Configuring nginx")

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

# ── Done ──────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print(f"  Deployment complete!")
print(f"  App live at: http://{HOST}")
print("=" * 60)
client.close()
