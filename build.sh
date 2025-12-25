echo "Building the project..."
ng build --configuration orient  --output-hashing=all --base-href http://10.245.2.246:4002/portal/
echo "Build completed."
echo "You can find the build output in the 'dist' directory."
echo "Copy .htaccess file..."
sudo cp .htaccess dist/insurance-portal/
echo ".htaccess file copied."
echo "-----------------------------------"
cd dist/insurance-portal/
git init
git add .
git commit -m "build"
git remote set-url origin https://github.com/HussamHassan2/build.git
git push --set-upstream origin main --force