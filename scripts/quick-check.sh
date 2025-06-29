#!/bin/bash
# Quick TypeScript check - for immediate feedback while coding

echo "📝 Quick TypeScript Check..."
cd /app/frontend

# Show only first 10 errors for quick feedback
npx tsc --noEmit | head -10

echo ""
echo "💡 Run '/app/scripts/health-check.sh' for full deployment readiness check"