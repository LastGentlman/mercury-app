#!/bin/bash

echo "🧪 Testing Complete Account Deletion Solution"
echo "=============================================="

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -s http://localhost:3030/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start it first:"
    echo "   cd ../Backend && deno run --allow-all main.ts"
    exit 1
fi

# Clean build
echo "🧹 Cleaning and rebuilding frontend..."
rm -rf dist/
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Open browser and go to http://localhost:3000"
echo "2. Open DevTools (F12) and go to Application tab"
echo "3. Clear all storage:"
echo "   - Clear Storage > Clear site data"
echo "   - Service Workers > Unregister all"
echo "4. Hard refresh (Ctrl+Shift+R)"
echo "5. Login with a test account"
echo "6. Go to Settings > Delete Account"
echo "7. Follow the deletion process"
echo "8. Check console logs for success messages"
echo ""
echo "📋 Expected Success Logs:"
echo "Backend:"
echo "  🗑️ Starting cascade deletion for user: [user-id]"
echo "  ✅ All dependent rows deleted/updated successfully"
echo "  ✅ Account successfully deleted for user: [email]"
echo ""
echo "Frontend:"
echo "  ✅ Account deletion request successful"
echo "  ✅ Supabase session error (expected after deletion)"
echo "  ✅ Backend confirms user is deleted (401/403 response)"
echo "  ✅ Complete cleanup finished"
echo ""
echo "🔧 If you encounter issues:"
echo "1. Check backend terminal for error logs"
echo "2. Run: node test-backend-deletion.js (with valid token)"
echo "3. Check database constraints with SQL queries in ACCOUNT_DELETION_FIX.md"
echo ""
echo "✅ Ready to test!"
