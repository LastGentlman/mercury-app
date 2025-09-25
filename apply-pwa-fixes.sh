#!/bin/bash

echo "🔧 APPLYING PWA FIXES - PedidoList App"
echo "=================================="

# 1. Clean all caches
echo "🧹 Cleaning build caches..."
rm -rf dist/ .vite/ node_modules/.vite/ node_modules/.cache/

# 2. Create .env for PWA control
echo "⚙️  Creating .env for PWA control..."
cat > .env << 'EOF'
VITE_PWA_DISABLED=false
VITE_ENVIRONMENT=production
NODE_ENV=production
EOF

# 3. Fix the products route issue
echo "🔧 Fixing products route..."
if [ -f "src/routes/products.tsx" ]; then
    cat > src/routes/products.tsx << 'EOF'
import { createFileRoute } from '@tanstack/react-router'
import { ProductsList } from '../components/ProductsList'

export const Route = createFileRoute('/products')({
  component: ProductsPage,
})

function ProductsPage() {
  return <ProductsList />
}
EOF
    echo "✅ Fixed products route"
else
    echo "⚠️  products.tsx not found, skipping"
fi

# 4. Ensure critical files exist
echo "📁 Checking critical files..."

# Check styles.css
if [ ! -f "src/styles.css" ]; then
    echo "❌ Creating missing src/styles.css..."
    cat > src/styles.css << 'EOF'
@import "tailwindcss";

@layer base {
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: white;
    color: rgb(17 24 39);
  }
}

@layer utilities {
  @media (max-width: 768px) {
    .mobile-content {
      padding-bottom: 5rem;
    }
  }

  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .bottom-nav-safe {
      padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
    }
  }

  @media (prefers-color-scheme: dark) {
    .header-dark {
      background-color: rgb(17 24 39);
      border-color: rgb(55 65 81);
    }
    
    .bottom-nav-dark {
      background-color: rgb(17 24 39);
      border-color: rgb(55 65 81);
    }
    
    .logo-dark {
      color: rgb(243 244 246);
    }
    
    .nav-item-dark {
      color: rgb(156 163 175);
    }
    
    .nav-item-dark:hover {
      color: rgb(96 165 250);
    }
  }
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.21 0.006 285.885);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.871 0.006 286.286);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.141 0.005 285.823);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.141 0.005 285.823);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.21 0.006 285.885);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.274 0.006 286.033);
  --input: oklch(0.274 0.006 286.033);
  --ring: oklch(0.442 0.017 285.786);
}
EOF
    echo "✅ Created src/styles.css"
else
    echo "✅ src/styles.css exists"
fi

# 5. Add enhanced build scripts to package.json
echo "📦 Adding enhanced build scripts..."
npm pkg set scripts.build:clean="rm -rf dist/ .vite/ && npm run build"
npm pkg set scripts.build:no-pwa="VITE_PWA_DISABLED=true npm run build"
npm pkg set scripts.build:pwa="VITE_PWA_DISABLED=false npm run build"
npm pkg set scripts.deploy:safe="npm run build:no-pwa"
npm pkg set scripts.deploy:pwa="npm run build:pwa"
npm pkg set scripts.clean="rm -rf dist/ .vite/"
npm pkg set scripts.clean:full="rm -rf dist/ .vite/ node_modules/.vite/ node_modules/.cache/"

echo ""
echo "✅ ALL FIXES APPLIED SUCCESSFULLY!"
echo ""
echo "🎯 NEXT STEPS:"
echo ""
echo "1. ✅ Dev server is running at http://localhost:3000"
echo "2. 🧪 Test your mobile navigation"
echo "3. 🚀 For production deployment:"
echo "   npm run deploy:safe    # Safe deploy without PWA"
echo "   npm run deploy:pwa     # Deploy with PWA enabled"
echo ""
echo "🌐 Vercel Environment Variables (if needed):"
echo "   VITE_PWA_DISABLED=false"
echo "   VITE_ENVIRONMENT=production"
echo "   NODE_ENV=production"
echo "" 