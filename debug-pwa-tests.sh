#!/bin/bash
# debug-pwa-tests.sh
# ✅ BEST PRACTICE: Automated debugging script for systematic testing

echo "🔍 PWA Test Debugging Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run tests and capture output
run_test() {
    local test_file=$1
    local test_name=$2
    
    echo -e "${BLUE}Testing: ${test_name}${NC}"
    echo "----------------------------------------"
    
    if npm test -- "$test_file" --reporter=verbose; then
        echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED: ${test_name}${NC}"
        return 1
    fi
    echo ""
}

# Function to check if component exists
check_component() {
    local component_path=$1
    local component_name=$2
    
    if [ -f "$component_path" ]; then
        echo -e "${GREEN}✅ Component exists: ${component_name}${NC}"
        return 0
    else
        echo -e "${RED}❌ Component missing: ${component_name}${NC}"
        echo "   Expected at: $component_path"
        return 1
    fi
}

# Step 1: Check for required components
echo -e "${YELLOW}Step 1: Checking Component Files${NC}"
echo "================================"

check_component "src/components/BackgroundSyncSettings.tsx" "BackgroundSyncSettings"
check_component "src/components/PWAInstallButton.tsx" "PWAInstallButton"
check_component "src/components/PWAStatus.tsx" "PWAStatus"
check_component "src/hooks/useBackgroundSync.ts" "useBackgroundSync"
check_component "src/hooks/useOfflineSync.ts" "useOfflineSync"

echo ""

# Step 2: Run individual test files
echo -e "${YELLOW}Step 2: Running Individual Tests${NC}"
echo "================================"

# Component tests
run_test "tests/pwa/components/BackgroundSyncSettings.test.tsx" "BackgroundSyncSettings Component"
run_test "tests/pwa/components/PWAInstallButton.test.tsx" "PWAInstallButton Component"

# Hook tests
run_test "tests/pwa/hooks/useBackgroundSync.test.tsx" "useBackgroundSync Hook"
run_test "tests/pwa/hooks/useOfflineSync.test.tsx" "useOfflineSync Hook"

# Integration tests
run_test "tests/pwa/integration/PWAIntegration.test.tsx" "PWA Integration"

echo ""

# Step 3: Run all PWA tests
echo -e "${YELLOW}Step 3: Full PWA Test Suite${NC}"
echo "================================"

if npm test -- tests/pwa --reporter=verbose; then
    echo -e "${GREEN}🎉 ALL PWA TESTS PASSED!${NC}"
else
    echo -e "${RED}💥 SOME PWA TESTS FAILED${NC}"
    echo ""
    echo -e "${YELLOW}Common fixes to try:${NC}"
    echo "1. Check that all components have the required data-testid attributes"
    echo "2. Verify mock configurations match expected return types"
    echo "3. Ensure error handling returns correct values"
    echo "4. Check component import/export statements"
    echo ""
    echo -e "${BLUE}Run individual tests for detailed error messages${NC}"
fi

echo ""
echo -e "${YELLOW}Quick Debug Commands:${NC}"
echo "npm test -- tests/pwa/components/BackgroundSyncSettings.test.tsx --reporter=verbose"
echo "npm test -- tests/pwa/hooks/useBackgroundSync.test.tsx --reporter=verbose"
echo "npm test -- tests/pwa/hooks/useOfflineSync.test.tsx --reporter=verbose"
echo "npm test -- tests/pwa/integration/PWAIntegration.test.tsx --reporter=verbose" 