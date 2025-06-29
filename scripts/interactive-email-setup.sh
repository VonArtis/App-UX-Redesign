#!/bin/bash
# Interactive Email Setup for VonVault

echo "📧 VonVault Email Notifications - Interactive Setup"
echo "================================================="
echo ""

echo "🎯 I'll open the GitHub pages you need to configure email notifications."
echo "   Follow along with the instructions below..."
echo ""

echo "📋 **CONFIGURATION CHECKLIST:**"
echo ""

echo "1️⃣ **GitHub Notification Settings**"
echo "   ✅ Enable email notifications"
echo "   ✅ Enable Actions failure notifications"
echo ""

echo "2️⃣ **Repository Watch Settings**"
echo "   ✅ Watch your VonVault repository"
echo "   ✅ Set to 'All Activity'"
echo ""

echo "3️⃣ **Email Verification**"
echo "   ✅ Verify your email address"
echo ""

echo "Press Enter to start opening GitHub configuration pages..."
read -p ""

echo ""
echo "🌐 Opening GitHub Notification Settings..."
echo "   📍 URL: https://github.com/settings/notifications"
echo ""
echo "📝 **On this page, please:**"
echo "   ✅ Scroll to 'Actions' section"
echo "   ✅ Check: 'Send email when workflow run fails'"
echo "   ✅ Check: 'Send weekly email summaries'"
echo "   ✅ Click 'Update preferences'"
echo ""

# For systems with xdg-open (Linux) or open (macOS)
if command -v xdg-open > /dev/null 2>&1; then
    xdg-open "https://github.com/settings/notifications" 2>/dev/null
elif command -v open > /dev/null 2>&1; then
    open "https://github.com/settings/notifications" 2>/dev/null
else
    echo "   Please manually open: https://github.com/settings/notifications"
fi

echo ""
echo "Press Enter when you've completed the notification settings..."
read -p ""

echo ""
echo "🌐 Opening Your Repository..."
echo "   📍 URL: https://github.com/HarryVonBot/TG-Mini-App"
echo ""
echo "📝 **On this page, please:**"
echo "   ✅ Click the 'Watch' button (top right)"
echo "   ✅ Select 'All Activity'"
echo "   ✅ Click 'Apply'"
echo ""

if command -v xdg-open > /dev/null 2>&1; then
    xdg-open "https://github.com/HarryVonBot/TG-Mini-App" 2>/dev/null
elif command -v open > /dev/null 2>&1; then
    open "https://github.com/HarryVonBot/TG-Mini-App" 2>/dev/null
else
    echo "   Please manually open: https://github.com/HarryVonBot/TG-Mini-App"
fi

echo ""
echo "Press Enter when you've set up repository watching..."
read -p ""

echo ""
echo "🌐 Opening Email Verification..."
echo "   📍 URL: https://github.com/settings/emails"
echo ""
echo "📝 **On this page, please:**"
echo "   ✅ Verify your email has a green checkmark"
echo "   ✅ If not verified, click 'Resend verification'"
echo ""

if command -v xdg-open > /dev/null 2>&1; then
    xdg-open "https://github.com/settings/emails" 2>/dev/null
elif command -v open > /dev/null 2>&1; then
    open "https://github.com/settings/emails" 2>/dev/null
else
    echo "   Please manually open: https://github.com/settings/emails"
fi

echo ""
echo "Press Enter when you've verified your email..."
read -p ""

echo ""
echo "🧪 **TESTING THE SETUP**"
echo ""
echo "Let's test the email notifications by triggering a workflow..."
echo ""

# Create a small test change
echo "# Email notification test - $(date)" >> /app/README.md

echo "📝 Making a small test change..."
echo "🔄 Running: git add README.md"
git add README.md

echo "🔄 Running: git commit -m 'Test: Email notifications setup'"
git commit -m "Test: Email notifications setup"

echo "🔄 Running: git push"
git push

echo ""
echo "✅ **SETUP COMPLETE!**"
echo ""
echo "📧 **What to expect:**"
echo "   ⏰ In 2-3 minutes: Check your email"
echo "   📨 You should receive: 'VonVault Quality Assurance workflow succeeded'"
echo "   📧 Future failures will trigger: 'VonVault Quality Assurance workflow failed'"
echo ""
echo "🎯 **Next time you commit broken code:**"
echo "   1. Pre-commit hook catches it locally (instant)"
echo "   2. If it somehow gets through: Email notification (2-3 minutes)"
echo "   3. You get exact error details in the email"
echo ""
echo "🚀 **You're now set up for professional development with instant feedback!**"