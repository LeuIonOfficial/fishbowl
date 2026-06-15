#!/usr/bin/env bash
# Deploy / update Fishbowl on the VPS. Run from the repo root:
#   ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Pulling latest code (if this is a git checkout)"
git pull --ff-only 2>/dev/null || echo "   (not a git pull context — skipping)"

echo "==> Building images"
docker compose build

echo "==> Starting stack"
docker compose up -d

echo "==> Waiting for health"
sleep 5
docker compose ps

echo
echo "Done. App should be reachable at: http://$(hostname -I 2>/dev/null | awk '{print $1}')/"
echo "Logs:    docker compose logs -f app"
echo "Stop:    docker compose down"
