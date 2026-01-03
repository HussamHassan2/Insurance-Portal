#!/bin/bash

# Test Server - Orient/Web Deployment Script
# Server: 165.227.174.138
# User: root
# URL: http://165.227.174.138:4002/web/

set -e  # Exit on any error

echo "=========================================="
echo "Test Server - Orient/Web Deployment"
echo "Server: 165.227.174.138"
echo "URL: http://165.227.174.138:4002/web/"
echo "=========================================="

# Navigate to project directory
cd ~/Insurance-Portal

echo "📥 Pulling latest changes from Git...
"
git fetch origin
git reset --hard origin/main

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building Orient project..."
npx ng build --configuration=orient --optimization=false --base-href http://165.227.174.138:4002/web/

echo "🚀 Deploying to web server..."
mkdir -p /var/www/html/web
rm -rf /var/www/html/web/*
cp -r dist/insurance-portal/* /var/www/html/web/

echo "🔒 Setting permissions..."
chown -R www-data:www-data /var/www/html/web
chmod -R 755 /var/www/html/web

echo "🔄 Reloading Nginx..."
systemctl reload nginx

echo "✅ Orient/Web deployment complete!"
echo "🌐 Website: http://165.227.174.138:4002/web/"
echo "=========================================="
