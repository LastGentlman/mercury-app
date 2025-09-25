#!/bin/bash

# Deployment fix script for MIME type issues
echo "🔧 Fixing deployment MIME type issues..."

# Clean and rebuild
echo "📦 Cleaning and rebuilding..."
npm run clean
npm run build

# Copy server configuration files to dist
echo "📋 Copying server configuration files..."
cp nginx.conf dist/
cp .htaccess dist/
cp _headers dist/
cp _redirects dist/

# Verify the build
echo "✅ Verifying build..."
if [ -f "dist/index.html" ]; then
    echo "✅ index.html exists"
else
    echo "❌ index.html missing"
    exit 1
fi

if [ -d "dist/assets" ]; then
    echo "✅ assets directory exists"
    JS_COUNT=$(find dist/assets -name "*.js" | wc -l)
    echo "✅ Found $JS_COUNT JavaScript files"
else
    echo "❌ assets directory missing"
    exit 1
fi

# Check for proper MIME type configuration
echo "🔍 Checking MIME type configuration..."
if grep -q "application/javascript" dist/_headers; then
    echo "✅ _headers file has proper MIME types"
else
    echo "❌ _headers file missing MIME types"
fi

if grep -q "application/javascript" dist/vercel.json; then
    echo "✅ vercel.json has proper MIME types"
else
    echo "❌ vercel.json missing MIME types"
fi

echo "🎉 Deployment fix complete!"
echo "📝 Next steps:"
echo "   1. Deploy the dist/ folder to your server"
echo "   2. Ensure your server uses the nginx.conf or .htaccess configuration"
echo "   3. For Vercel/Netlify, the _headers and vercel.json files will handle MIME types"
echo "   4. Clear browser cache and test the application"
