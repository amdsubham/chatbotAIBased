#!/bin/bash

# =========================================
# Deploy Enhanced AI Error Analysis
# =========================================

set -e  # Exit on error

echo "🚀 Deploying Enhanced AI Error Analysis to Railway..."
echo ""

# Check if we're in the right directory
if [ ! -f "endpoints/ai/generate-response_POST.ts" ]; then
    echo "❌ Error: Must run from 'Chatbot AusPost AI Support System' directory"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain endpoints/ai/generate-response_POST.ts)" ]; then
    echo "📝 Changes detected in generate-response_POST.ts"
    echo ""

    # Show the changes
    echo "📋 Changes to be deployed:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    git diff endpoints/ai/generate-response_POST.ts --stat
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Confirm deployment
    read -p "🤔 Deploy these changes to Railway? (y/n) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 0
    fi

    echo ""
    echo "✅ Proceeding with deployment..."
    echo ""

    # Stage the changes
    echo "📦 Staging changes..."
    git add endpoints/ai/generate-response_POST.ts

    # Create commit
    echo "💾 Creating commit..."
    git commit -m "feat: enhance AI prompt for Australia Post error analysis

- Add specialized role for Australia Post shipping system
- Include error analysis expertise section
- Add common error types reference
- Enhance response requirements with data-driven approach
- Add detailed analysis instructions for order errors

This enables the AI to provide specific, actionable debugging
help by analyzing error messages alongside complete order data."

    echo "✅ Commit created"
    echo ""

    # Push to origin
    echo "🚢 Pushing to Railway..."
    git push origin main

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Deployment initiated!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔍 Next steps:"
    echo "1. Monitor deployment at: https://railway.app"
    echo "2. Wait 2-3 minutes for deployment to complete"
    echo "3. Run: ./verify-deployment.sh (to test)"
    echo ""
    echo "📊 Check deployment status:"
    echo "   railway logs --follow"
    echo ""

else
    echo "ℹ️  No changes to deploy"
    echo ""
    echo "Current status:"
    git status endpoints/ai/generate-response_POST.ts
    echo ""
    echo "To see what was previously deployed:"
    git log -1 --oneline endpoints/ai/generate-response_POST.ts
fi

echo "✨ Done!"
