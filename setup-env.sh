#!/bin/bash

# Setup script for local development environment

echo "🔧 Setting up environment for local development..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Frontend Environment Variables
VITE_BACKEND_URL=http://localhost:3030
VITE_APP_TITLE=PedidoList
VITE_ENVIRONMENT=development

# PWA Configuration
VITE_PWA_DISABLED=false

# Sentry Configuration (optional)
# VITE_SENTRY_DSN=your_sentry_dsn_here
# VITE_ENABLE_SENTRY_DEV=false
EOF
    echo "✅ .env file created successfully!"
else
    echo "⚠️ .env file already exists. Please check if VITE_BACKEND_URL is set to http://localhost:3030"
fi

# Check if backend is running
echo "🔍 Checking backend status..."
if curl -s http://localhost:3030/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:3030"
else
    echo "❌ Backend is not running on http://localhost:3030"
    echo "💡 Start the backend with: cd ../Backend && deno run --allow-net --allow-env --allow-read main.ts"
fi

echo ""
echo "🎯 Environment setup complete!"
echo "📋 Next steps:"
echo "   1. Start the backend: cd ../Backend && deno run --allow-net --allow-env --allow-read main.ts"
echo "   2. Start the frontend: npm run dev"
echo "   3. Test the security logging: cd ../Backend && deno run --allow-net --allow-env test-security-log.ts" 