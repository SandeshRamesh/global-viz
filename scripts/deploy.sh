#!/bin/bash
# Deploy script for atlas
# Run after pushing to live branch

set -e

cd /home/sandesh/argon_primary/atlas

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
cp -r site/research dist/research 2>/dev/null || true
cp site/favicon.svg dist/favicon.svg 2>/dev/null || true
cp site/404.html dist/404.html 2>/dev/null || true
# serve.json provides rewrite rules (replaces -s flag)
cp serve.json dist/serve.json

echo "Updating systemd service (remove -s flag, serve.json handles routing)..."
# One-time: sudo systemctl edit atlas-frontend
# Change: ExecStart=npx serve dist -l 3005
# (remove the -s flag — serve.json rewrites handle SPA fallback)
echo "Restarting services..."
sudo systemctl restart atlas-frontend atlas-api

echo "Waiting for services to start..."
sleep 5

echo "Verifying deployment..."
curl -sf http://localhost:3005/ > /dev/null && echo "✓ Landing page OK"
curl -sf http://localhost:3005/explore/ > /dev/null && echo "✓ SPA OK"
curl -sf http://localhost:3005/explore/test-route | grep -q "Atlas" && echo "✓ SPA fallback OK"
curl -sf http://localhost:3005/research/ > /dev/null && echo "✓ Research hub OK"
curl -sf http://localhost:3005/research/paper/ > /dev/null && echo "✓ Research paper OK"
curl -sf http://localhost:3005/research/methodology/ > /dev/null && echo "✓ Methodology OK"
curl -sf http://localhost:8000/health && echo "✓ API OK"

echo ""
echo "Deployment complete!"
echo "  Landing:  https://atlas.argonanalytics.org"
echo "  Tool:     https://atlas.argonanalytics.org/explore"
echo "  API:      https://api.argonanalytics.org"
