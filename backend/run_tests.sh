#!/bin/bash
# Test runner script for Form Check Backend

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Form Check Backend Test Suite ===${NC}\n"

# Activate virtual environment
if [ -d "venv" ]; then
    echo -e "${GREEN}Activating virtual environment...${NC}"
    source venv/bin/activate
else
    echo -e "${RED}Error: Virtual environment not found${NC}"
    echo "Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Parse command line arguments
case "${1:-all}" in
    all)
        echo -e "${GREEN}Running all tests with coverage...${NC}\n"
        pytest
        ;;
    unit)
        echo -e "${GREEN}Running unit tests only...${NC}\n"
        pytest -m unit
        ;;
    integration)
        echo -e "${GREEN}Running integration tests only...${NC}\n"
        pytest -m integration
        ;;
    coverage)
        echo -e "${GREEN}Generating HTML coverage report...${NC}\n"
        pytest --cov-report=html
        echo -e "\n${GREEN}Opening coverage report...${NC}"
        open htmlcov/index.html || xdg-open htmlcov/index.html || echo "Open htmlcov/index.html in your browser"
        ;;
    watch)
        echo -e "${GREEN}Running tests in watch mode...${NC}\n"
        echo "Note: Install pytest-watch with: pip install pytest-watch"
        ptw
        ;;
    fast)
        echo -e "${GREEN}Running tests without coverage (faster)...${NC}\n"
        pytest --no-cov
        ;;
    verbose)
        echo -e "${GREEN}Running tests with verbose output...${NC}\n"
        pytest -vv
        ;;
    *)
        echo -e "${BLUE}Usage: ./run_tests.sh [option]${NC}"
        echo ""
        echo "Options:"
        echo "  all         - Run all tests with coverage (default)"
        echo "  unit        - Run only unit tests"
        echo "  integration - Run only integration tests"
        echo "  coverage    - Generate and open HTML coverage report"
        echo "  fast        - Run tests without coverage"
        echo "  verbose     - Run tests with verbose output"
        echo "  watch       - Run tests in watch mode (requires pytest-watch)"
        echo ""
        echo "Examples:"
        echo "  ./run_tests.sh"
        echo "  ./run_tests.sh unit"
        echo "  ./run_tests.sh coverage"
        exit 0
        ;;
esac

echo -e "\n${GREEN}✓ Done!${NC}"
