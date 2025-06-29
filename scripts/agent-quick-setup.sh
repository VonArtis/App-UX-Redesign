#!/bin/bash

# 🚀 VonVault Agent Quick Setup Script
# This script sets up the correct production files for VonVault development

echo "🤖 Starting VonVault Agent Quick Setup..."
echo "================================================"

# Step 1: Clone production repository
echo "📥 Cloning VonVault production repository..."
cd /tmp
if [ -d "TG-Mini-App" ]; then
    rm -rf TG-Mini-App
fi
git clone https://github.com/HarryVonBot/TG-Mini-App.git

if [ ! -d "TG-Mini-App" ]; then
    echo "❌ ERROR: Failed to clone repository"
    exit 1
fi

# Step 2: Backup existing files (if any)
echo "💾 Backing up existing files..."
cd /app
if [ -d "backend" ] || [ -d "frontend" ]; then
    mkdir -p /tmp/app_backup_$(date +%Y%m%d_%H%M%S)
    cp -r backend frontend tests scripts test_result.md README.md /tmp/app_backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    echo "✅ Backup created in /tmp/app_backup_$(date +%Y%m%d_%H%M%S)"
fi

# Step 3: Remove template files
echo "🗑️ Removing template files..."
rm -rf backend frontend tests scripts test_result.md README.md 2>/dev/null || true

# Step 4: Copy production files
echo "📁 Copying VonVault production files..."
cd /tmp/TG-Mini-App
cp -r backend frontend tests scripts test_result.md README.md /app/

# Step 5: Verify file sizes
echo "🔍 Verifying production files..."
backend_size=$(stat -c%s /app/backend/server.py 2>/dev/null || echo "0")
if [ "$backend_size" -gt 100000 ]; then
    echo "✅ Backend file size: ${backend_size} bytes (Production ✓)"
else
    echo "❌ Backend file size: ${backend_size} bytes (Template ✗)"
    exit 1
fi

# Step 6: Check for key production indicators
if grep -q "Vonage client initialized" /app/backend/server.py; then
    echo "✅ Vonage integration found"
else
    echo "❌ Vonage integration not found"
fi

if [ -f "/app/frontend/src/components/common/PasswordInput.tsx" ]; then
    echo "✅ Production UI components found"
else
    echo "❌ Production UI components missing"
fi

security_count=$(grep -c "9.95/10" /app/README.md 2>/dev/null || echo "0")
if [ "$security_count" -gt 5 ]; then
    echo "✅ Security rating references: $security_count"
else
    echo "❌ Security rating references: $security_count"
fi

# Step 7: Install dependencies
echo "📦 Installing backend dependencies..."
cd /app/backend
pip install -r requirements.txt > /dev/null 2>&1

echo "📦 Installing frontend dependencies..."
cd /app/frontend
yarn install > /dev/null 2>&1

# Step 8: Restart services
echo "🔄 Restarting services..."
sudo supervisorctl restart all > /dev/null 2>&1

# Step 9: Check service status
echo "📊 Checking service status..."
sleep 3
sudo supervisorctl status

echo "================================================"
echo "🎉 VonVault Agent Quick Setup Complete!"
echo ""
echo "🔗 Live URLs:"
echo "   Frontend: https://www.vonartis.app"
echo "   Backend:  https://www.api.vonartis.app"
echo ""
echo "✅ You now have the complete VonVault production codebase!"
echo "📖 Next steps: Read /app/test_result.md for current project status"