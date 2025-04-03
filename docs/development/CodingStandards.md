# Proptii Coding Standards and Best Practices

This document outlines the coding standards and best practices for the Proptii application to ensure consistency and maintainability across the codebase.

## General Guidelines

- Write clean, readable, and self-documenting code
- Follow the DRY (Don't Repeat Yourself) principle
- Keep functions and components small and focused on a single responsibility
- Use meaningful variable and function names
- Add comments for complex logic, but prefer self-documenting code
- Write tests for critical functionality

## TypeScript Guidelines

### Type Definitions

- Use TypeScript interfaces and types for all data structures
- Place shared types in the `src/types` directory
- Use specific types instead of `any` whenever possible
- Use union types for variables that can have multiple types

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Avoid
const user: any = { id: '123', name: 'John', email: 'john@example.com' };
```

### Type Assertions

- Use type assertions sparingly and only when necessary
- Prefer type guards over type assertions

```typescript
// Good
if (typeof value === 'string') {
  // value is now typed as string
}

// Avoid when possible
const value = someValue as string;
```

## React Guidelines

### Component Structure

- Use functional components with hooks instead of class components
- Keep components small and focused on a single responsibility
- Extract reusable logic into custom hooks
- Use the appropriate component organization:

```typescript
// Component structure
import React, { useState, useEffect } from 'react';
import { SomeType } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ComponentProps {
  prop1: string;
  prop2: number;
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // State hooks
  const [state, setState] = useState<SomeType | null>(null);
  
  // Custom hooks
  const { user } = useAuth();
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Helper functions
  const formatData = (data: SomeType) => {
    // Formatting logic
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default Component;
```

### Props

- Define prop types using TypeScript interfaces
- Use destructuring for props
- Provide default values for optional props

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}) => {
  // Component logic
};
```

### State Management

- Use React's built-in state management (useState, useReducer) for component-level state
- Use Context API for global state that needs to be accessed by multiple components
- Consider using a state management library for complex state logic

```typescript
// Component-level state
const [isLoading, setIsLoading] = useState(false);

// Complex state with useReducer
const [state, dispatch] = useReducer(reducer, initialState);

// Global state with Context API
const { user, login, logout } = useAuth();
```

## Styling Guidelines

### Tailwind CSS

- Use Tailwind CSS utility classes for styling
- Follow the mobile-first approach for responsive design
- Extract common patterns into reusable components
- Use consistent spacing and sizing

```jsx
// Good
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Click me
</button>

// Avoid inline styles
<button style={{ padding: '0.5rem 1rem', backgroundColor: 'blue', color: 'white' }}>
  Click me
</button>
```

### Custom Styles

- Place global styles in the `src/styles` directory
- Use CSS modules for component-specific styles when Tailwind is not sufficient
- Follow BEM (Block Element Modifier) naming convention for custom CSS classes

## File Organization

### Naming Conventions

- Use PascalCase for component files and directories: `Button.tsx`, `UserProfile.tsx`
- Use camelCase for utility files: `formatDate.ts`, `useAuth.ts`
- Use kebab-case for CSS files: `button-styles.css`
- Use descriptive names that reflect the purpose of the file

### Import Order

- External libraries first
- Internal modules next
- Relative imports last
- Separate import groups with a blank line

```typescript
// External libraries
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Internal modules
import { User } from '../types';
import { useAuth } from '../hooks/useAuth';

// Relative imports
import Button from './Button';
import './styles.css';
```

## Error Handling

- Use try-catch blocks for error handling in async functions
- Display user-friendly error messages
- Log errors for debugging purposes
- Handle edge cases and provide fallbacks

```typescript
const fetchData = async () => {
  try {
    setIsLoading(true);
    const response = await api.getData();
    setData(response);
  } catch (error) {
    console.error('Error fetching data:', error);
    setError('Failed to load data. Please try again later.');
  } finally {
    setIsLoading(false);
  }
};
```

## Performance Optimization

- Use React.memo for expensive components
- Use useCallback for functions passed as props
- Use useMemo for expensive calculations
- Optimize re-renders by using proper dependency arrays in hooks
- Implement virtualization for long lists

```typescript
// Memoize expensive components
const MemoizedComponent = React.memo(Component);

// Memoize callback functions
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);

// Memoize expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

## Testing

- Write unit tests for utility functions
- Write component tests for UI components
- Write integration tests for critical user flows
- Use meaningful test descriptions
- Follow the AAA (Arrange, Act, Assert) pattern

```typescript
describe('Button component', () => {
  it('should call onClick when clicked', () => {
    // Arrange
    const onClick = jest.fn();
    render(<Button label="Click me" onClick={onClick} />);
    
    // Act
    fireEvent.click(screen.getByText('Click me'));
    
    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

## Git Workflow

- Write clear and descriptive commit messages
- Use conventional commit format: `type(scope): message`
- Keep commits small and focused
- Create pull requests for code reviews
- Squash commits before merging

## Documentation

- Document complex functions and components
- Update documentation when making significant changes
- Use JSDoc comments for function documentation

```typescript
/**
 * Formats a date string into a human-readable format
 * @param dateString - The date string to format
 * @param format - The desired output format (optional)
 * @returns The formatted date string
 */
const formatDate = (dateString: string, format?: string): string => {
  // Implementation
};
```

## Accessibility

- Use semantic HTML elements
- Add appropriate ARIA attributes
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Test with screen readers

```jsx
// Good
<button 
  aria-label="Close dialog"
  onClick={onClose}
>
  <CloseIcon />
</button>

// Avoid
<div 
  onClick={onClose}
>
  <CloseIcon />
</div>
```

## Security

- Validate user input
- Sanitize data before rendering
- Use HTTPS for all API calls
- Implement proper authentication and authorization
- Be cautious with third-party libraries

## Performance Budgets

- Keep bundle size under 500KB (gzipped)
- Aim for a First Contentful Paint under 1.5s
- Aim for a Time to Interactive under 3.5s
- Optimize images and assets
- Implement code splitting for large components 