echo "Get latest updates..."
sudo git pull origin main
echo "Installing dependencies..."
npm install
echo "Building the project..."
ng build --configuration orient
echo "Build completed."
echo "You can find the build output in the 'dist' directory."
echo "Copy .htaccess file..."
sudo cp .htaccess dist/insurance-portal/
echo ".htaccess file copied."
echo "Build process finished."
echo "-----------------------------------"
echo "Starting deployment..."
sudo rm -rf /var/www/html/portal
sudo cp -r dist/insurance-portal/ /var/www/html/portal
echo "Deployment completed."
sudo git reset --hard
echo "Repository reset to last committed state."
echo "You can access the application at http://your-server-ip/portal"