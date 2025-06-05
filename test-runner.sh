#!/bin/bash

# SERINA Test Runner Script
# Runs comprehensive test suite for the SERINA email assistant

set -e

echo "🧪 SERINA Test Suite Runner"
echo "=========================="

# Function to print colored output
print_status() {
    echo -e "\033[1;34m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

# Check if required commands exist
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is required but not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is required but not installed"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Setup backend testing environment
setup_backend() {
    print_status "Setting up backend test environment..."
    
    cd backend
    
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install -r requirements-test.txt
    
    cd ..
    print_success "Backend environment ready"
}

# Setup frontend testing environment
setup_frontend() {
    print_status "Setting up frontend test environment..."
    
    cd renderer
    npm install
    cd ..
    
    print_success "Frontend environment ready"
}

# Run backend tests
run_backend_tests() {
    print_status "Running backend tests..."
    
    cd backend
    source venv/bin/activate
    
    if [ "$1" == "--coverage" ]; then
        pytest --cov=. --cov-report=html --cov-report=term-missing -v
        print_success "Backend tests completed with coverage report"
        print_status "Coverage report available at: backend/htmlcov/index.html"
    else
        pytest -v
        print_success "Backend tests completed"
    fi
    
    cd ..
}

# Run frontend tests
run_frontend_tests() {
    print_status "Running frontend tests..."
    
    cd renderer
    
    if [ "$1" == "--coverage" ]; then
        npm run test:coverage
        print_success "Frontend tests completed with coverage report"
    else
        npm test
        print_success "Frontend tests completed"
    fi
    
    cd ..
}

# Run E2E tests
run_e2e_tests() {
    print_status "Running end-to-end tests..."
    
    # Check if Playwright is installed
    if ! npx playwright --version &> /dev/null; then
        print_status "Installing Playwright..."
        npx playwright install
    fi
    
    # Start services and run tests
    npm run test:e2e
    
    print_success "E2E tests completed"
}

# Main execution
main() {
    local run_coverage=false
    local test_type="all"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --coverage)
                run_coverage=true
                shift
                ;;
            --backend)
                test_type="backend"
                shift
                ;;
            --frontend)
                test_type="frontend"
                shift
                ;;
            --e2e)
                test_type="e2e"
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --coverage    Run tests with coverage reports"
                echo "  --backend     Run only backend tests"
                echo "  --frontend    Run only frontend tests"
                echo "  --e2e         Run only E2E tests"
                echo "  --help        Show this help message"
                exit 0
                ;;
            *)
                print_warning "Unknown option: $1"
                shift
                ;;
        esac
    done
    
    print_status "Starting SERINA test suite..."
    
    check_dependencies
    
    case $test_type in
        "backend")
            setup_backend
            if $run_coverage; then
                run_backend_tests --coverage
            else
                run_backend_tests
            fi
            ;;
        "frontend")
            setup_frontend
            if $run_coverage; then
                run_frontend_tests --coverage
            else
                run_frontend_tests
            fi
            ;;
        "e2e")
            setup_backend
            setup_frontend
            run_e2e_tests
            ;;
        "all")
            setup_backend
            setup_frontend
            
            if $run_coverage; then
                run_backend_tests --coverage
                run_frontend_tests --coverage
            else
                run_backend_tests
                run_frontend_tests
            fi
            
            run_e2e_tests
            ;;
    esac
    
    print_success "All tests completed successfully! 🎉"
    
    if $run_coverage; then
        print_status "Coverage reports:"
        print_status "  Backend: backend/htmlcov/index.html"
        print_status "  Frontend: renderer/coverage/index.html"
    fi
}

# Run main function with all arguments
main "$@"