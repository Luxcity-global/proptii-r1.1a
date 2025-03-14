# Proptii Documentation

This directory contains documentation for the Proptii application, including component maps, API interfaces, development setup, and refactoring plans.

## Directory Structure

- **component-map/**: Contains documentation about the application's component structure
  - `ComponentMap.md`: Detailed map of all components and their relationships

- **api-interfaces/**: Contains TypeScript interfaces for API calls
  - `ApiInterfaces.ts`: TypeScript interfaces for all API calls

- **development/**: Contains documentation about the development environment
  - `DevelopmentSetup.md`: Setup instructions for the development environment

- **refactoring/**: Contains plans for refactoring components
  - `ReferencingModalRefactoring.md`: Plan for refactoring the ReferencingModal component

## Getting Started

1. Review the `ComponentMap.md` to understand the application structure
2. Set up your development environment according to `DevelopmentSetup.md`
3. Familiarize yourself with the API interfaces in `ApiInterfaces.ts`
4. Follow the refactoring plans in the `refactoring/` directory

## Important Notes

### Protected Authentication Elements

> **IMPORTANT**: The following authentication elements must be preserved:

1. `AuthContext.tsx` - Core authentication logic
2. `login()`, `logout()`, and `editProfile()` methods
3. Azure B2C integration in `authConfig.ts`
4. Authentication state management in `Referencing.tsx`
5. The event dispatch mechanism after successful login

### Stability Checks

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

## Next Steps

1. Create the folder structure for the new components
2. Implement the reusable UI components
3. Create skeleton implementations of the form section components
4. Implement the sidebar component 