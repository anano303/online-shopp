#!/bin/bash

# Deploy script for \u10ea\u10d0\u10db\u10d4\u10e2\u10d8 application
# This script should be placed on the DigitalOcean Droplet

set -e

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/tsamerti

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Navigate to server directory
cd server

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker-compose down

# Build and start new containers
echo "🔨 Building and starting new containers..."
docker-compose up -d --build

# Remove unused Docker images to save space
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

# Show running containers
echo "✅ Deployment complete! Running containers:"
docker-compose ps

# Show logs for the last 20 lines
echo "📝 Recent logs:"
docker-compose logs --tail=20
