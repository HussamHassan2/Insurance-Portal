#!/bin/bash

# Test Server - Wataniya Deployment Script
# Server: 165.227.174.138
# User: root
# URL: http://165.227.174.138:4002/

set -e  # Exit on any error

echo "=========================================="
echo "Test Server - Wataniya Deployment"
echo "Server: 165.227.174.138"
echo "URL: http://165.227.174.138:4002/"
echo "=========================================="

# Navigate to project directory
cd ~/Insurance-Portal

echo "📥 Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/main

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building Wataniya project..."
npx ng build --configuration=wataniya --optimization=false --base-href http://165.227.174.138:4002/

echo "🚀 Deploying to web server..."
rm -rf /var/www/wataniya/*
cp -r dist/insurance-portal/* /var/www/wataniya/

echo "🔒 Setting permissions..."
chown -R www-data:www-data /var/www/wataniya
chmod -R 755 /var/www/wataniya

echo "🔄 Reloading Nginx..."
systemctl reload nginx

echo "✅ Wataniya deployment complete!"
echo "🌐 Website: http://165.227.174.138:4002/"
echo "=========================================="
