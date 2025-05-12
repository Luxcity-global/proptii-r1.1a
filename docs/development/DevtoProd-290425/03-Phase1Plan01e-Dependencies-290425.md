# Project Dependencies Documentation

## Core Dependencies

### Production Dependencies

#### Framework & Build Tools
- **vite**: Frontend build tool and development server
- **@vitejs/plugin-react**: React plugin for Vite
- **typescript**: TypeScript language support
- **react**: UI library
- **react-dom**: React DOM rendering

#### Routing & State Management
- **react-router-dom**: Client-side routing
- **@reduxjs/toolkit**: State management
- **react-redux**: React bindings for Redux

#### Authentication & Security
- **@azure/msal-browser**: Microsoft Authentication Library
- **@azure/msal-react**: React wrapper for MSAL
- **jwt-decode**: JWT token decoder

#### UI Components & Styling
- **@mui/material**: Material-UI components
- **@mui/icons-material**: Material icons
- **@emotion/react**: CSS-in-JS styling
- **@emotion/styled**: Styled components
- **tailwindcss**: Utility-first CSS framework

#### Data Handling & Forms
- **axios**: HTTP client
- **react-hook-form**: Form handling
- **yup**: Form validation
- **date-fns**: Date manipulation

#### Performance & Optimization
- **@vitejs/plugin-react-swc**: Fast React refresh
- **react-query**: Data fetching and caching
- **web-vitals**: Performance monitoring

### Development Dependencies

#### Build & Compilation
- **@types/react**: React type definitions
- **@types/react-dom**: React DOM type definitions
- **@typescript-eslint/eslint-plugin**: TypeScript ESLint plugin
- **@typescript-eslint/parser**: TypeScript ESLint parser

#### Testing
- **@testing-library/react**: React testing utilities
- **@testing-library/jest-dom**: Jest DOM testing utilities
- **vitest**: Test runner
- **jsdom**: DOM environment for testing

#### Code Quality
- **eslint**: JavaScript/TypeScript linter
- **prettier**: Code formatter
- **husky**: Git hooks
- **lint-staged**: Staged files linter

#### Development Tools
- **@azure/static-web-apps-cli**: Azure Static Web Apps CLI
- **concurrently**: Run multiple commands concurrently
- **cross-env**: Cross-platform environment variables

## Version Management

### Version Update Strategy
1. **Major Updates**: Scheduled with sprint planning
2. **Minor Updates**: Monthly security reviews
3. **Patch Updates**: Weekly automated checks

### Update Process
1. Run `npm outdated` to check for updates
2. Update packages in batches by type:
   ```bash
   # Update development dependencies
   npm update --save-dev

   # Update production dependencies
   npm update --save
   ```
3. Test thoroughly after updates

## Security Considerations

### Dependency Scanning
- Regular vulnerability scanning with `npm audit`
- Automated security updates with Dependabot
- Manual review of security advisories

### Version Pinning
- Production dependencies use exact versions
- Development dependencies use caret ranges
- Lock file committed to repository

## Performance Impact

### Bundle Size Optimization
- Tree-shaking enabled
- Code splitting configured
- Dynamic imports for large dependencies

### Development Performance
- Fast refresh enabled
- Build caching implemented
- Optimized development server configuration

## Troubleshooting

### Common Issues
1. **Peer Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Version Conflicts**
   ```bash
   npm dedupe
   ```

3. **Cache Issues**
   ```bash
   npm cache clean --force
   ```

## Adding New Dependencies

### Process
1. Evaluate necessity and alternatives
2. Check bundle size impact
3. Verify license compatibility
4. Test in development environment
5. Document in this file

### Documentation Template
```markdown
### [Package Name]
- **Version**: x.x.x
- **Purpose**: Brief description
- **Dependencies**: List of related packages
- **Usage**: Basic usage example
- **Notes**: Any special considerations
```

## Dependency Maintenance

### Regular Tasks
1. Weekly security audits
2. Monthly dependency updates
3. Quarterly major version evaluations
4. Semi-annual dependency cleanup

### Automated Checks
- GitHub Actions workflow for dependency validation
- Automated security scanning
- Bundle size monitoring

## Contact Information

### Dependency Management
- **Technical Lead**: [contact]
- **Security Team**: [contact]
- **DevOps Team**: [contact] 