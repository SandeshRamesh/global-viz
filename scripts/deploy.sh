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
VITE_API_BASE=https://api.argonanalytics.org npm run build

echo "Restarting services..."
sudo systemctl restart atlas-frontend atlas-api

echo "Waiting for services to start..."
sleep 5

echo "Verifying deployment..."
curl -sf http://localhost:3005/ > /dev/null && echo "✓ Frontend OK"
curl -sf http://localhost:8000/health && echo "✓ API OK"

echo ""
echo "Deployment complete!"
echo "  Frontend: https://atlas.argonanalytics.org"
echo "  API: https://api.argonanalytics.org"
