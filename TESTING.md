# SERINA Testing Guide

This document provides comprehensive information about the testing infrastructure for the SERINA email assistant application.

## Overview

SERINA has a multi-layered testing approach:

- **Unit Tests**: Test individual components and services in isolation
- **Integration Tests**: Test API endpoints and service interactions  
- **Component Tests**: Test React components with user interactions
- **End-to-End Tests**: Test complete user workflows

## Test Structure

```
tests/
├── backend/
│   ├── unit/                 # Unit tests for backend services
│   ├── integration/          # API integration tests
│   └── fixtures/             # Test data and utilities
├── frontend/
│   └── src/test/             # React component tests
└── e2e/                      # End-to-end tests
```

## Backend Testing (Python/FastAPI)

### Technology Stack
- **pytest**: Test framework
- **pytest-asyncio**: Async test support
- **pytest-cov**: Coverage reporting
- **httpx**: HTTP client for API testing

### Running Backend Tests

```bash
# Run all backend tests
cd backend
source venv/bin/activate
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/unit/test_config_service.py

# Run specific test
pytest tests/unit/test_config_service.py::TestConfigService::test_load_config
```

### Test Categories

#### Unit Tests
- `test_config_service.py`: Configuration management
- `test_reminder_service.py`: Reminder CRUD operations
- `test_llm_service.py`: LLM integration and response parsing
- `test_email_service.py`: Email models and services

#### Integration Tests
- `test_api.py`: FastAPI endpoint testing
- WebSocket communication testing
- Database integration testing

### Key Features Tested

#### Config Service
- ✅ Configuration loading/saving
- ✅ Encryption/decryption
- ✅ Schema validation
- ✅ Error handling

#### Reminder Service
- ✅ CRUD operations
- ✅ Due reminder checking
- ✅ Data validation
- ✅ Database interactions

#### LLM Service
- ✅ Multiple provider support (OpenAI, Anthropic)
- ✅ Response parsing
- ✅ Error handling
- ✅ Configuration management

#### Email Service
- ✅ Email data models
- ✅ Microsoft Graph integration
- ✅ IMAP service framework
- ✅ Service factory pattern

## Frontend Testing (React/Vite)

### Technology Stack
- **Vitest**: Fast test framework
- **Testing Library**: Component testing utilities
- **jsdom**: DOM environment simulation

### Running Frontend Tests

```bash
# Run all frontend tests
cd renderer
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### Test Categories

#### Component Tests
- `App.test.jsx`: Main application navigation
- `EmailList.test.jsx`: Email list functionality
- `ReminderForm.test.jsx`: Reminder creation/editing

#### Service Tests
- `llmService.test.js`: WebSocket communication

### Key Features Tested

#### App Component
- ✅ Navigation between pages
- ✅ Window controls (minimize, maximize, close)
- ✅ Responsive design
- ✅ Error boundaries

#### EmailList Component
- ✅ Email rendering
- ✅ Selection handling
- ✅ Loading/error states
- ✅ Filtering and sorting

#### ReminderForm Component
- ✅ Form validation
- ✅ Date/time handling
- ✅ Submission handling
- ✅ Error states

## End-to-End Testing (Playwright)

### Technology Stack
- **Playwright**: Cross-browser E2E testing
- **Multiple browsers**: Chromium, Firefox, WebKit

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/app-flow.spec.js

# Run in headed mode (see browser)
npx playwright test --headed

# Run with debugging
npx playwright test --debug
```

### Test Scenarios

#### App Flow Tests
- ✅ Application loading
- ✅ Navigation between pages
- ✅ Settings configuration
- ✅ Responsive design
- ✅ Error handling
- ✅ Accessibility checks

#### Reminder Workflow Tests
- ✅ Create reminders
- ✅ Edit reminders
- ✅ Delete reminders
- ✅ Mark as completed
- ✅ Filter by status
- ✅ Form validation
- ✅ Search and sort

## Test Automation

### Continuous Integration

GitHub Actions workflow (`.github/workflows/test.yml`) runs:

1. **Backend Tests**: Python 3.9-3.12 matrix
2. **Frontend Tests**: Node.js 18-20 matrix  
3. **E2E Tests**: Full integration testing
4. **Coverage Reports**: Codecov integration

### Test Runner Script

Use the provided test runner for local development:

```bash
# Run all tests
./test-runner.sh

# Run with coverage
./test-runner.sh --coverage

# Run specific test suite
./test-runner.sh --backend
./test-runner.sh --frontend
./test-runner.sh --e2e

# Show help
./test-runner.sh --help
```

## Coverage Goals

- **Backend**: >90% code coverage
- **Frontend**: >85% code coverage
- **Critical paths**: 100% coverage

## Best Practices

### Writing Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use descriptive names**: Test names should explain what is being tested
3. **Test behavior, not implementation**: Focus on what the code does, not how
4. **Keep tests isolated**: Each test should be independent
5. **Use fixtures**: Share common test data through fixtures

### Mock Strategy

- **External APIs**: Always mock external service calls
- **Database**: Use in-memory databases for testing
- **File system**: Mock file operations
- **Time**: Mock datetime for time-dependent tests

### Test Data

- Use factories for complex test data
- Keep test data minimal but realistic
- Use meaningful names for test data

## Debugging Tests

### Backend
```bash
# Run with verbose output
pytest -v -s

# Debug specific test
pytest --pdb tests/unit/test_config_service.py::test_load_config

# Print statements
pytest -s
```

### Frontend
```bash
# Run in watch mode with debugging
npm run test:watch

# Use debugger statements in tests
# debugger; // Add this line in your test
```

### E2E
```bash
# Run with browser UI
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Record a test
npx playwright codegen localhost:5173
```

## Performance Testing

### Load Testing
Consider adding:
- API endpoint load testing
- WebSocket connection limits
- Database query performance

### Frontend Performance
- Component render time testing
- Memory leak detection
- Bundle size monitoring

## Security Testing

### Backend Security
- Input validation testing
- Authentication/authorization testing
- SQL injection prevention
- XSS prevention

### Frontend Security
- CSP compliance testing
- Input sanitization testing
- Local storage security

## Contributing to Tests

When adding new features:

1. **Write tests first** (TDD approach recommended)
2. **Add tests for all new functions/components**
3. **Update existing tests** when changing behavior
4. **Ensure all tests pass** before submitting PR
5. **Maintain coverage goals**

## Test Maintenance

### Regular Tasks
- Update test dependencies monthly
- Review and update test data quarterly
- Archive obsolete tests
- Performance test review

### Monitoring
- Track test execution time
- Monitor flaky tests
- Review coverage trends
- Update browser versions for E2E tests

## Troubleshooting

### Common Issues

#### Backend Tests
- **Import errors**: Check Python path and virtual environment
- **Database errors**: Ensure test database is clean
- **Async errors**: Use proper pytest-asyncio markers

#### Frontend Tests
- **Component not rendering**: Check test setup and mocks
- **Event handlers not firing**: Use proper Testing Library methods
- **Async component issues**: Use waitFor() appropriately

#### E2E Tests
- **Timeouts**: Increase timeout or add explicit waits
- **Element not found**: Check selectors and page state
- **Browser launch issues**: Update Playwright browsers

### Getting Help

1. Check test output carefully
2. Review relevant documentation
3. Check existing similar tests
4. Run tests in isolation to identify issues
5. Use debugging tools and breakpoints

---

This testing infrastructure ensures SERINA maintains high quality and reliability across all components and user workflows.