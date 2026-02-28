# Deploying on Vultr

Step-by-step guide to running the Novation Circuit Tracks Web UI on a Vultr VPS.

---

## 1. Create a VPS

In the [Vultr control panel](https://my.vultr.com/):

- **Server type:** Cloud Compute — Shared CPU (regular is fine)
- **OS:** Ubuntu 24.04 LTS x64
- **Plan:** 1 vCPU / 1 GB RAM / 25 GB SSD is sufficient (≈ $6/mo)
- **Region:** choose the one closest to you
- Enable **IPv4**, optionally add an SSH key under *SSH Keys* before deploying

---

## 2. Initial Server Setup

```bash
# SSH in as root
ssh root@YOUR_VPS_IP

# Update packages
apt update && apt upgrade -y

# Create a non-root user
adduser deploy
usermod -aG sudo deploy

# Copy your SSH key to the new user (from your local machine)
# ssh-copy-id deploy@YOUR_VPS_IP

# (Optional) Disable root SSH login
sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl reload ssh
```

---

## 3. Install Node.js 20 LTS

```bash
# Switch to the deploy user
su - deploy

# Install via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # v20.x.x
npm -v    # 10.x.x
```

---

## 4. Install pm2 (process manager)

```bash
sudo npm install -g pm2
```

---

## 5. Deploy the Application

```bash
# On the VPS — clone the repository
cd /home/deploy
git clone https://github.com/your-org/novation-circuit-tracks-ui.git app
cd app

# Install all dependencies
npm run install:all

# Build the frontend
npm run build
```

---

## 6. Start with pm2

```bash
# Start the server
PORT=3000 pm2 start server/index.js --name circuit-ui

# Save process list
pm2 save

# Enable pm2 to start on system boot (follow the printed command)
pm2 startup
```

Check status:

```bash
pm2 status
pm2 logs circuit-ui
```

---

## 7. Firewall (ufw)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# Allow direct access to Node.js port only if not using nginx
# sudo ufw allow 3000/tcp
sudo ufw enable
```

---

## 8. Install nginx as Reverse Proxy

```bash
sudo apt install -y nginx
```

Create a site config:

```bash
sudo nano /etc/nginx/sites-available/circuit-ui
```

Paste:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Increase body size for firmware / sample uploads
    client_max_body_size 64M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket support (real-time MIDI events)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/circuit-ui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Open **http://YOUR_DOMAIN_OR_IP** — you should see the app.

---

## 9. TLS / HTTPS (Let's Encrypt)

Requires a domain name pointed at the VPS IP (DNS A record).

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot patches the nginx config automatically and sets up auto-renewal.

---

## 10. Updating the App

```bash
cd /home/deploy/app
git pull
npm run install:all
npm run build
pm2 restart circuit-ui
```

---

## Environment Variables

Set persistent environment variables in the pm2 ecosystem file:

```bash
# Create ecosystem.config.cjs
cat > /home/deploy/app/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'circuit-ui',
    script: 'server/index.js',
    env: {
      PORT: 3000,
      NODE_ENV: 'production'
    }
  }]
}
EOF

pm2 delete circuit-ui
pm2 start ecosystem.config.cjs
pm2 save
```

---

## Note on USB MIDI

The Novation Circuit Tracks must be **physically connected via USB** to the machine running the server. On a remote VPS, USB MIDI access is not available.

**Options:**

| Scenario | How |
|----------|-----|
| Local machine (home/studio) | Run the server locally, access from `http://localhost:3000` or the local network |
| VPS + local device | Run the server on your local machine, expose it with a tunnel tool (e.g. **Cloudflare Tunnel** or **ngrok**) |
| VPS only (no MIDI hardware) | Fully functional for session management, patch file editing, and SysEx import/export; real-time MIDI control unavailable |

---

## Useful Commands

```bash
pm2 status                 # process status
pm2 logs circuit-ui        # streaming logs
pm2 restart circuit-ui     # restart after crash / update
sudo systemctl status nginx
sudo nginx -t              # test nginx config
```
