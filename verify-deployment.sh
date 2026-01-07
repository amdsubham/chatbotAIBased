#!/bin/bash

# =========================================
# Verify Enhanced AI Deployment
# =========================================

echo "🔍 Verifying Enhanced AI Error Analysis Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not installed${NC}"
    echo "Install with: npm i -g @railway/cli"
    echo "Or check manually at: https://railway.app"
    echo ""
fi

# Function to check deployment
check_deployment() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 DEPLOYMENT VERIFICATION CHECKLIST"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # 1. Check git status
    echo "1️⃣  Checking Git Status..."
    if [ -z "$(git status --porcelain endpoints/ai/generate-response_POST.ts)" ]; then
        echo -e "   ${GREEN}✅ Changes committed${NC}"
    else
        echo -e "   ${RED}❌ Uncommitted changes found${NC}"
    fi
    echo ""

    # 2. Check last commit
    echo "2️⃣  Last Commit:"
    git log -1 --oneline endpoints/ai/generate-response_POST.ts
    echo ""

    # 3. Check Railway status (if CLI available)
    if command -v railway &> /dev/null; then
        echo "3️⃣  Railway Deployment Status:"
        railway status 2>/dev/null || echo "   Run 'railway link' to connect to project"
        echo ""
    fi

    # 4. Manual verification checklist
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧪 MANUAL TESTING CHECKLIST"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Please verify the following manually:"
    echo ""
    echo "[ ] 1. Railway Dashboard"
    echo "       → Go to: https://railway.app"
    echo "       → Check: Deployment shows 'Active'"
    echo "       → Verify: No errors in logs"
    echo ""
    echo "[ ] 2. Test Name Length Error"
    echo "       → Create order with name > 40 chars"
    echo "       → Generate label (will fail)"
    echo "       → Click 'Start Chatting'"
    echo "       → AI should identify exact character count"
    echo "       → AI should suggest specific shortened name"
    echo ""
    echo "[ ] 3. Test Address Validation Error"
    echo "       → Create order with invalid suburb/postcode"
    echo "       → Generate label (will fail)"
    echo "       → Click 'Start Chatting'"
    echo "       → AI should identify specific address field"
    echo "       → AI should suggest correct address"
    echo ""
    echo "[ ] 4. Test Non-Error Question"
    echo "       → Open chatbot normally (not via error)"
    echo "       → Ask general question"
    echo "       → AI should respond normally"
    echo "       → Confirms backward compatibility"
    echo ""
    echo "[ ] 5. Check Console Logs"
    echo "       → Browser DevTools → Console"
    echo "       → Look for: '📦 Enriched Error Context:'"
    echo "       → Verify order data is included"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Function to show example test
show_test_example() {
    echo "💡 EXAMPLE TEST SCENARIO"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Test Name: Long Customer Name Error"
    echo ""
    echo "Setup:"
    echo "  1. Create test order in your app"
    echo "  2. Set customer name to:"
    echo "     'kelly gustavsson (crystalhealinggemstonesstore)'"
    echo "     (This is 52 characters)"
    echo ""
    echo "Expected Error:"
    echo "  'Order [ID]: Name longer than 40 characters: kelly gustavsson...'"
    echo ""
    echo "Expected AI Response:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "I found the issue with Order #[ID]!"
    echo ""
    echo "**Problem:** The customer name"
    echo "'kelly gustavsson (crystalhealinggemstonesstore)'"
    echo "is 52 characters, but Australia Post requires"
    echo "40 characters or less."
    echo ""
    echo "**Solution:**"
    echo "1. Edit the order's shipping address"
    echo "2. Change name to: 'kelly gustavsson' (18 chars)"
    echo "3. Move business name to Company field"
    echo "4. Save and regenerate the label"
    echo ""
    echo "Everything else looks perfect! ✓"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Success Indicators:"
    echo "  • AI mentions exact character count (52)"
    echo "  • AI references 40 character limit"
    echo "  • AI suggests specific shortened name"
    echo "  • AI explains why (Australia Post requirement)"
    echo "  • AI provides step-by-step solution"
    echo ""
}

# Function to check logs
check_logs() {
    echo "📜 CHECKING RECENT LOGS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if command -v railway &> /dev/null; then
        echo "Fetching recent logs from Railway..."
        railway logs --limit 20 2>/dev/null || {
            echo "Run 'railway link' to connect to project"
        }
    else
        echo "Install Railway CLI to view logs automatically:"
        echo "  npm i -g @railway/cli"
        echo ""
        echo "Or view logs at: https://railway.app"
    fi
    echo ""
}

# Main execution
main() {
    check_deployment

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    read -p "📖 Show example test scenario? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        show_test_example
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    read -p "📜 Check Railway logs? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        check_logs
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✨ VERIFICATION COMPLETE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 Next Steps:"
    echo ""
    echo "1. Complete the manual testing checklist above"
    echo "2. Monitor for 24 hours to track improvement"
    echo "3. Document results using template in DEPLOY_TO_RAILWAY.md"
    echo ""
    echo "📞 Need Help?"
    echo "  • Review: DEPLOY_TO_RAILWAY.md"
    echo "  • Check: CHATBOT_ERROR_INTEGRATION.md (in main app)"
    echo "  • Logs: railway logs --follow"
    echo ""
}

# Run main function
main
