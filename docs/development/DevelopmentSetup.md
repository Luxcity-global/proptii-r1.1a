# Development Environment Setup

## Current Development Setup

### Dependencies

The Proptii application is built with the following core dependencies:

- React with TypeScript
- React Router for navigation
- MSAL (Microsoft Authentication Library) for Azure B2C authentication
- Tailwind CSS for styling
- Lucide React for icons
- Vite as the build tool

### Build Process

- The application is built using Vite
- Development server is started with `npm run dev`
- Production build is created with `npm run build`

### Environment Variables

The application uses the following environment variables:

- `VITE_AZURE_API_KEY`: API key for Azure AI Inference
- `VITE_AZURE_AD_TENANT_NAME`: Azure AD B2C tenant name

## Recommended Development Tools

### Code Quality Tools

#### ESLint

ESLint is recommended for static code analysis to identify problematic patterns.

Installation:
```bash
npm install --save-dev eslint eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

Configuration (`.eslintrc.js`):
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // Add custom rules here
  },
};
```

#### Prettier

Prettier is recommended for code formatting.

Installation:
```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

Configuration (`.prettierrc`):
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

#### Husky and lint-staged

Husky and lint-staged are recommended for pre-commit hooks.

Installation:
```bash
npm install --save-dev husky lint-staged
```

Configuration (package.json):
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "src/**/*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### Testing Framework

#### Jest and React Testing Library

Jest and React Testing Library are recommended for testing.

Installation:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-jest
```

Configuration (`jest.config.js`):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
```

Create `src/setupTests.ts`:
```typescript
import '@testing-library/jest-dom';
```

## Version Control Best Practices

### Branching Strategy

- `main`: Production-ready code
- `develop`: Development branch
- Feature branches: `feature/feature-name`
- Bug fix branches: `bugfix/bug-name`
- Release branches: `release/version-number`

### Commit Message Format

Follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Pull Request Process

1. Create a feature branch from `develop`
2. Make changes and commit
3. Push to the remote repository
4. Create a pull request to merge into `develop`
5. Request code review
6. Address review comments
7. Merge after approval

## Stability Checks

Before making any changes to the codebase, run the following checks:

1. **Build Check**:
   ```bash
   npm run build
   ```

2. **Lint Check**:
   ```bash
   npm run lint
   ```

3. **Type Check**:
   ```bash
   npm run typecheck
   ```

4. **Test Check**:
   ```bash
   npm run test
   ```

## Protected Authentication Elements

> **IMPORTANT**: The following authentication elements must be preserved:

1. `AuthContext.tsx` - Core authentication logic
2. `login()`, `logout()`, and `editProfile()` methods
3. Azure B2C integration in `authConfig.ts`
4. Authentication state management in `Referencing.tsx`
5. The event dispatch mechanism after successful login 