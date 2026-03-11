#!/bin/bash
# Deploy script for atlas
# Run after pushing to live branch

set -e

cd /home/sandesh/argon_primary/atlas

# Load Cloudflare credentials for cache purge
if [ -f /home/sandesh/argon_primary/.env ]; then
  CLOUDFLARE_ZONE_ID=$(grep '^CLOUDFLARE_ZONE_ID=' /home/sandesh/argon_primary/.env | cut -d'=' -f2)
  CLOUDFLARE_API_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' /home/sandesh/argon_primary/.env | cut -d'=' -f2)
  export CLOUDFLARE_ZONE_ID CLOUDFLARE_API_TOKEN
fi

echo "Pulling latest from live branch..."
git fetch origin live
git checkout live
git reset --hard origin/live

echo "Verifying critical files..."
test -f public/data/world-110m.json || { echo "ERROR: world-110m.json missing"; exit 1; }

echo "Installing dependencies..."
npm ci

echo "Building frontend..."
# Vite builds SPA into dist/explore/
VITE_API_BASE=https://api.argonanalytics.org npm run build

echo "Assembling site..."
# Copy landing page to dist/ root (served at /)
cp site/index.html dist/index.html
cp -r site/assets dist/assets 2>/dev/null || true
rm -rf dist/research && cp -r site/research dist/research
cp site/favicon.svg dist/favicon.svg 2>/dev/null || true
cp site/404.html dist/404.html 2>/dev/null || true
# serve.json provides rewrite rules (replaces -s flag)
cp serve.json dist/serve.json

echo "Rebuilding and restarting Docker container..."
cd /home/sandesh/argon_primary
docker-compose build atlas
docker-compose up -d atlas
cd /home/sandesh/argon_primary/atlas

echo "Waiting for container to start..."
sleep 5

echo "Verifying deployment..."
FAIL=0

curl -sf http://localhost:3005/ > /dev/null && echo "✓ Landing page OK" || { echo "✗ Landing page FAILED"; FAIL=1; }
curl -sf http://localhost:3005/explore/ > /dev/null && echo "✓ SPA OK" || { echo "✗ SPA FAILED"; FAIL=1; }
curl -sf http://localhost:3005/explore/test-route 2>/dev/null | grep -q "Atlas" && echo "✓ SPA fallback OK" || { echo "✗ SPA fallback FAILED"; FAIL=1; }
curl -sf http://localhost:3005/research/ > /dev/null && echo "✓ Research hub OK" || { echo "✗ Research hub FAILED"; FAIL=1; }
curl -sf http://localhost:3005/research/paper/ > /dev/null && echo "✓ Research paper OK" || { echo "✗ Research paper FAILED"; FAIL=1; }
curl -sf http://localhost:3005/research/methodology/ > /dev/null && echo "✓ Methodology OK" || { echo "✗ Methodology FAILED"; FAIL=1; }
curl -sf http://localhost:8000/health > /dev/null && echo "✓ API OK" || { echo "✗ API FAILED"; FAIL=1; }

if [ $FAIL -ne 0 ]; then
  echo ""
  echo "ERROR: Deployment verification failed!"
  exit 1
fi

# Purge Cloudflare cache
echo "Purging Cloudflare cache..."
if [ -n "$CLOUDFLARE_ZONE_ID" ] && [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  curl -sf -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' > /dev/null && echo "✓ Cloudflare cache purged" || echo "⚠ Cloudflare purge failed (non-fatal)"
else
  echo "⚠ Skipping Cloudflare purge (CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN not set)"
fi

echo ""
echo "Deployment complete!"
echo "  Landing:  https://atlas.argonanalytics.org"
echo "  Tool:     https://atlas.argonanalytics.org/explore"
echo "  API:      https://api.argonanalytics.org"
