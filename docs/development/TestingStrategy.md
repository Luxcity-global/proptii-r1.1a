# Proptii Testing Strategy

This document outlines the testing strategy for the Proptii application to ensure code quality, reliability, and maintainability.

## Testing Levels

### Unit Testing

Unit tests focus on testing individual components, functions, or modules in isolation.

**What to Test:**
- Utility functions
- Custom hooks
- Individual components
- State management logic

**Tools:**
- Jest
- React Testing Library
- @testing-library/react-hooks

**Example:**

```typescript
// Testing a utility function
describe('formatCurrency', () => {
  it('should format a number as GBP currency', () => {
    expect(formatCurrency(1000)).toBe('£1,000.00');
    expect(formatCurrency(1000.5)).toBe('£1,000.50');
    expect(formatCurrency(0)).toBe('£0.00');
  });
});

// Testing a component
describe('Button component', () => {
  it('should render with the correct label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button label="Click me" onClick={onClick} />);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing

Integration tests focus on testing the interaction between multiple components or modules.

**What to Test:**
- Component compositions
- Form submissions
- API interactions
- Navigation flows

**Tools:**
- Jest
- React Testing Library
- MSW (Mock Service Worker) for API mocking

**Example:**

```typescript
// Testing a form submission
describe('LoginForm', () => {
  it('should submit the form with user credentials', async () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123'
      });
    });
  });
});
```

### End-to-End Testing

End-to-end tests focus on testing the entire application from the user's perspective.

**What to Test:**
- Critical user flows
- Authentication
- Property search
- Referencing process

**Tools:**
- Cypress
- Playwright

**Example:**

```typescript
// Cypress test for login flow
describe('Login Flow', () => {
  it('should allow a user to log in', () => {
    cy.visit('/');
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="email-input"]').type('user@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="submit-button"]').click();
    cy.get('[data-testid="user-profile"]').should('be.visible');
  });
});
```

## Test Coverage

The goal is to achieve the following test coverage:

- **Unit Tests**: 80% coverage for utility functions and custom hooks
- **Component Tests**: 70% coverage for UI components
- **Integration Tests**: 60% coverage for critical user flows
- **End-to-End Tests**: Cover all critical user journeys

## Test Organization

Tests should be organized in a way that mirrors the structure of the source code:

```
proptii/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── ...
│   ├── utils/
│   │   ├── formatCurrency.ts
│   │   └── ...
│   └── ...
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── formatCurrency.test.ts
│   │   │   └── ...
│   │   └── ...
│   ├── integration/
│   │   ├── components/
│   │   │   ├── Button.test.tsx
│   │   │   └── ...
│   │   └── ...
│   └── e2e/
│       ├── login.spec.ts
│       ├── search.spec.ts
│       └── ...
└── ...
```

## Testing Best Practices

### General

- Write tests before or alongside code (TDD/BDD approach)
- Keep tests simple and focused
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Avoid testing implementation details
- Test behavior, not implementation

### React Components

- Test what the user sees and interacts with
- Use data-testid attributes for test selectors
- Test accessibility
- Test different states (loading, error, success)
- Test user interactions

### Async Code

- Use async/await for asynchronous tests
- Use waitFor for waiting on async operations
- Mock API calls using MSW or Jest mocks
- Test error handling

### Mocking

- Mock external dependencies
- Use Jest's mock functions for callbacks
- Use MSW for API mocking
- Keep mocks as simple as possible

## Continuous Integration

Tests should be run as part of the CI/CD pipeline:

1. Run unit and integration tests on every pull request
2. Run end-to-end tests on merge to main branch
3. Generate and publish test coverage reports

## Test Automation

Set up automated testing workflows:

```yaml
# Example GitHub Actions workflow
name: Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit and integration tests
        run: npm test
      - name: Run end-to-end tests
        run: npm run test:e2e
      - name: Upload coverage reports
        uses: codecov/codecov-action@v2
```

## Testing Specific Features

### Authentication

- Test login flow
- Test logout flow
- Test authentication state persistence
- Test protected routes

### Property Search

- Test search input
- Test search results display
- Test error handling
- Test loading states

### Referencing Process

- Test form validation
- Test multi-step navigation
- Test data persistence between steps
- Test form submission

## Debugging Tests

Tips for debugging failing tests:

1. Use `screen.debug()` to see the rendered output
2. Use `console.log` for debugging variables
3. Use the `--watch` flag for interactive debugging
4. Use browser devtools for end-to-end tests

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/guides/overview/why-cypress)
- [MSW Documentation](https://mswjs.io/docs/) 