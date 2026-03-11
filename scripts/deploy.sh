#!/bin/bash
# Deploy script for Atlas
# Run after pushing to live branch

set -e

echo "=== Atlas Deployment ==="

# Load Cloudflare credentials
if [ -f /home/sandesh/argon_primary/.env ]; then
  CLOUDFLARE_ZONE_ID=$(grep '^CLOUDFLARE_ZONE_ID=' /home/sandesh/argon_primary/.env | cut -d'=' -f2)
  CLOUDFLARE_API_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' /home/sandesh/argon_primary/.env | cut -d'=' -f2)
  export CLOUDFLARE_ZONE_ID CLOUDFLARE_API_TOKEN
fi

# 1. Pull latest code
echo ""
echo "[1/5] Pulling latest from live branch..."
cd /home/sandesh/argon_primary/atlas
git fetch origin live
git checkout live
git reset --hard origin/live

# 2. Verify critical files exist
echo ""
echo "[2/5] Verifying critical files..."
test -f public/data/world-110m.json || { echo "ERROR: world-110m.json missing"; exit 1; }
test -f site/index.html || { echo "ERROR: site/index.html missing"; exit 1; }
test -f deploy/docker/nginx.conf || { echo "ERROR: nginx.conf missing"; exit 1; }

# 3. Rebuild and restart Docker (all 3 steps required!)
echo ""
echo "[3/5] Rebuilding Docker container..."
cd /home/sandesh/argon_primary
docker-compose down atlas
docker-compose build atlas
docker-compose up -d atlas

# 4. Wait for container to be healthy
echo ""
echo "[4/5] Waiting for container to start..."
sleep 8

# 5. Verify deployment
echo ""
echo "[5/5] Verifying deployment..."
FAIL=0

curl -sf http://localhost:3005/ > /dev/null && echo "  ✓ Landing page" || { echo "  ✗ Landing page FAILED"; FAIL=1; }
curl -sf http://localhost:3005/explore/ > /dev/null && echo "  ✓ Explore app" || { echo "  ✗ Explore app FAILED"; FAIL=1; }
curl -sf http://localhost:3005/research/ > /dev/null && echo "  ✓ Research hub" || { echo "  ✗ Research hub FAILED"; FAIL=1; }
curl -sf http://localhost:3005/research/paper/ > /dev/null && echo "  ✓ Research paper" || { echo "  ✗ Research paper FAILED"; FAIL=1; }
curl -sf http://localhost:3005/research/methodology/ > /dev/null && echo "  ✓ Methodology" || { echo "  ✗ Methodology FAILED"; FAIL=1; }
curl -sf http://localhost:8000/health > /dev/null && echo "  ✓ API health" || { echo "  ✗ API health FAILED"; FAIL=1; }

# Check redirects don't include port
REDIRECT=$(curl -sI http://localhost:3005/explore 2>&1 | grep -i "^location:" | head -1)
if echo "$REDIRECT" | grep -q ":3005"; then
  echo "  ✗ Redirect includes port (nginx absolute_redirect issue)"
  FAIL=1
else
  echo "  ✓ Redirects OK (no port)"
fi

if [ $FAIL -ne 0 ]; then
  echo ""
  echo "ERROR: Deployment verification failed!"
  exit 1
fi

# Purge Cloudflare cache
echo ""
echo "Purging Cloudflare cache..."
if [ -n "$CLOUDFLARE_ZONE_ID" ] && [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  curl -sf -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' > /dev/null && echo "  ✓ Cache purged" || echo "  ⚠ Cache purge failed (non-fatal)"
else
  echo "  ⚠ Skipping (CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN not set)"
fi

echo ""
echo "=== Deployment Complete ==="
echo "  Landing:     https://atlas.argonanalytics.org"
echo "  Explore:     https://atlas.argonanalytics.org/explore/"
echo "  Research:    https://atlas.argonanalytics.org/research/"
echo "  API Health:  https://api.argonanalytics.org/health"
