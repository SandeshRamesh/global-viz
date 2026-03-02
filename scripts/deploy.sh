#!/bin/bash
# Deploy script for atlas
# Run after pushing to live branch

set -e

cd /home/sandesh/argon_primary/atlas

echo "Pulling latest from live branch..."
git fetch origin live
git checkout live
git pull origin live

echo "Ensuring data symlinks..."
mkdir -p /home/sandesh/argon_primary/v3.1/data/metadata
ln -sf /home/sandesh/argon_primary/atlas/data/v31/metadata/regional_groups.json /home/sandesh/argon_primary/v3.1/data/metadata/regional_groups.json

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
