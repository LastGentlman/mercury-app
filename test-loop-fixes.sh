#!/bin/bash

# Test script for loop prevention fixes
echo "🧪 Running Loop Prevention Tests"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run tests and show results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${YELLOW}Running: $test_name${NC}"
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        return 1
    fi
}

# Track test results
total_tests=0
passed_tests=0

# Run Redirect Manager Tests
run_test "Redirect Manager Tests" "npm run test tests/utils/redirectManager.test.ts"
if [ $? -eq 0 ]; then
    ((passed_tests++))
fi
((total_tests++))

# Run CSRF Hook Tests
run_test "CSRF Hook Tests" "npm run test tests/hooks/useCSRF.test.tsx"
if [ $? -eq 0 ]; then
    ((passed_tests++))
fi
((total_tests++))

# Run Dashboard Stats Tests
run_test "Dashboard Stats Hook Tests" "npm run test tests/hooks/useDashboardStats.test.tsx"
if [ $? -eq 0 ]; then
    ((passed_tests++))
fi
((total_tests++))

# Run Orders Hook Tests
run_test "Orders Hook Tests" "npm run test tests/hooks/useOrders.test.tsx"
if [ $? -eq 0 ]; then
    ((passed_tests++))
fi
((total_tests++))

# Run Login Flow Integration Tests
run_test "Login Flow Integration Tests" "npm run test tests/integration/login-flow.test.tsx"
if [ $? -eq 0 ]; then
    ((passed_tests++))
fi
((total_tests++))

# Run Loop Prevention Integration Tests
run_test "Loop Prevention Integration Tests" "npm run test tests/integration/loop-prevention.test.tsx"
if [ $? -eq 0 ]; then
    ((passed_tests++))
fi
((total_tests++))

# Run Backend Dashboard Tests
echo -e "\n${YELLOW}Running Backend Dashboard Tests${NC}"
echo "Command: cd ../Backend && npm test tests/dashboard.test.ts"
echo "----------------------------------------"
cd ../Backend
if npm test tests/dashboard.test.ts; then
    echo -e "${GREEN}✅ Backend Dashboard Tests PASSED${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ Backend Dashboard Tests FAILED${NC}"
fi
cd ../mercury-app
((total_tests++))

# Summary
echo -e "\n${YELLOW}Test Summary${NC}"
echo "============="
echo -e "Total Tests: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$((total_tests - passed_tests))${NC}"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Loop prevention fixes are working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi
