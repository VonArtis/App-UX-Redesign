#!/bin/bash
# Check if email notifications are working

echo "📧 VonVault Email Notification Status Checker"
echo "============================================"
echo ""

echo "🔍 **CHECKING YOUR CURRENT SETUP...**"
echo ""

# Check if git is configured with email
GIT_EMAIL=$(git config user.email 2>/dev/null)
if [ -n "$GIT_EMAIL" ]; then
    echo "✅ Git email configured: $GIT_EMAIL"
else
    echo "❌ Git email not configured"
    echo "   💡 Run: git config --global user.email 'your@email.com'"
fi

# Check if we have a remote repository
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -n "$REMOTE_URL" ]; then
    echo "✅ Git remote configured: $REMOTE_URL"
else
    echo "❌ Git remote not configured"
fi

# Check if we have GitHub Actions workflow
if [ -f "/app/.github/workflows/ci.yml" ]; then
    echo "✅ GitHub Actions workflow exists"
else
    echo "❌ GitHub Actions workflow missing"
fi

# Check recent commits
RECENT_COMMITS=$(git log --oneline -3 2>/dev/null)
if [ -n "$RECENT_COMMITS" ]; then
    echo "✅ Recent commits found"
    echo "   📊 Last 3 commits:"
    echo "$RECENT_COMMITS" | sed 's/^/      /'
else
    echo "❌ No recent commits found"
fi

echo ""
echo "📋 **MANUAL VERIFICATION CHECKLIST:**"
echo ""
echo "   Go to these URLs to verify your settings:"
echo ""
echo "   🔗 GitHub Notifications: https://github.com/settings/notifications"
echo "      ✅ Should see: 'Send email when workflow run fails' checked"
echo ""
echo "   🔗 Your Repository: https://github.com/HarryVonBot/TG-Mini-App"
echo "      ✅ Should see: 'Watch' button shows 'All Activity'"
echo ""
echo "   🔗 GitHub Actions: https://github.com/HarryVonBot/TG-Mini-App/actions"
echo "      ✅ Should see: Recent workflow runs with status"
echo ""
echo "   🔗 Email Settings: https://github.com/settings/emails"
echo "      ✅ Should see: Your email with green checkmark (verified)"
echo ""

echo "🧪 **TEST EMAIL NOTIFICATIONS:**"
echo ""
echo "   Run this to trigger a test workflow:"
echo "   📝 /app/scripts/interactive-email-setup.sh"
echo ""
echo "   Or manually:"
echo "   📝 echo '# test' >> README.md"
echo "   📝 git add README.md && git commit -m 'test' && git push"
echo ""

echo "⏰ **EXPECTED TIMELINE:**"
echo "   📤 Push code: Immediate"
echo "   🔄 Workflow starts: 30 seconds"
echo "   📧 Email sent: 2-3 minutes"
echo "   📨 Email received: 2-5 minutes total"
echo ""

echo "🎯 **SUCCESS CRITERIA:**"
echo "   📧 You receive email: 'VonVault Quality Assurance workflow succeeded'"
echo "   📧 Subject line includes: ✅ or ❌ depending on result"
echo "   📧 Email contains: Direct link to view details on GitHub"