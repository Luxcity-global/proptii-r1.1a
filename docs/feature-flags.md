# Feature Flags System

## Overview
The feature flags system allows for dynamic enabling/disabling of features across different environments (Development, Staging, and Production). This system helps manage feature rollouts, testing, and environment-specific functionality.

## Available Feature Flags

### Development Features
- `VITE_ENABLE_DEBUG_LOGGING`: Enable detailed logging (Development, Staging)
- `VITE_ENABLE_DETAILED_ERRORS`: Show detailed error messages (Development only)
- `VITE_ENABLE_BETA_FEATURES`: Enable beta features (Development, Staging)
- `VITE_ENABLE_REACT_DEVTOOLS`: Enable React Developer Tools (Development only)
- `VITE_ENABLE_REDUX_DEVTOOLS`: Enable Redux Developer Tools (Development only)
- `VITE_ENABLE_HOT_RELOAD`: Enable Hot Module Replacement (Development only)

### Performance & Monitoring
- `VITE_ENABLE_PERFORMANCE_MONITORING`: Enable performance tracking (Staging, Production)
- `VITE_ENABLE_ERROR_REPORTING`: Enable error reporting (Staging, Production)

### Security & Infrastructure
- `VITE_ENABLE_SECURITY_HEADERS`: Enable security headers (Staging, Production)
- `VITE_ENABLE_CACHING`: Enable response caching (Staging, Production)
- `VITE_ENABLE_MAINTENANCE_MODE`: Enable maintenance mode (All environments)

## Usage in Code

### Using the Hook
```typescript
import { useFeatureFlag } from '../hooks/useFeatureFlag';

const MyComponent = () => {
  const isDebugEnabled = useFeatureFlag('debugLogging');
  
  if (isDebugEnabled) {
    console.log('Debug mode is enabled');
  }
  
  return <div>My Component</div>;
};
```

### Using Multiple Flags
```typescript
import { useFeatureFlags } from '../hooks/useFeatureFlag';

const MyComponent = () => {
  const flags = useFeatureFlags();
  
  return (
    <div>
      {flags.betaFeatures && <BetaFeature />}
      {flags.debugLogging && <DebugPanel />}
    </div>
  );
};
```

## Environment Configuration

### Development (.env.development)
```env
VITE_ENABLE_DEBUG_LOGGING=true
VITE_ENABLE_DETAILED_ERRORS=true
VITE_ENABLE_BETA_FEATURES=true
```

### Staging (.env.staging)
```env
VITE_ENABLE_DEBUG_LOGGING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_BETA_FEATURES=true
```

### Production (.env.production)
```env
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_SECURITY_HEADERS=true
VITE_ENABLE_CACHING=true
```

## Validation

The feature flags system includes validation to ensure proper configuration:

1. Run validation:
```bash
npm run validate:feature-flags
```

2. The validator checks:
   - Required flags for each environment
   - Valid flag values (must be 'true' or 'false')
   - Environment-specific restrictions
   - Feature flag schema compliance

## Best Practices

1. **Environment Specificity**
   - Keep development features disabled in production
   - Enable monitoring and security features in production
   - Use staging for testing new features

2. **Feature Implementation**
   - Always check feature flags before rendering sensitive components
   - Use the hooks provided by the system
   - Document new feature flags in this README

3. **Security Considerations**
   - Never enable debug features in production
   - Always enable security features in production
   - Validate feature flag configuration before deployment

4. **Maintenance**
   - Regularly review and clean up unused feature flags
   - Keep documentation updated
   - Test feature flag changes in staging first 