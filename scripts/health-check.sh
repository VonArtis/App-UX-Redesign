#!/bin/bash
# VonVault Health Check Script
# Run this before every git commit

echo "🔍 VonVault Health Check Starting..."

# Frontend Build Test (Most Important)
echo "🏗️ Testing Frontend Build..."
cd /app/frontend
yarn build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    echo "🔧 Running build again to show errors:"
    yarn build
    exit 1
fi

# Backend Python Check
echo "🐍 Checking Backend..."
cd /app/backend
python -m py_compile server.py
if [ $? -ne 0 ]; then
    echo "❌ Backend Python errors!"
    exit 1
fi

# Service Restart Test
echo "🔄 Testing Fresh Restart..."
sudo supervisorctl restart all > /dev/null 2>&1
sleep 10

# Health Check
curl -s http://localhost:3000 > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Frontend not responding!"
    exit 1
fi

curl -s http://localhost:8001/api/status > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Backend not responding!"
    exit 1
fi

# TypeScript Check (Warning only, don't fail)
echo "📝 Checking TypeScript (warnings only)..."
cd /app/frontend
TS_ERRORS=$(npx tsc --noEmit 2>&1 | wc -l)
if [ $TS_ERRORS -gt 0 ]; then
    echo "⚠️ Found $TS_ERRORS TypeScript issues (not blocking deployment)"
    echo "💡 Consider running: npx tsc --noEmit | head -5"
else
    echo "✅ No TypeScript errors found!"
fi

echo "✅ All critical checks passed! Safe to commit."
echo "🚀 Frontend: ✅ | Backend: ✅ | Build: ✅ | Services: ✅"