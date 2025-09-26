#!/bin/bash

echo "🧪 Running PWA Tests"
echo "===================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the pedidolist-app directory."
    exit 1
fi

# Check if vitest is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

echo "📋 Test Categories:"
echo "  • Service Worker Tests"
echo "  • PWA Component Tests"
echo "  • Background Sync Tests"
echo "  • Offline Sync Tests"
echo "  • Integration Tests"
echo ""

# Run PWA tests with coverage
echo "🚀 Starting PWA test suite..."
npx vitest run tests/pwa/ \
    --reporter=verbose \
    --coverage \
    --coverage.reporter=text \
    --coverage.reporter=html \
    --coverage.reporter=json \
    --coverage.exclude="**/node_modules/**" \
    --coverage.exclude="**/dist/**" \
    --coverage.exclude="**/coverage/**" \
    --coverage.exclude="**/*.test.*" \
    --coverage.exclude="**/*.spec.*"

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All PWA tests passed!"
    echo ""
    echo "📊 Coverage report generated in:"
    echo "  • coverage/index.html (HTML report)"
    echo "  • coverage/coverage.json (JSON report)"
    echo ""
    echo "🔍 To view detailed coverage:"
    echo "  open coverage/index.html"
else
    echo ""
    echo "❌ Some PWA tests failed!"
    echo ""
    echo "🔧 To debug specific tests:"
    echo "  npx vitest run tests/pwa/ --reporter=verbose"
    echo ""
    echo "🔍 To run tests in watch mode:"
    echo "  npx vitest tests/pwa/ --watch"
    exit 1
fi 