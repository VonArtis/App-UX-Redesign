#!/bin/bash
# VonVault Email Notification Setup Guide

echo "📧 Setting Up Email Notifications for VonVault CI/CD"
echo "================================================="
echo ""

echo "🎯 **GOAL: Get instant email alerts when builds fail**"
echo ""

echo "📋 **STEP 1: GitHub Account Email Settings**"
echo "   1. Open: https://github.com/settings/notifications"
echo "   2. In the 'Email notification preferences' section:"
echo "      ✅ Check 'Send me email notifications'"
echo "      ✅ Check 'Comments on Issues and Pull Requests'"
echo "      ✅ Check 'Pull Request reviews'"
echo ""

echo "📋 **STEP 2: GitHub Actions Notifications**"
echo "   1. Scroll down to 'Actions' section"
echo "   2. Check these boxes:"
echo "      ✅ 'Notify me on email for failed workflows in repositories I own'"
echo "      ✅ 'Notify me on email for failed workflows in repositories I watch'"
echo "      ✅ 'Send me email summaries'"
echo ""

echo "📋 **STEP 3: Repository-Specific Settings**"
echo "   1. Go to your repo: https://github.com/HarryVonBot/TG-Mini-App"
echo "   2. Click 'Watch' button (top right)"
echo "   3. Select 'All Activity'"
echo "   4. Click 'Apply'"
echo ""

echo "📋 **STEP 4: Verify Email Address**"
echo "   1. Go to: https://github.com/settings/emails"
echo "   2. Make sure your email is verified (green checkmark)"
echo "   3. If not verified, click 'Resend verification email'"
echo ""

echo "📋 **STEP 5: Test the Setup**"
echo "   1. Make a small change to trigger the workflow"
echo "   2. Push the change"
echo "   3. Check your email in 2-3 minutes"
echo ""

echo "✅ **EXPECTED EMAILS:**"
echo "   📧 Subject: '✅ VonVault Quality Assurance workflow succeeded'"
echo "   📧 Subject: '❌ VonVault Quality Assurance workflow failed'"
echo "   📧 Subject: '🚀 VonVault deployed successfully'"
echo ""

echo "🎯 **RESULT: You'll get email within 2-3 minutes of any build issue!**"