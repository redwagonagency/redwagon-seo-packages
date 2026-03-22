#!/usr/bin/env python3
"""
Deploy unboundkeyword.com to VPS.
Uploads source from $GITHUB_WORKSPACE/unboundkeyword/ via SFTP tarball.
"""
import os, sys, tarfile, io, textwrap
import paramiko

# ── Config ────────────────────────────────────────────────────────────────────
HOST     = os.environ["SERVER_HOST"]
USER     = os.environ["SERVER_USER"]
PASSWORD = os.environ["SERVER_PASSWORD"]
APP_DIR  = "/root/unboundkeyword"
PORT_NO  = 3001
APP_NAME = "unboundkeyword"
DOMAIN   = "unboundkeyword.com"
EMAIL    = "joe@redwagon.agency"

# Source dir inside the checked-out repo
GITHUB_WORKSPACE = os.environ.get("GITHUB_WORKSPACE", "/github/workspace")
SRC_DIR = os.path.join(GITHUB_WORKSPACE, "unboundkeyword")

# ── Credentials ───────────────────────────────────────────────────────────────
NEXTAUTH_SECRET      = "ubk-prod-secret-2025-xK9mPq3wL7vN5rTy"
GOOGLE_CLIENT_ID     = "311730143264-21mm0e88tvh72lviq18qbtrjfuqog44f.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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"
DATAFORSEO_LOGIN     = os.environ.get("DATAFORSEO_LOGIN", "joe@redwagon.agency")
DATAFORSEO_PASSWORD  = os.environ.get("DATAFORSEO_PASSWORD", "8e2f935e765ad0c7")

ENV_CONTENT = textwrap.dedent(f"""\
DATABASE_URL="file:{APP_DIR}/data/prod.db"
NEXTAUTH_SECRET="{NEXTAUTH_SECRET}"
NEXTAUTH_URL="https://{DOMAIN}"
AUTH_URL="https://{DOMAIN}"
AUTH_SECRET="{NEXTAUTH_SECRET}"
GOOGLE_CLIENT_ID="{GOOGLE_CLIENT_ID}"
GOOGLE_CLIENT_SECRET="{GOOGLE_CLIENT_SECRET}"
DATAFORSEO_LOGIN="{DATAFORSEO_LOGIN}"
DATAFORSEO_PASSWORD="{DATAFORSEO_PASSWORD}"
""")

NGINX_HTTP = textwrap.dedent("""\
server {
    listen 80;
    server_name unboundkeyword.com www.unboundkeyword.com;
    client_max_body_size 50M;
    location / {
        proxy_pass http://localhost:3001;
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

NGINX_SSL = textwrap.dedent("""\
server {
    listen 80;
    server_name unboundkeyword.com www.unboundkeyword.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name unboundkeyword.com www.unboundkeyword.com;

    ssl_certificate     /etc/letsencrypt/live/unboundkeyword.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/unboundkeyword.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    add_header Strict-Transport-Security "max-age=63072000" always;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3001;
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

ECOSYSTEM = textwrap.dedent(f"""\
module.exports = {{
  apps: [{{
    name: "{APP_NAME}",
    script: "node_modules/.bin/next",
    args: "start -p {PORT_NO}",
    cwd: "{APP_DIR}",
    env: {{
      NODE_ENV: "production",
      PORT: "{PORT_NO}",
    }},
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "512M",
  }}],
}};
""")

# ── Files to exclude from upload ──────────────────────────────────────────────
EXCLUDE_DIRS  = {".git", ".next", "node_modules", "data", "__pycache__"}
EXCLUDE_FILES = {".env.local", ".env.production", ".env", "ecosystem.config.js",
                 "middleware.ts.bak", "tsconfig.tsbuildinfo"}

def should_include(path: str, is_dir: bool) -> bool:
    name = os.path.basename(path)
    if is_dir:
        return name not in EXCLUDE_DIRS
    if name in EXCLUDE_FILES:
        return False
    _, ext = os.path.splitext(name)
    if ext in {".db", ".db-journal", ".db-wal", ".db-shm"}:
        return False
    return True

# ── SSH helpers ───────────────────────────────────────────────────────────────
def run(client, cmd, desc="", timeout=600):
    if desc:
        print(f"\n{'='*60}\n>>> {desc}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    for line in iter(stdout.readline, ""):
        print(line, end="")
        sys.stdout.flush()
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        print("STDERR:", err, file=sys.stderr)
    rc = stdout.channel.recv_exit_status()
    if rc != 0:
        print(f"ERROR: exit code {rc}", file=sys.stderr)
        sys.exit(rc)

def sftp_write(sftp, remote_path, content):
    parent = remote_path.rsplit("/", 1)[0]
    try:
        sftp.stat(parent)
    except FileNotFoundError:
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
    print(f"  Wrote {remote_path}")

def build_archive():
    print(f"\n>>> Building source archive from {SRC_DIR}")
    buf = io.BytesIO()
    total = 0
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for root, dirs, files in os.walk(SRC_DIR):
            dirs[:] = [d for d in dirs if should_include(os.path.join(root, d), True)]
            for fname in files:
                fpath = os.path.join(root, fname)
                if not should_include(fpath, False):
                    continue
                arcname = os.path.relpath(fpath, SRC_DIR)
                tar.add(fpath, arcname=arcname)
                total += 1
    buf.seek(0)
    print(f"  Archive: {total} files, {buf.getbuffer().nbytes / 1024:.1f} KB")
    return buf

# ── Connect ───────────────────────────────────────────────────────────────────
def connect():
    def ki_handler(title, instructions, prompts):
        return [PASSWORD for _ in prompts]

    for method in ["keyboard-interactive", "password"]:
        try:
            t = paramiko.Transport((HOST, 22))
            t.start_client(timeout=30)
            if method == "keyboard-interactive":
                t.auth_interactive(USER, ki_handler)
            else:
                t.auth_password(USER, PASSWORD)
            if t.is_authenticated():
                print(f"Connected via {method}!")
                c = paramiko.SSHClient()
                c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                c._transport = t
                return c
        except Exception as e:
            print(f"  {method} failed: {e}")
            try:
                t.close()
            except Exception:
                pass

    print("ERROR: all auth methods failed", file=sys.stderr)
    sys.exit(1)

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    assert os.path.isfile(os.path.join(SRC_DIR, "package.json")), \
        f"Not a valid app directory: {SRC_DIR}"
    archive = build_archive()

    client = connect()
    sftp = client.open_sftp()

    # Bootstrap
    run(client, r"""
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq 2>&1 | tail -2
apt-get install -y -q git curl 2>&1 | tail -2
if ! command -v node &>/dev/null || [ "$(node -v 2>/dev/null | cut -d. -f1 | tr -d 'v')" -lt "20" ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>&1 | tail -5
  apt-get install -y nodejs 2>&1 | tail -2
fi
echo "Node $(node -v), npm $(npm -v)"
command -v pm2 &>/dev/null || npm install -g pm2
command -v nginx &>/dev/null || (apt-get install -y nginx && echo "nginx installed")
echo "Bootstrap OK"
""", "Bootstrapping server")

    # Fix searchauditpro nginx if it still has default_server (domain routing fix)
    run(client, """
if grep -q 'default_server\|server_name _' /etc/nginx/sites-available/searchauditpro 2>/dev/null; then
  echo "Fixing searchauditpro nginx (removing default_server)..."
  sed -i 's/listen 80 default_server;/listen 80;/' /etc/nginx/sites-available/searchauditpro
  sed -i 's/server_name _;/server_name searchauditpro.com www.searchauditpro.com;/' /etc/nginx/sites-available/searchauditpro
  nginx -t && systemctl reload nginx && echo "searchauditpro nginx fixed"
else
  echo "searchauditpro nginx already OK"
fi
""", "Ensuring searchauditpro nginx does not catch all traffic")

    # Upload archive
    print(f"\n>>> Uploading source to {APP_DIR}")
    run(client, f"mkdir -p {APP_DIR}")
    remote_tar = f"{APP_DIR}/source.tar.gz"
    sftp.putfo(archive, remote_tar)
    run(client, f"cd {APP_DIR} && tar -xzf source.tar.gz && rm -f source.tar.gz && echo 'Extracted OK'",
        "Extracting source archive")

    # Write config files
    print("\n>>> Writing config files")
    sftp_write(sftp, f"{APP_DIR}/.env.production", ENV_CONTENT)
    sftp_write(sftp, "/etc/nginx/sites-available/unboundkeyword", NGINX_HTTP)
    sftp_write(sftp, f"{APP_DIR}/ecosystem.config.js", ECOSYSTEM)
    sftp.close()

    # Enable nginx vhost (HTTP first, for certbot)
    run(client, """
ln -sf /etc/nginx/sites-available/unboundkeyword /etc/nginx/sites-enabled/unboundkeyword
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx && echo "nginx HTTP OK"
""", "Enabling nginx vhost for unboundkeyword.com (HTTP)")

    # SSL via Let's Encrypt + conditional nginx SSL config
    run(client, f"""
export DEBIAN_FRONTEND=noninteractive
apt-get install -y -q certbot python3-certbot-nginx 2>&1 | tail -3
certbot certonly --nginx \
  -d {DOMAIN} \
  --non-interactive --agree-tos --email {EMAIL} \
  --keep-until-expiring 2>&1 | tail -20 || echo "certbot failed or cert already valid"
echo "Certbot exit: $?"

if [ -f "/etc/letsencrypt/live/{DOMAIN}/fullchain.pem" ]; then
  echo "Cert obtained - writing SSL nginx config..."
  cat > /etc/nginx/sites-available/{APP_NAME} << 'NGINX_EOF'
{NGINX_SSL}NGINX_EOF
  nginx -t && systemctl reload nginx && echo "nginx SSL OK"
else
  echo "WARNING: No SSL cert - site will run on HTTP only"
  nginx -t && systemctl reload nginx && echo "nginx HTTP OK"
fi
""", "SSL certificate + conditional nginx SSL config")

    # Install npm deps
    run(client, f"cd {APP_DIR} && npm ci", "npm ci", timeout=300)

    # Prisma
    run(client, f"""
mkdir -p {APP_DIR}/data
cd {APP_DIR}
DATABASE_URL="file:{APP_DIR}/data/prod.db" npx prisma db push --accept-data-loss 2>&1
DATABASE_URL="file:{APP_DIR}/data/prod.db" npx prisma generate 2>&1
echo "Prisma OK"
""", "Prisma DB setup", timeout=120)

    # Build
    run(client, f"cd {APP_DIR} && NODE_ENV=production npm run build",
        "Next.js build", timeout=900)

    # PM2
    run(client, f"""
cd {APP_DIR}
if pm2 describe {APP_NAME} > /dev/null 2>&1; then
  pm2 reload {APP_NAME} --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save
pm2 startup systemd -u root --hp /root 2>&1 | tail -2 | bash 2>/dev/null || true
echo "PM2 OK"
pm2 list
""", "Starting PM2")

    print("\n" + "=" * 60)
    print("  unboundkeyword.com deployment complete!")
    print(f"  https://unboundkeyword.com  (port {PORT_NO})")
    print("=" * 60)
    client.close()

if __name__ == "__main__":
    main()
