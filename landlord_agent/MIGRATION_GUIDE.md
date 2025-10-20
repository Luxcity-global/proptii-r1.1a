# Migration Guide: Extracted Components → Shared Components

## Overview
The `extracted-components` folder has been moved to `src/components/shared` for better integration with the main application structure.

## New Structure

```
src/components/shared/
├── index.ts                    # Main export file
├── README.md                   # Documentation
├── PropertyCard.tsx            # Property display component
├── BulkActionsBar.tsx          # Bulk selection component
├── StatusBadge.tsx             # Status indicator component
├── PriorityAlertsCard.tsx      # Alert management component
├── hooks/
│   └── useBulkSelection.ts     # Selection state hook
├── utils/
│   ├── cn.ts                   # Class name utility
│   └── formatters.ts           # Data formatting functions
└── examples/
    └── PriorityAlertsCardExample.tsx  # Usage examples
```

## Import Changes

### Before (extracted-components)
```tsx
import { PropertyCard } from '../extracted-components/PropertyCard';
import { BulkActionsBar } from '../extracted-components/BulkActionsBar';
import { StatusBadge } from '../extracted-components/StatusBadge';
```

### After (src/components/shared)
```tsx
import { PropertyCard, BulkActionsBar, StatusBadge } from '@/components/shared';
```

## Benefits of the New Structure

1. **Better Integration**: Components are now part of the main src structure
2. **Consistent Imports**: Uses the same import patterns as other components
3. **TypeScript Path Mapping**: Works with existing `@/` alias configuration
4. **Easier Development**: No need to navigate outside src folder
5. **Better IDE Support**: Full IntelliSense and navigation support

## Usage Examples

### Basic Import
```tsx
import { 
  PropertyCard, 
  BulkActionsBar, 
  StatusBadge, 
  PriorityAlertsCard,
  useBulkSelection,
  formatCurrency 
} from '@/components/shared';
```

### Component Usage
```tsx
function PropertyList({ properties }: { properties: Property[] }) {
  const { selectedIds, toggleSelection } = useBulkSelection(properties);
  
  return (
    <div>
      <BulkActionsBar
        selectedCount={selectedIds.size}
        selectedLabel="property"
        onClearSelection={() => {}}
      />
      
      {properties.map(property => (
        <PropertyCard
          key={property.id}
          property={property}
          onView={(property) => handleView(property)}
        />
      ))}
    </div>
  );
}
```

## Migration Steps

1. ✅ **Components Moved**: All components moved to `src/components/shared/`
2. ✅ **Import Paths Updated**: All imports use correct relative paths
3. ✅ **Index File Created**: Centralized exports in `index.ts`
4. ✅ **Documentation Added**: README with usage examples
5. ✅ **Structure Organized**: Proper folder hierarchy with hooks, utils, examples

## Next Steps

1. **Update Imports**: If any files still import from `extracted-components/`, update them
2. **Test Components**: Verify all components work correctly in the new location
3. **Remove Old Folder**: Delete the `extracted-components/` folder once migration is complete
4. **Update Documentation**: Update any external documentation that references the old structure

## Library Extraction

The shared components can still be extracted as a separate npm package:

1. Copy the `src/components/shared/` folder to a new repository
2. Add a `package.json` with the appropriate dependencies
3. Set up TypeScript compilation
4. Build and publish to npm

The components are designed to be framework-agnostic and can work in any React application with the required dependencies.
