#!/bin/bash

# Wataniya Test Deployment Script
# Server: 192.168.4.18
# User: system_admin

set -e  # Exit on any error

echo "=========================================="
echo "Wataniya Test Deployment Script"
echo "Server: 192.168.4.18"
echo "=========================================="

# Navigate to project directory (adjust path if needed)
cd ~/Insurance-Portal

echo "📥 Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/main  # Force sync with remote

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building project..."
npx ng build --configuration=wataniya --optimization=false --base-href http://192.168.4.18:4200/

echo "📋 Copying .htaccess..."
sudo cp .htaccess dist/insurance-portal/ 2>/dev/null || echo "No .htaccess found, skipping..."

echo "🚀 Deploying to web server..."
# Note: Adjust deployment path based on server configuration
sudo rm -rf /var/www/html/*
sudo cp -r dist/insurance-portal/* /var/www/html/

echo "🔒 Setting permissions..."
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

echo "🔄 Reloading web server..."
sudo systemctl reload nginx 2>/dev/null || sudo systemctl reload apache2 2>/dev/null || echo "Web server reload skipped"

echo "✅ Deployment complete!"
echo "🌐 Website: http://192.168.4.18:4200/"
echo "=========================================="
