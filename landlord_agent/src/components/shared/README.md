# Shared Components

This folder contains reusable business components that can be used across the application and potentially extracted as a separate component library.

## Components

### PropertyCard
Reusable property display component with image, status, and actions.

```tsx
import { PropertyCard } from '@/components/shared';

<PropertyCard
  property={property}
  onView={(property) => handleView(property)}
  onEdit={(property) => handleEdit(property)}
  showActions={true}
/>
```

### BulkActionsBar
Selection management component with export, archive, and delete options.

```tsx
import { BulkActionsBar } from '@/components/shared';

<BulkActionsBar
  selectedCount={selectedItems.length}
  selectedLabel="property"
  onClearSelection={() => setSelectedItems([])}
  onExport={(format) => exportData(format)}
  onArchive={() => archiveSelected()}
  onDelete={() => deleteSelected()}
/>
```

### StatusBadge
Consistent status indicators with icons and colors.

```tsx
import { StatusBadge } from '@/components/shared';

<StatusBadge 
  status="available" 
  showIcon 
  size="lg"
  customLabel="Ready to Rent"
/>
```

### PriorityAlertsCard
Comprehensive alert display with left summary panel and right alert details.

```tsx
import { PriorityAlertsCard } from '@/components/shared';

<PriorityAlertsCard
  alerts={alerts}
  title="Priority Alerts"
  maxAlerts={3}
  onAlertClick={(alert) => handleAlert(alert)}
/>
```

## Hooks

### useBulkSelection
Hook for managing bulk selection state.

```tsx
import { useBulkSelection } from '@/components/shared';

const {
  selectedIds,
  selectedItems,
  toggleSelection,
  selectAll,
  clearSelection,
  isSelected,
  isAllSelected
} = useBulkSelection(items);
```

## Utilities

### Formatters
Utility functions for data formatting.

```tsx
import { formatCurrency, formatDate, truncateText } from '@/components/shared';

formatCurrency(1200); // "£1,200.00"
formatDate(new Date()); // "15 Jan 2024"
truncateText("Long text...", 50); // "Long text..."
```

### cn
Class name utility for conditional styling.

```tsx
import { cn } from '@/components/shared';

const className = cn(
  "base-styles",
  isActive && "active-styles",
  variant === "primary" && "primary-styles"
);
```

## Examples

See the `examples/` folder for usage examples of each component.

## Usage

Import components from the shared index:

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

## Extracting as a Library

These components can be extracted as a separate npm package by:

1. Creating a new package.json in this folder
2. Setting up TypeScript compilation
3. Building and publishing to npm
4. Using in other projects

See the original `extracted-components/package.json` for reference.
