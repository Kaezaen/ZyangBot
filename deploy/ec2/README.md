# AWS EC2 deployment

This repository provides the deployment artifacts, but creating an EC2 instance,
security groups, and Spotify credentials remains an account-level action.

## Host requirements

- Ubuntu 24.04 LTS EC2 instance with Docker Engine and Docker Compose plugin.
- At least 2 GB RAM for the bot and Lavalink.
- Outbound HTTPS access for Discord, source providers, and Maven plugin downloads.
- Inbound SSH (22) restricted to your IP address.

Do not expose Lavalink port 2333 publicly. The Compose stack keeps it on the
internal Docker network. The metrics port is bound to localhost; expose it only
through a private monitoring network, reverse proxy, or SSH tunnel.

## Deploy

1. Clone this repository to `/opt/zyangbot`.
2. Copy `.env.example` to `.env` and fill every required secret.
3. Run `docker compose up -d --build`.
4. Copy `zyangbot.service` to `/etc/systemd/system/`, then run:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now zyangbot
   ```

5. Watch startup with `docker compose logs -f bot lavalink`.

## Updates

Pull the repository changes, rebuild, then redeploy:

```bash
git pull
docker compose up -d --build
```
