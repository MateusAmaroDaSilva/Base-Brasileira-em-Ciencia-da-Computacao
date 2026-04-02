#!/bin/bash
# Test runner script for Base Brasileira em Ciência da Computação backend tests
# Usage: ./run_tests.sh [mode] [options]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Default values
MODE=${1:-quick}
VERBOSE=${VERBOSE:-false}
WORKERS=${WORKERS:-1}

# Functions
write_header() {
    echo -e "\n${MAGENTA}======================================================================${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${MAGENTA}======================================================================${NC}\n"
}

write_status() {
    local text=$1
    local color=${2:-$CYAN}
    echo -e "${color}${text}${NC}"
}

write_error() {
    echo -e "${RED}❌ $1${NC}"
}

write_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check requirements
check_requirements() {
    write_status "🔍 Checking requirements..." "$CYAN"
    
    if ! command -v pytest &> /dev/null; then
        write_error "pytest not installed"
        echo "Run: pip install -r requirements-dev.txt"
        exit 1
    fi
    
    write_success "pytest found"
}

# Run tests function
run_tests() {
    local test_path=$1
    local description=$2
    
    write_header "$description"
    
    echo "Test path: $test_path"
    echo ""
    
    local args=("-v" "--tb=short")
    
    if [ "$VERBOSE" = true ]; then
        args+=("--tb=long")
    fi
    
    if [ "$WORKERS" -gt 1 ]; then
        args+=("-n" "$WORKERS")
    fi
    
    echo "Command: pytest ${args[@]} $test_path"
    echo ""
    
    pytest "${args[@]}" $test_path
    return $?
}

# Show coverage
show_coverage() {
    write_header "📊 Creating Coverage Report"
    
    write_status "Generating coverage report..." "$CYAN"
    
    pytest \
        --cov=app \
        --cov-report=html \
        --cov-report=term-missing \
        --cov-report=xml \
        tests/
    
    if [ $? -eq 0 ]; then
        write_success "Coverage report generated at: htmlcov/index.html"
    fi
    
    return $?
}

# Show menu
show_menu() {
    write_header "🧪 Test Runner Menu"
    echo "Available modes:"
    echo "  quick       - Unit tests only (fastest)"
    echo "  unit        - All unit tests"
    echo "  integration - Integration tests"
    echo "  e2e         - End-to-end tests (slow)"
    echo "  slow        - Slow tests only"
    echo "  all         - All tests"
    echo "  coverage    - All tests with coverage report"
    echo "  failing     - Re-run last failures"
    echo ""
}

# Main execution
write_header "🧪 Base Brasileira - Test Suite"
write_status "Mode: $MODE | Verbose: $VERBOSE | Workers: $WORKERS" "$CYAN"

check_requirements

exit_code=0

case $MODE in
    quick)
        run_tests "tests/unit" "⚡ Quick Test - Unit Tests Only"
        exit_code=$?
        ;;
    unit)
        run_tests "tests/unit -m unit" "📦 Unit Tests"
        exit_code=$?
        ;;
    integration)
        run_tests "tests/integration -m integration" "🔗 Integration Tests"
        exit_code=$?
        ;;
    e2e)
        run_tests "tests/e2e -m e2e" "🌐 End-to-End Tests"
        exit_code=$?
        ;;
    slow)
        run_tests "tests/e2e -m slow" "🐢 Slow Tests"
        exit_code=$?
        ;;
    all)
        write_header "🔍 Running ALL Tests"
        pytest tests/ -v --tb=short
        exit_code=$?
        ;;
    coverage)
        show_coverage
        exit_code=$?
        ;;
    failing)
        write_header "🔄 Re-running Failed Tests"
        pytest --lf -v
        exit_code=$?
        ;;
    menu)
        show_menu
        exit 0
        ;;
    *)
        write_error "Unknown mode: $MODE"
        show_menu
        exit 1
        ;;
esac

# Summary
echo ""
if [ $exit_code -eq 0 ]; then
    write_header "✅ All Tests Passed!"
else
    write_header "❌ Some Tests Failed"
fi

echo "Exit code: $exit_code"

# Show next steps
write_status "\nNext steps:" "$CYAN"
echo "  • View coverage report: open htmlcov/index.html"
echo "  • Run specific test: pytest tests/unit/test_elasticsearch_client.py"
echo "  • Debug test: pytest --pdb tests/unit/test_elasticsearch_client.py"
echo ""

exit $exit_code
