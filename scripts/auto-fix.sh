#!/bin/bash
# Fix common TypeScript issues automatically

echo "🔧 VonVault Auto-Fix Common Issues..."

cd /app/frontend

# Fix common formatting issues
echo "📐 Running Prettier..."
npx prettier --write "src/**/*.{ts,tsx,js,jsx}" 2>/dev/null || echo "⚠️ Prettier not available"

# Show remaining TypeScript issues
echo ""
echo "📝 Remaining TypeScript issues:"
npx tsc --noEmit | head -5

echo ""
echo "✅ Auto-fix complete! Check remaining issues above."