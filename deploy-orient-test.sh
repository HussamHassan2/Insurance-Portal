#!/bin/bash

# Orient Test Deployment Script
# Server: 10.245.3.230
# User: uat

set -e  # Exit on any error

echo "=========================================="
echo "Orient Test Deployment Script"
echo "Server: 10.245.3.230"
echo "=========================================="

# Navigate to project directory (adjust path if needed)
cd ~/Insurance-Portal

echo "📥 Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/main  # Force sync with remote

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building project..."
npx ng build --configuration=orient --optimization=false --base-href http://10.245.3.230:4002/portal/

echo "📋 Copying .htaccess..."
sudo cp .htaccess dist/insurance-portal/

echo "🚀 Deploying to web server..."
# Note: Adjust deployment path based on server configuration
sudo rm -rf /var/www/html/portal/*
sudo cp -r dist/insurance-portal/* /var/www/html/portal/

echo "🔒 Setting permissions..."
sudo chown -R www-data:www-data /var/www/html/portal
sudo chmod -R 755 /var/www/html/portal

echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Website: http://10.245.3.230:4002/portal/"
echo "=========================================="
