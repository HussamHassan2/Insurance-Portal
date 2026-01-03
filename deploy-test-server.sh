#!/bin/bash

# Test Server Deployment Script
# Server: 165.227.174.138
# User: root

set -e  # Exit on any error

echo "=========================================="
echo "Test Server Deployment Script"
echo "Server: 165.227.174.138"
echo "=========================================="

# Navigate to project directory (adjust path if needed)
cd ~/Insurance-Portal

echo "📥 Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/main  # Force sync with remote

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building project..."
# Note: Adjust configuration and base-href based on server needs
npx ng build --configuration=production --optimization=false --base-href http://165.227.174.138/

echo "📋 Copying .htaccess..."
cp .htaccess dist/insurance-portal/ 2>/dev/null || echo "No .htaccess found, skipping..."

echo "🚀 Deploying to web server..."
# Note: Adjust deployment path based on server configuration
rm -rf /var/www/html/*
cp -r dist/insurance-portal/* /var/www/html/

echo "🔒 Setting permissions..."
chown -R www-data:www-data /var/www/html 2>/dev/null || chown -R nginx:nginx /var/www/html 2>/dev/null || echo "Permission setting skipped"
chmod -R 755 /var/www/html

echo "🔄 Reloading web server..."
systemctl reload nginx 2>/dev/null || systemctl reload apache2 2>/dev/null || echo "Web server reload skipped"

echo "✅ Deployment complete!"
echo "🌐 Website: http://165.227.174.138/"
echo "=========================================="
