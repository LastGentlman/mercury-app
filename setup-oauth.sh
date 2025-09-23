#!/bin/bash

# OAuth Setup Script for PedidoList
# This script helps configure OAuth with Supabase

echo "🔧 Setting up OAuth configuration for PedidoList..."

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
# Frontend Environment Variables
VITE_BACKEND_URL=http://localhost:3030
VITE_APP_TITLE=PedidoList
VITE_ENVIRONMENT=development

# Supabase Configuration for OAuth
# TODO: Replace with your actual Supabase project credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# PWA Configuration
VITE_PWA_DISABLED=false

# OAuth Configuration
VITE_GOOGLE_OAUTH_EXTENDED_SCOPES=false
VITE_OAUTH_PERF_LOGS=false

# Sentry Configuration (optional)
# VITE_SENTRY_DSN=your_sentry_dsn_here
# VITE_ENABLE_SENTRY_DEV=false
EOF
    echo "✅ .env.local file created successfully!"
else
    echo "⚠️ .env.local file already exists."
fi

echo ""
echo "🚀 OAuth Setup Instructions:"
echo ""
echo "1. 📋 Create a Supabase project:"
echo "   - Go to https://app.supabase.com"
echo "   - Create a new project"
echo "   - Get your Project URL and Anon Key from Project Settings > API"
echo ""
echo "2. 🔧 Update .env.local with your Supabase credentials:"
echo "   - Replace 'https://your-project-ref.supabase.co' with your Project URL"
echo "   - Replace 'your-anon-key-here' with your Anon Key"
echo ""
echo "3. 🔐 Configure OAuth providers in Supabase:"
echo "   - Go to Authentication > Providers in your Supabase dashboard"
echo "   - Enable Google and/or Facebook"
echo "   - Add your OAuth app credentials"
echo ""
echo "4. 🌐 Google OAuth Setup:"
echo "   - Create a Google Cloud Project at https://console.cloud.google.com"
echo "   - Enable Google+ API: APIs & Services > Library > Google+ API"
echo "   - Create OAuth 2.0 credentials: APIs & Services > Credentials"
echo "   - Add authorized redirect URI: https://your-project-ref.supabase.co/auth/v1/callback"
echo "   - Add credentials to Supabase Authentication settings"
echo ""
echo "5. 📘 Facebook OAuth Setup:"
echo "   - Create a Facebook App at https://developers.facebook.com"
echo "   - Add Facebook Login product"
echo "   - Add authorized redirect URI: https://your-project-ref.supabase.co/auth/v1/callback"
echo "   - Add credentials to Supabase Authentication settings"
echo ""
echo "6. 🧪 Test the configuration:"
echo "   - Start the backend: cd ../Backend && deno run --allow-all main.ts"
echo "   - Start the frontend: npm run dev"
echo "   - Navigate to http://localhost:3000/auth"
echo "   - Test OAuth login buttons"
echo ""
echo "📚 For detailed instructions, see: docs/OAUTH_IMPLEMENTATION_README.md"
echo ""
echo "🎯 OAuth setup complete! Follow the instructions above to configure your providers."
