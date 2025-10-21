# Single Port Implementation Plan
## Route-Based Unified Application Architecture

### Overview
This document outlines the implementation plan for consolidating the tenant and landlord agent applications into a single unified application running on one port, with route-based access control.

### Current State
- **Tenant Application**: Runs on `localhost:3000` (or similar port)
- **Landlord Agent**: Runs on `localhost:3002` (separate port)
- **Authentication**: Separate MSAL instances, no shared state
- **Navigation**: No integration between applications

### Target State
- **Unified Application**: Single port (e.g., `localhost:3000`)
- **Route-Based Access**: 
  - Tenant routes: `/`, `/dashboard`, `/properties`, etc.
  - Landlord routes: `/landlord`, `/landlord/dashboard`, `/landlord/properties`, etc.
- **Shared Authentication**: Single MSAL instance accessible to both roles
- **Integrated Navigation**: Seamless switching between tenant and landlord views

---

## Implementation Strategy

### Phase 1: Project Structure Consolidation

#### 1.1 Directory Restructuring
```
proptii-r1.1a/
├── src/
│   ├── components/
│   │   ├── tenant/          # Tenant-specific components
│   │   ├── landlord/        # Landlord-specific components
│   │   └── shared/          # Shared components
│   ├── pages/
│   │   ├── tenant/          # Tenant pages
│   │   ├── landlord/         # Landlord pages
│   │   └── shared/           # Shared pages
│   ├── contexts/
│   │   └── AuthContext.tsx   # Unified authentication
│   ├── services/
│   │   └── RoleService.ts    # Role management
│   └── App.tsx               # Main application router
├── public/
└── package.json
```

#### 1.2 Package.json Updates
- Remove separate `landlord_agent` package.json
- Consolidate dependencies into main package.json
- Update build scripts for unified application

### Phase 2: Authentication Unification

#### 2.1 Unified AuthContext
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  roles: ('tenant' | 'landlord' | 'agent')[];
  currentRole: 'tenant' | 'landlord' | 'agent';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  currentRole: 'tenant' | 'landlord' | 'agent';
  switchRole: (role: 'tenant' | 'landlord' | 'agent') => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}
```

#### 2.2 Role Management Service
```typescript
class RoleService {
  static getCurrentRole(): 'tenant' | 'landlord' | 'agent';
  static setCurrentRole(role: 'tenant' | 'landlord' | 'agent'): void;
  static getAvailableRoles(user: User): ('tenant' | 'landlord' | 'agent')[];
  static canAccessRoute(route: string, role: string): boolean;
}
```

### Phase 3: Routing Implementation

#### 3.1 Route Structure
```
/                           # Tenant dashboard (default)
/dashboard                  # Tenant dashboard
/properties                 # Tenant properties
/referencing               # Tenant referencing
/landlord                  # Landlord dashboard
/landlord/dashboard         # Landlord dashboard
/landlord/properties        # Landlord properties
/landlord/tenants           # Landlord tenant management
/landlord/analytics         # Landlord analytics
```

#### 3.2 Route Protection
```typescript
// Protected route wrapper
const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  redirectTo 
}: {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo: string;
}) => {
  const { currentRole } = useAuth();
  
  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};
```

#### 3.3 Navigation Component
```typescript
const Navigation = () => {
  const { user, currentRole, switchRole } = useAuth();
  
  return (
    <nav>
      {/* Tenant Navigation */}
      {currentRole === 'tenant' && (
        <>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/properties">Properties</Link>
          <Link to="/referencing">Referencing</Link>
          <button onClick={() => switchRole('landlord')}>
            Switch to Landlord
          </button>
        </>
      )}
      
      {/* Landlord Navigation */}
      {currentRole === 'landlord' && (
        <>
          <Link to="/landlord/dashboard">Dashboard</Link>
          <Link to="/landlord/properties">Properties</Link>
          <Link to="/landlord/tenants">Tenants</Link>
          <button onClick={() => switchRole('tenant')}>
            Switch to Tenant
          </button>
        </>
      )}
    </nav>
  );
};
```

### Phase 4: Component Migration

#### 4.1 Tenant Components
- Move `landlord_agent/src/components/` → `src/components/tenant/`
- Update imports and paths
- Ensure tenant-specific styling is preserved

#### 4.2 Landlord Components
- Move `landlord_agent/src/components/` → `src/components/landlord/`
- Update imports and paths
- Ensure landlord-specific styling is preserved

#### 4.3 Shared Components
- Identify common components between tenant and landlord
- Move to `src/components/shared/`
- Update imports across both applications

### Phase 5: Styling and Theme Management

#### 5.1 CSS Variable Consolidation
```css
:root {
  /* Shared variables */
  --primary-color: #136C9E;
  --secondary-color: #DC5F12;
  --outline-color: #f2f2f2;
  
  /* Role-specific variables */
  --tenant-bg: #ffffff;
  --landlord-bg: #f8f9fa;
}

/* Role-specific themes */
.tenant-theme {
  --main-bg: var(--tenant-bg);
}

.landlord-theme {
  --main-bg: var(--landlord-bg);
}
```

#### 5.2 Component Theming
```typescript
const ThemedComponent = ({ children }: { children: React.ReactNode }) => {
  const { currentRole } = useAuth();
  
  return (
    <div className={`${currentRole}-theme`}>
      {children}
    </div>
  );
};
```

### Phase 6: State Management

#### 6.1 Global State Structure
```typescript
interface AppState {
  auth: {
    user: User | null;
    isAuthenticated: boolean;
    currentRole: 'tenant' | 'landlord' | 'agent';
  };
  tenant: {
    properties: Property[];
    applications: Application[];
    // ... other tenant state
  };
  landlord: {
    properties: Property[];
    tenants: Tenant[];
    analytics: AnalyticsData;
    // ... other landlord state
  };
}
```

#### 6.2 Context Providers
```typescript
const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <TenantProvider>
        <LandlordProvider>
          {children}
        </LandlordProvider>
      </TenantProvider>
    </AuthProvider>
  );
};
```

### Phase 7: Navigation Integration

#### 7.1 Role Switching
```typescript
const RoleSwitcher = () => {
  const { user, currentRole, switchRole } = useAuth();
  
  const availableRoles = user?.roles.filter(role => role !== currentRole) || [];
  
  return (
    <div className="role-switcher">
      {availableRoles.map(role => (
        <button
          key={role}
          onClick={() => switchRole(role)}
          className="role-switch-button"
        >
          Switch to {role.charAt(0).toUpperCase() + role.slice(1)}
        </button>
      ))}
    </div>
  );
};
```

#### 7.2 Breadcrumb Navigation
```typescript
const Breadcrumb = () => {
  const location = useLocation();
  const { currentRole } = useAuth();
  
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    if (currentRole === 'landlord' && segments[0] === 'landlord') {
      return ['Landlord', ...segments.slice(1)];
    }
    
    return segments;
  };
  
  return (
    <nav className="breadcrumb">
      {getBreadcrumbs().map((segment, index) => (
        <span key={index}>
          {segment.charAt(0).toUpperCase() + segment.slice(1)}
          {index < getBreadcrumbs().length - 1 && ' > '}
        </span>
      ))}
    </nav>
  );
};
```

---

## Migration Steps

### Step 1: Backup Current State
1. Create backup of current `landlord_agent` directory
2. Document current authentication setup
3. Export current component structure

### Step 2: Create Unified Project Structure
1. Create new directory structure in main project
2. Set up unified package.json
3. Configure unified build system

### Step 3: Implement Authentication Unification
1. Create unified AuthContext
2. Implement role management service
3. Update MSAL configuration for single instance

### Step 4: Set Up Routing
1. Install and configure React Router
2. Create route protection components
3. Implement navigation components

### Step 5: Migrate Components
1. Move tenant components to new structure
2. Move landlord components to new structure
3. Update all imports and references

### Step 6: Implement Role Switching
1. Create role switching logic
2. Update navigation components
3. Implement route protection

### Step 7: Testing and Validation
1. Test authentication across both roles
2. Validate route protection
3. Test role switching functionality
4. Ensure styling consistency

---

## Benefits of This Approach

### Technical Benefits
- ✅ **Single Authentication**: No cross-port communication needed
- ✅ **Shared State**: Easy data sharing between roles
- ✅ **Simplified Deployment**: One application to manage
- ✅ **Better Performance**: No iframe/window communication overhead
- ✅ **Easier Development**: Single codebase to maintain

### User Experience Benefits
- ✅ **Seamless Navigation**: Smooth switching between roles
- ✅ **Consistent UI**: Unified design system
- ✅ **Single Login**: No need to authenticate twice
- ✅ **Better Performance**: Faster role switching

### Development Benefits
- ✅ **Code Reuse**: Shared components and utilities
- ✅ **Easier Testing**: Single test suite
- ✅ **Simplified CI/CD**: One deployment pipeline
- ✅ **Better Maintainability**: Single codebase

---

## Potential Challenges and Solutions

### Challenge 1: Component Conflicts
**Problem**: Naming conflicts between tenant and landlord components
**Solution**: Use namespaced imports and clear directory structure

### Challenge 2: Styling Conflicts
**Problem**: CSS conflicts between tenant and landlord styles
**Solution**: Use CSS modules or styled-components with role-based theming

### Challenge 3: State Management Complexity
**Problem**: Managing state for both roles in single application
**Solution**: Use context providers and role-based state isolation

### Challenge 4: Route Complexity
**Problem**: Complex routing with role-based access
**Solution**: Use route protection components and clear route structure

---

## Success Metrics

### Technical Metrics
- [ ] Single port deployment successful
- [ ] Authentication works for both roles
- [ ] Role switching functions correctly
- [ ] Route protection works as expected
- [ ] No console errors or warnings

### User Experience Metrics
- [ ] Smooth navigation between roles
- [ ] Consistent styling across roles
- [ ] Fast role switching (< 1 second)
- [ ] Intuitive navigation structure

### Development Metrics
- [ ] Reduced code duplication
- [ ] Simplified build process
- [ ] Easier component maintenance
- [ ] Streamlined deployment process

---

## Timeline Estimate

- **Phase 1-2**: 2-3 days (Project structure and authentication)
- **Phase 3**: 1-2 days (Routing implementation)
- **Phase 4**: 3-4 days (Component migration)
- **Phase 5**: 1-2 days (Styling and theming)
- **Phase 6**: 2-3 days (State management)
- **Phase 7**: 1-2 days (Navigation integration)
- **Testing**: 2-3 days

**Total Estimated Time**: 12-19 days

---

## Conclusion

This single-port implementation will significantly improve the user experience and development workflow by eliminating the need for cross-port communication and providing a unified, seamless application experience. The route-based approach maintains clear separation between tenant and landlord functionality while enabling easy role switching and shared authentication.
