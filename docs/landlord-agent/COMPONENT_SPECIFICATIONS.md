# Property Management Application - Component Specifications

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Component Library Structure](#component-library-structure)
5. [Base UI Components](#base-ui-components)
6. [Business Logic Components](#business-logic-components)
7. [Data Models & Interfaces](#data-models--interfaces)
8. [Design System](#design-system)
9. [State Management](#state-management)
10. [Routing & Navigation](#routing--navigation)
11. [Build Configuration](#build-configuration)
12. [Development Guidelines](#development-guidelines)
13. [Component Usage Examples](#component-usage-examples)

## Project Overview

This is a comprehensive property management application built with React, TypeScript, and Tailwind CSS. The application serves both landlords and agents, providing tools for property management, tenant management, document handling, and portfolio insights.

### Key Features
- **Property Management**: Add, edit, view, and manage property portfolios
- **Tenant Management**: Handle tenant onboarding, communication, and rent tracking
- **Document Management**: Store and manage property documents with expiry tracking
- **Photo Management**: Upload and organize property photos
- **Portfolio Insights**: Analytics and market insights for property portfolios
- **Alert System**: Vacancy prevention and arrears management
- **Multi-role Support**: Different interfaces for landlords and agents

## Architecture Overview

The application follows a component-based architecture with clear separation of concerns:

```
src/
├── components/           # All components
│   ├── ui/              # Base UI component library (46 components)
│   ├── shared/          # Reusable business components
│   │   ├── PropertyCard.tsx
│   │   ├── BulkActionsBar.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── PriorityAlertsCard.tsx
│   │   ├── hooks/       # Custom hooks
│   │   ├── utils/       # Utility functions
│   │   └── examples/    # Usage examples
│   ├── Dashboard.tsx    # Main dashboard component
│   ├── PropertiesPage.tsx # Property management interface
│   ├── ClientsPage.tsx  # Tenant/landlord management
│   └── ...              # Other business components
├── styles/              # Global styles and theming
├── types/               # TypeScript type definitions
└── App.tsx              # Main application component
```

### Component Hierarchy
```
App (Root State Management)
├── MainLayout (Navigation & Layout)
│   ├── Dashboard
│   ├── PropertiesPage
│   ├── ClientsPage
│   └── DocumentsPage
├── PropertySetup (Onboarding Flow)
├── PropertyDetails
├── TenantDetails
└── Various Modal/Dialog Components
```

## Technology Stack

### Core Technologies
- **React 18.3.1** - UI framework
- **TypeScript** - Type safety and development experience
- **Vite 6.3.5** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework

### UI Component Libraries
- **Radix UI** - Accessible, unstyled UI primitives
- **Lucide React** - Icon library
- **Recharts** - Chart and data visualization
- **React Hook Form** - Form handling and validation

### Key Dependencies
```json
{
  "@radix-ui/react-*": "^1.1.x - ^2.1.x", // UI primitives
  "class-variance-authority": "^0.7.1",     // Component variants
  "clsx": "*",                              // Class name utility
  "tailwind-merge": "*",                    // Tailwind class merging
  "lucide-react": "^0.487.0",              // Icons
  "recharts": "^2.15.2",                   // Charts
  "react-hook-form": "^7.55.0",            // Forms
  "sonner": "^2.0.3"                       // Toast notifications
}
```

## Component Library Structure

### Base UI Components (`src/components/ui/`)

The application uses a comprehensive set of base UI components built on Radix UI primitives:

#### Layout Components
- **Card** - Container with header, content, and footer sections
- **Separator** - Visual divider between sections
- **Sheet** - Slide-out panel for secondary content
- **Dialog** - Modal dialog for forms and confirmations

#### Form Components
- **Button** - Interactive button with multiple variants
- **Input** - Text input with validation states
- **Select** - Dropdown selection component
- **Textarea** - Multi-line text input
- **Checkbox** - Boolean input with custom styling
- **RadioGroup** - Single selection from multiple options
- **Switch** - Toggle switch for boolean values
- **Slider** - Range input for numeric values

#### Data Display Components
- **Table** - Structured data display with sorting/filtering
- **Badge** - Status indicators and labels
- **Avatar** - User profile images with fallbacks
- **Progress** - Progress bars and loading indicators
- **Skeleton** - Loading state placeholders

#### Navigation Components
- **Tabs** - Tabbed interface for organizing content
- **DropdownMenu** - Contextual menu with actions
- **Breadcrumb** - Navigation hierarchy display
- **NavigationMenu** - Main navigation component

#### Feedback Components
- **Alert** - Important messages and notifications
- **Tooltip** - Contextual information on hover
- **Toast** - Temporary success/error messages

### Component Design Patterns

#### 1. Variant-based Styling
Components use `class-variance-authority` for consistent variant management:

```tsx
const buttonVariants = cva(
  "base-styles",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-white",
        outline: "border bg-background",
        // ... more variants
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

#### 2. Compound Component Pattern
Complex components are broken into sub-components:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

#### 3. ForwardRef Pattern
All interactive components use `forwardRef` for proper ref forwarding:

```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
```

## Business Logic Components

### Shared Business Components (`src/components/shared/`)

These are reusable business components that can be used across the application and potentially extracted as a separate component library.

#### PropertyCard (`src/components/shared/PropertyCard.tsx`)
**Purpose**: Reusable property display component with image, status, and actions.

**Key Features**:
- Property image display with fallback
- Status badges with color coding
- Action buttons (View, Edit, Manage Documents, Manage Photos)
- Tenant information display
- Compliance status indicators

**Props Interface**:
```tsx
interface PropertyCardProps {
  property: Property;
  onView?: (property: Property) => void;
  onEdit?: (property: Property) => void;
  onManageDocuments?: (property: Property) => void;
  onManagePhotos?: (property: Property) => void;
  showActions?: boolean;
  className?: string;
}
```

#### BulkActionsBar (`src/components/shared/BulkActionsBar.tsx`)
**Purpose**: Bulk selection management with export, archive, and delete options.

**Key Features**:
- Selection count display
- Export functionality (JSON, CSV, Excel, PDF)
- Archive and delete actions
- Clear selection option
- Responsive design

**Props Interface**:
```tsx
interface BulkActionsBarProps {
  selectedCount: number;
  selectedLabel: string;
  onClearSelection: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onExport?: (format: string) => void;
  exportFormats?: string[];
  showArchive?: boolean;
  showDelete?: boolean;
  showExport?: boolean;
}
```

#### StatusBadge (`src/components/shared/StatusBadge.tsx`)
**Purpose**: Consistent status indicators with icons and colors.

**Key Features**:
- Predefined status types (available, occupied, under-renovation, etc.)
- Custom status support
- Icon integration with Lucide React
- Multiple sizes (sm, md, lg)
- Custom labels and colors

**Props Interface**:
```tsx
interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  customLabel?: string;
  customColor?: string;
  className?: string;
}
```

#### PriorityAlertsCard (`src/components/shared/PriorityAlertsCard.tsx`)
**Purpose**: Comprehensive alert display with summary panel and detailed alerts.

**Key Features**:
- Left summary panel with total counts
- Right detailed alerts list
- Multiple alert types (vacancy-risk, rent-arrears, maintenance, etc.)
- Customizable styling and colors
- Click handlers for alert actions

**Props Interface**:
```tsx
interface PriorityAlertsCardProps {
  alerts: AlertItem[];
  title?: string;
  subtitle?: string;
  maxAlerts?: number;
  height?: string;
  customGradient?: { from: string; to: string };
  customBorderColor?: string;
  showDate?: boolean;
  onAlertClick?: (alert: AlertItem) => void;
}
```

#### Custom Hooks

##### useBulkSelection (`src/components/shared/hooks/useBulkSelection.ts`)
**Purpose**: Hook for managing bulk selection state.

**Features**:
- Selection state management
- Toggle individual items
- Select all / clear all functionality
- Selection change callbacks

```tsx
const {
  selectedIds,
  selectedItems,
  toggleSelection,
  selectAll,
  clearSelection,
  isSelected,
  isAllSelected
} = useBulkSelection(items, {
  onSelectionChange: (ids) => console.log('Selected:', ids)
});
```

#### Utility Functions

##### Formatters (`src/components/shared/utils/formatters.ts`)
**Purpose**: Data formatting utilities.

```tsx
formatCurrency(1200); // "£1,200.00"
formatDate(new Date()); // "15 Jan 2024"
truncateText("Long text...", 50); // "Long text..."
```

##### cn (`src/components/shared/utils/cn.ts`)
**Purpose**: Class name utility for conditional styling.

```tsx
const className = cn(
  "base-styles",
  isActive && "active-styles",
  variant === "primary" && "primary-styles"
);
```

### Core Application Components

#### 1. Dashboard (`src/components/Dashboard.tsx`)
**Purpose**: Main dashboard showing portfolio overview, alerts, and quick actions.

**Key Features**:
- Property portfolio summary with charts
- Market insights and alerts
- Quick action buttons
- Search and filtering capabilities

**Props Interface**:
```tsx
interface DashboardProps {
  properties: Property[];
  userProfile: UserProfile | null;
  onAddProperty: () => void;
  onViewProperty: (property: Property) => void;
  onManageDocuments: (property: Property) => void;
  onManagePhotos: (property: Property) => void;
  onViewInsights: () => void;
  onViewVacancyAlert?: (alertId: string) => void;
  onViewArrearsAlert?: (alertId: string) => void;
  marketInsights: MarketInsight[];
  vacancyAlerts?: VacancyRiskAlert[];
  arrearsAlerts?: ArrearsAlert[];
}
```

#### 2. PropertiesPage (`src/components/PropertiesPage.tsx`)
**Purpose**: Comprehensive property management interface with bulk operations.

**Key Features**:
- Property grid/list view with filtering
- Bulk selection and actions
- Import/export functionality
- Property status management
- Compliance tracking

**Props Interface**:
```tsx
interface PropertiesPageProps {
  properties: Property[];
  tenants: Tenant[];
  arrearsAlerts: ArrearsAlert[];
  onAddProperty: () => void;
  onViewProperty: (property: Property) => void;
  onEditProperty: (property: Property) => void;
  onManageDocuments: (property: Property) => void;
  onManagePhotos: (property: Property) => void;
  onViewTenant: (tenant: Tenant) => void;
  onDeleteProperty?: (property: Property) => void;
  onArchiveProperty?: (property: Property) => void;
  onDuplicateProperty?: (property: Property) => void;
  onExportProperties?: (properties: Property[], format: string) => void;
  onImportProperties?: (properties: Property[]) => void;
}
```

#### 3. ClientsPage (`src/components/ClientsPage.tsx`)
**Purpose**: Tenant and landlord management interface.

**Key Features**:
- Tenant listing with arrears alerts
- Landlord portfolio management (agents only)
- Contact management
- Status tracking and filtering

**Props Interface**:
```tsx
interface ClientsPageProps {
  tenants: Tenant[];
  properties: Property[];
  arrearsAlerts: ArrearsAlert[];
  userRole: UserRole;
  onViewTenant: (tenant: Tenant) => void;
  onViewProperty: (property: Property) => void;
  onAddTenant: () => void;
  onAddLandlord: () => void;
  onViewLandlord: (landlord: any) => void;
  onDeleteTenant: (tenantId: string) => void;
  onArchiveTenant: (tenantId: string) => void;
  onExportTenants: (format: string) => void;
  onDeleteLandlord: (landlordId: string) => void;
  onArchiveLandlord: (landlordId: string) => void;
  onExportLandlords: (format: string) => void;
}
```

### Property Management Components

#### 4. PropertySetup (Multi-step Flow)
**Components**: PropertySetupStep1, PropertyTypeSelection, PropertyDetailsSelection, AmenitiesSelection, ImagesAndNotesSelection

**Purpose**: Guided property onboarding with step-by-step data collection.

**Flow Structure**:
1. **PropertySetupStep1** - Welcome and navigation
2. **PropertyTypeSelection** - Property type selection
3. **PropertyDetailsSelection** - Address, rent, bedrooms, etc.
4. **AmenitiesSelection** - Property amenities selection
5. **ImagesAndNotesSelection** - Photo upload and notes
6. **PropertyPreview** - Review before publishing

#### 5. PropertyDetails (`src/components/PropertyDetails.tsx`)
**Purpose**: Detailed property view with tenant information and management actions.

**Key Features**:
- Property information display
- Tenant details and contact
- Document management links
- Photo gallery access
- Market insights integration

#### 6. DocumentManagement (`src/components/DocumentManagement.tsx`)
**Purpose**: Property document organization with expiry tracking.

**Key Features**:
- Document categorization (EPC, Gas Cert, Insurance, etc.)
- Expiry date tracking with alerts
- Document upload and organization
- Status indicators (Valid, Expiring Soon, Expired)

#### 7. PhotoManagement (`src/components/PhotoManagement.tsx`)
**Purpose**: Property photo organization and management.

**Key Features**:
- Photo upload with drag-and-drop
- Room categorization
- Cover photo selection
- Photo gallery with lightbox

### Tenant Management Components

#### 8. TenantDetails (`src/components/TenantDetails.tsx`)
**Purpose**: Comprehensive tenant profile and management.

**Key Features**:
- Personal information and contact details
- Payment history and status
- Reference checking status
- Emergency contact information
- Lease details and timeline

#### 9. AddTenant (`src/components/AddTenant.tsx`)
**Purpose**: Tenant onboarding with comprehensive form handling.

**Key Features**:
- Multi-step form with validation
- Property assignment
- Reference collection
- Emergency contact setup
- Document upload

### Alert Management Components

#### 10. VacancyPrevention (`src/components/VacancyPrevention.tsx`)
**Purpose**: AI-powered vacancy risk management.

**Key Features**:
- Risk scoring and analysis
- Market trend integration
- Pre-marketing recommendations
- Optimal pricing suggestions
- Marketing timeline planning

#### 11. ArrearsManagement (`src/components/ArrearsManagement.tsx`)
**Purpose**: Rent arrears workflow management.

**Key Features**:
- Payment plan creation
- Legal action workflows
- Communication templates
- Risk assessment
- Intervention tracking

## Data Models & Interfaces

### Core Data Types

#### Property Interface
```tsx
interface Property {
  id: string;
  address: string;
  type: string;
  bedrooms: number;
  rent: number;
  status: 'vacant' | 'occupied' | 'under-renovation';
  amenities: string[];
  notes: string;
  photos: PropertyPhoto[];
  documents: PropertyDocument[];
  createdAt: Date;
  tenant?: Tenant;
  tenantId?: string;
}
```

#### Tenant Interface
```tsx
interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyAddress: string;
  propertyId: string;
  rentAmount: number;
  leaseStart: Date;
  leaseEnd: Date;
  status: 'active' | 'pending' | 'ended';
  referencingStatus: 'not-started' | 'in-progress' | 'complete';
  paymentStatus: 'current' | 'overdue' | 'payment-plan';
  avatar?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  defaultRiskScore?: number;
  lastPaymentDate?: Date;
  overdueAmount?: number;
}
```

#### User Profile Interface
```tsx
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  logo?: string;
  companyProfile?: CompanyProfile;
}
```

#### Alert Interfaces
```tsx
interface VacancyRiskAlert {
  id: string;
  propertyId: string;
  propertyAddress: string;
  riskScore: number;
  predictedVacancyDate: Date;
  currentTenantEndDate: Date;
  factors: {
    marketTrend: number;
    seasonality: number;
    tenantHistory: number;
    propertyCondition: number;
  };
  recommendations: {
    optimalRentPrice: number;
    marketingStartDate: Date;
    urgencyLevel: 'low' | 'medium' | 'high';
  };
  status: 'new' | 'pre-marketing' | 'marketing-active' | 'resolved';
}

interface ArrearsAlert {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyAddress: string;
  overdueAmount: number;
  daysPastDue: number;
  defaultRiskScore: number;
  lastPaymentDate: Date;
  status: 'new' | 'reminder-sent' | 'payment-plan' | 'legal-action' | 'resolved';
  interventionType?: 'reminder' | 'payment-plan' | 'legal';
}
```

### Document and Photo Types
```tsx
interface PropertyPhoto {
  id: string;
  url: string;
  filename: string;
  room?: string;
  isCover: boolean;
}

interface PropertyDocument {
  id: string;
  name: string;
  type: 'epc' | 'gas-cert' | 'tenancy-agreement' | 'insurance' | 'other';
  url: string;
  issueDate: Date;
  expiryDate?: Date;
  status: 'valid' | 'expiring-soon' | 'expired';
}
```

## Design System

### Color Palette
The application uses a comprehensive color system defined in CSS variables:

```css
:root {
  --primary: #DC5F12;           /* Orange - Primary brand color */
  --primary-foreground: #ffffff;
  --secondary: oklch(0.95 0.0058 264.53);
  --secondary-foreground: #DC5F12;
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --muted: #ececf0;
  --muted-foreground: #717182;
  --accent: #e9ebef;
  --accent-foreground: #DC5F12;
  --destructive: #d4183d;
  --destructive-foreground: #ffffff;
  --border: rgba(0, 0, 0, 0.1);
  --input: transparent;
  --input-background: #f3f3f5;
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}
```

### Typography
- **Font Family**: Archivo (Google Fonts)
- **Font Weights**: 100-900 (variable font)
- **Base Font Size**: 16px
- **Line Height**: 1.5

### Spacing System
Uses Tailwind's default spacing scale:
- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

### Border Radius
- **Default**: 0.625rem (10px)
- **Small**: 0.375rem (6px)
- **Large**: 0.875rem (14px)
- **Extra Large**: 1.125rem (18px)

### Component Variants

#### Button Variants
- **default**: Primary orange button
- **destructive**: Red button for dangerous actions
- **outline**: Bordered button for secondary actions
- **secondary**: Gray button for tertiary actions
- **ghost**: Transparent button for subtle actions
- **link**: Text button styled as link

#### Badge Variants
- **default**: Neutral gray
- **secondary**: Muted styling
- **destructive**: Red for errors/alerts
- **outline**: Bordered variant

#### Status Colors
- **Available/Vacant**: Yellow (warning)
- **Occupied**: Green (success)
- **Under Renovation**: Blue (info)
- **Overdue/Expired**: Red (error)

### Animation System
Custom animations defined in CSS:

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}
```

## State Management

### Application State Structure
The main application state is managed in `App.tsx` using React's `useState`:

```tsx
// Screen and navigation state
const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
const [navigationScreen, setNavigationScreen] = useState<NavigationScreen>('dashboard');

// User and role state
const [userRole, setUserRole] = useState<UserRole>('landlord');
const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

// Data state
const [properties, setProperties] = useState<Property[]>([]);
const [tenants, setTenants] = useState<Tenant[]>([]);

// Selection state
const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

// Alert state
const [vacancyAlerts, setVacancyAlerts] = useState<VacancyRiskAlert[]>([]);
const [arrearsAlerts, setArrearsAlerts] = useState<ArrearsAlert[]>([]);
const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
```

### State Management Patterns

#### 1. Lifting State Up
Complex state is managed at the App level and passed down to components:

```tsx
// State management functions
const addProperty = (property: Omit<Property, 'id' | 'createdAt'>) => {
  const newProperty: Property = {
    ...property,
    id: Date.now().toString(),
    createdAt: new Date(),
  };
  setProperties(prev => [...prev, newProperty]);
  return newProperty.id;
};

const updateProperty = (propertyId: string, updates: Partial<Property>) => {
  setProperties(prev => 
    prev.map(p => p.id === propertyId ? { ...p, ...updates } : p)
  );
};
```

#### 2. Form State Management
Complex forms use local state with form libraries:

```tsx
// Property setup state
const [propertySetupData, setPropertySetupData] = useState<PropertySetupData>({
  propertyType: null,
  propertyDetails: {
    address: '',
    monthlyRent: '',
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    uploadedDocuments: []
  },
  amenities: [],
  images: [],
  additionalNotes: ''
});
```

#### 3. Selection State
Bulk selection is managed locally in components:

```tsx
const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
const [showBulkActions, setShowBulkActions] = useState(false);
```

## Routing & Navigation

### Screen-Based Navigation
The application uses a custom screen-based navigation system defined in the `Screen` type:

```tsx
export type Screen = 
  | 'welcome'
  | 'role-selection'
  | 'profile-setup'
  | 'onboarding-options'
  | 'company-profile-setup'
  | 'property-setup-step1'
  | 'property-type-selection'
  | 'property-details-selection'
  | 'amenities-selection'
  | 'images-notes-selection'
  | 'property-setup'
  | 'photo-upload'
  | 'main-app'
  | 'property-details'
  | 'document-management'
  | 'photo-management'
  | 'portfolio-insights'
  | 'property-insights'
  | 'tenant-details'
  | 'vacancy-prevention'
  | 'arrears-management'
  | 'tenant-inbox'
  | 'property-preview'
  | 'tenant-selection'
  | 'add-tenant'
  | 'invite-tenant'
  | 'select-existing-tenant'
  | 'add-landlord'
  | 'landlord-details';
```

### Navigation Patterns

#### 1. Screen Navigation
```tsx
const navigateToScreen = (screen: Screen) => {
  setCurrentScreen(screen);
  // Clear selected items when navigating to certain screens
  if (screen === 'main-app' || screen === 'property-setup') {
    if (screen === 'property-setup' && currentScreen === 'main-app') {
      setSelectedProperty(null);
    }
  }
};
```

#### 2. Nested Navigation (Main App)
Within the main application, navigation uses a separate `NavigationScreen` type:

```tsx
export type NavigationScreen = 
  | 'dashboard'
  | 'properties'
  | 'documents'
  | 'clients'
  | 'inbox'
  | 'insights';
```

#### 3. Navigation Context
Navigation state is managed with callbacks passed down to components:

```tsx
// Navigation callbacks
const onViewProperty = (property: Property) => {
  selectProperty(property);
  navigateToScreen('property-details');
};

const onManageDocuments = (property: Property) => {
  selectProperty(property);
  navigateToScreen('document-management');
};
```

### Layout Structure
The main application uses a `MainLayout` component that provides:
- Sidebar navigation
- Header with user profile
- Content area for screen rendering
- Responsive design for mobile/desktop

## Build Configuration

### Vite Configuration
The application uses Vite with custom configuration for path aliases and build optimization:

```tsx
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      // Package aliases for version consistency
      '@radix-ui/react-*': '@radix-ui/react-*',
      'lucide-react': 'lucide-react',
      // Asset aliases
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

### Package Management
Dependencies are carefully versioned for consistency:

```json
{
  "dependencies": {
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    // ... other Radix UI components
    "class-variance-authority": "^0.7.1",
    "clsx": "*",
    "tailwind-merge": "*",
    "lucide-react": "^0.487.0",
    "recharts": "^2.15.2",
    "react-hook-form": "^7.55.0"
  }
}
```

### Build Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

## Development Guidelines

### Code Organization

#### 1. Component Structure
```tsx
// Import order: React, third-party, local components, types
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Property, Tenant } from '../App';

// Interface definitions
interface ComponentProps {
  // Props interface
}

// Component implementation
export function Component({ prop1, prop2 }: ComponentProps) {
  // State and hooks
  const [state, setState] = useState();
  
  // Event handlers
  const handleAction = () => {
    // Handler implementation
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

#### 2. Naming Conventions
- **Components**: PascalCase (e.g., `PropertyCard`, `BulkActionsBar`)
- **Files**: PascalCase for components, camelCase for utilities
- **Interfaces**: PascalCase with descriptive names (e.g., `PropertyCardProps`)
- **Types**: PascalCase for union types (e.g., `UserRole`, `PropertyStatus`)
- **Functions**: camelCase (e.g., `handleClick`, `formatCurrency`)

#### 3. Props Interface Design
```tsx
interface ComponentProps {
  // Required props first
  data: DataType;
  onAction: (item: DataType) => void;
  
  // Optional props with defaults
  variant?: 'default' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  
  // Event handlers
  onCancel?: () => void;
  onSubmit?: (data: FormData) => void;
}
```

### Styling Guidelines

#### 1. Tailwind CSS Usage
```tsx
// Use semantic class combinations
<div className="bg-background text-foreground border border-border rounded-lg p-4">
  <h2 className="text-lg font-medium text-foreground mb-2">
    Title
  </h2>
  <p className="text-muted-foreground">
    Description
  </p>
</div>

// Use design system tokens
<Button variant="default" size="lg" className="w-full">
  Action
</Button>
```

#### 2. Responsive Design
```tsx
// Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Responsive text sizes
<h1 className="text-xl md:text-2xl lg:text-3xl">
  Responsive Title
</h1>
```

#### 3. Component Variants
```tsx
// Use class-variance-authority for component variants
const buttonVariants = cva(
  "base-styles",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-white",
      },
      size: {
        default: "h-9 px-4 py-2",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Error Handling

#### 1. Form Validation
```tsx
// Use react-hook-form for validation
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    // Default values
  },
});

// Display validation errors
{errors.fieldName && (
  <p className="text-destructive text-sm">
    {errors.fieldName.message}
  </p>
)}
```

#### 2. Loading States
```tsx
// Show loading skeletons
{isLoading ? (
  <Skeleton className="h-32 w-full" />
) : (
  <div>Content</div>
)}

// Disable buttons during actions
<Button disabled={isSubmitting}>
  {isSubmitting ? "Saving..." : "Save"}
</Button>
```

#### 3. Error Boundaries
```tsx
// Wrap components in error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

### Performance Optimization

#### 1. Component Memoization
```tsx
// Memoize expensive components
const MemoizedComponent = React.memo(({ data }: Props) => {
  return <div>{/* Component content */}</div>;
});

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

#### 2. Lazy Loading
```tsx
// Lazy load heavy components
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Use with Suspense
<Suspense fallback={<Skeleton />}>
  <LazyComponent />
</Suspense>
```

#### 3. Event Handler Optimization
```tsx
// Use useCallback for event handlers
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

## Component Usage Examples

### Basic Component Usage

#### 1. Property Card Implementation
```tsx
import { PropertyCard } from './components/PropertyCard';

function PropertyList({ properties }: { properties: Property[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {properties.map(property => (
        <PropertyCard
          key={property.id}
          property={property}
          onView={(property) => navigateToDetails(property)}
          onEdit={(property) => navigateToEdit(property)}
          showActions={true}
        />
      ))}
    </div>
  );
}
```

#### 2. Form Implementation
```tsx
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

function PropertyForm({ onSubmit }: { onSubmit: (data: PropertyFormData) => void }) {
  const form = useForm<PropertyFormData>();
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          {...form.register('address', { required: 'Address is required' })}
        />
        {form.formState.errors.address && (
          <p className="text-destructive text-sm">
            {form.formState.errors.address.message}
          </p>
        )}
      </div>
      
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Saving...' : 'Save Property'}
      </Button>
    </form>
  );
}
```

#### 3. Data Table Implementation
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

function PropertiesTable({ properties }: { properties: Property[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Address</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Rent</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map(property => (
          <TableRow key={property.id}>
            <TableCell>{property.address}</TableCell>
            <TableCell>{property.type}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(property.status)}>
                {property.status}
              </Badge>
            </TableCell>
            <TableCell>£{property.rent.toLocaleString()}</TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewProperty(property)}
              >
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Advanced Component Patterns

#### 1. Bulk Selection Implementation
```tsx
import { useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { BulkActionsBar } from './components/BulkActionsBar';

function SelectablePropertyList({ properties }: { properties: Property[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const selectAll = () => {
    setSelectedIds(new Set(properties.map(p => p.id)));
  };
  
  const clearSelection = () => {
    setSelectedIds(new Set());
  };
  
  return (
    <div>
      <BulkActionsBar
        selectedCount={selectedIds.size}
        selectedLabel="property"
        onClearSelection={clearSelection}
        onExport={(format) => exportProperties(Array.from(selectedIds), format)}
        onArchive={() => archiveProperties(Array.from(selectedIds))}
      />
      
      <div className="space-y-2">
        {properties.map(property => (
          <div
            key={property.id}
            className={`flex items-center space-x-3 p-3 border rounded-lg ${
              selectedIds.has(property.id) ? 'bg-accent border-primary' : ''
            }`}
          >
            <Checkbox
              checked={selectedIds.has(property.id)}
              onCheckedChange={() => toggleSelection(property.id)}
            />
            <PropertyCard property={property} showActions={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 2. Modal Dialog Implementation
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

function PropertyModal({ 
  property, 
  isOpen, 
  onClose 
}: { 
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!property) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{property.address}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Property Details</h3>
            <p>Type: {property.type}</p>
            <p>Bedrooms: {property.bedrooms}</p>
            <p>Rent: £{property.rent.toLocaleString()}</p>
          </div>
          
          <div>
            <h3 className="font-medium">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map(amenity => (
                <Badge key={amenity} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onEditProperty(property)}>
            Edit Property
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### 3. Chart Implementation
```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function PropertyAnalytics({ properties }: { properties: Property[] }) {
  const data = properties.reduce((acc, property) => {
    const status = property.status;
    const existing = acc.find(item => item.status === status);
    if (existing) {
      existing.count += 1;
      existing.value += property.rent;
    } else {
      acc.push({
        status: status,
        count: 1,
        value: property.rent
      });
    }
    return acc;
  }, [] as Array<{ status: string; count: number; value: number }>);
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="var(--primary)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## Conclusion

This property management application demonstrates a sophisticated React architecture with:

- **Comprehensive Component Library**: 40+ base UI components built on Radix UI
- **Business Logic Components**: Specialized components for property management workflows
- **Type-Safe Development**: Full TypeScript integration with detailed interfaces
- **Modern Styling**: Tailwind CSS with custom design system
- **Accessible Design**: WCAG-compliant components with proper ARIA support
- **Responsive Layout**: Mobile-first design with adaptive layouts
- **State Management**: Centralized state with clear data flow patterns
- **Performance Optimization**: Memoization, lazy loading, and efficient re-renders

The component specifications provide a solid foundation for building similar property management applications or extending the existing functionality. The modular architecture allows for easy customization and extension while maintaining consistency and accessibility standards.
