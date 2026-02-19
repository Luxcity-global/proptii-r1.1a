# Referencing Modal Integration with Dashboard

## Overview
This document describes the integration between the Referencing Modal and the Dashboard Home page's Tenant Insights section.

## Changes Made

### 1. DashboardHome.tsx Updates

#### Added Imports
```typescript
import ReferencingModal from '../../referencing/ReferencingModal';
import { ReferencingProvider, useReferencing } from '../../referencing/context/ReferencingContext';
```

#### Added State Management
- `isReferencingModalOpen`: Controls modal visibility
- `referencingStep`: Tracks which step to open (1-6)
- `selectedPropertyId`: Property ID for the referencing application (demo: 'demo-property-123')

#### Added Handler Functions
- `openReferencingModal(step: number)`: Opens modal at specific step
- `closeReferencingModal()`: Closes the modal

#### Updated Alert Cards
Each alert card in the Tenant Insights section now has a clickable button that opens the corresponding referencing step:

| Alert Card | Step Number | Form Section |
|------------|-------------|--------------|
| Identity | 1 | Identity Section |
| Employment | 2 | Employment Section |
| Residential | 3 | Residential Section |
| Financial | 4 | Financial Section |
| Guarantor | 5 | Guarantor Section |
| Credit Check | 6 | Credit Check Section |

#### Added Modal Component
Created `ReferencingModalWithStep` helper component that:
- Sets the current step when the modal opens
- Wraps the ReferencingModal with the step-setting logic
- Uses the ReferencingContext's `setCurrentStep` function

### 2. ReferencingContext.tsx Updates

#### Resolved Merge Conflicts
- Combined imports from both HEAD and upstream branches
- Unified context type definitions
- Merged validation logic

#### Updated Context Type
The `ReferencingContextType` now includes all necessary properties:
```typescript
interface ReferencingContextType {
  state: ReferencingState;
  dispatch: React.Dispatch<ReferencingAction>;
  updateFormData: (section: FormSection, data: any) => void;
  saveCurrentStep: () => Promise<boolean>;
  submitApplication: () => Promise<boolean>;
  nextStep: () => void;
  prevStep: () => void;
  setCurrentStep: (step: FormSection | number) => void;
  saveAsDraft: (name: string) => Promise<boolean>;
  setPropertyId: (id: string) => void;
  uploadDocument: (section: FormSection, field: string, file: File) => Promise<string | null>;
  formData: FormData;
  errors: {
    [K in keyof FormData]?: {
      [key: string]: string;
    };
  };
  validateSection: (section: keyof FormData) => Promise<boolean>;
  currentStep: number;
}
```

#### Context Provider Values
The provider now exports:
- All state management functions
- Direct access to `formData`, `errors`, `currentStep`
- `validateSection` function for form validation

## User Flow

1. User navigates to Dashboard Home page
2. Sees Tenant Insights section with 6 alert cards showing completion status
3. Clicks "View More" (or "Edit" for completed sections) button on any alert card
4. Modal opens at the specific step for that alert
5. User can fill in the form for that section
6. Form data is automatically saved to localStorage
7. User can navigate between steps using Back/Next buttons
8. When user closes the modal, dashboard automatically updates to show completed sections with green checkmarks
9. User can submit the complete application
10. Modal closes on submission or when user clicks Close

### Completion Status Visual Feedback

- **Incomplete sections**: Show orange/red/yellow AlertTriangle icon with "View More" button
- **Completed sections**: Show green CheckCircle icon with "Edit" button
- **Dynamic updates**: Dashboard refreshes completion status when modal closes

## Technical Details

### Step Indexing
- The modal uses 1-based indexing (steps 1-6)
- The context properly handles both number and FormSection string values
- Helper component ensures the correct step is set when opening the modal

### Context Provider
- The modal is wrapped with `ReferencingProvider` that requires a `propertyId`
- Provider manages all form state, validation, and submission
- Data is persisted to localStorage or Azure backend depending on configuration

### Completion Detection

**localStorage Key**: `property_{propertyId}_draft`  
(Example: `property_demo-property-123_draft`)

The dashboard uses the **EXACT SAME** completion logic as `ReferencingSidebar.isStepCompleted()`:

| Section | Completion Criteria |
|---------|---------------------|
| **Identity** | `firstName` AND `lastName` AND `email` are filled |
| **Employment** | `employmentStatus` is filled |
| **Residential** | `currentAddress` is filled |
| **Financial** | Any data exists in financial object |
| **Guarantor** | Any data exists in guarantor object |
| **Credit Check** | `hasAgreedToCheck` is `true` |

**When checks run:**
1. When the dashboard component mounts
2. When the referencing modal closes (triggers refresh)
3. When storage events fire (for multi-tab sync)

**Data Flow:**
1. User types in modal → `updateFormData()` called
2. Context calls `updateSection()` from `useLocalStorage` hook
3. Hook saves to localStorage automatically (line 45-49 of useLocalStorage.ts)
4. Dashboard detects modal close → reads from localStorage
5. Dashboard updates UI with green checkmarks for completed sections

### Error Handling
- Each section can have validation errors
- Errors are displayed inline in the form
- Modal checks API availability before opening

## Future Improvements

1. **Dynamic Property Selection**: Instead of using a hardcoded `demo-property-123`, fetch the actual property ID from the alert data
2. **Real-time Updates**: Add websocket or polling to update alert status after form submission
3. **Progress Tracking**: Show visual progress indicator in the dashboard cards
4. **Notification System**: Add toast notifications when forms are saved/submitted
5. **Alert Prioritization**: Sort alerts by due date or severity

## Testing

To test the integration:

1. Navigate to `/dashboard` (Dashboard Home)
2. Scroll to "Tenant Insights" section
3. Click "View More" on any of the 6 alert cards
4. Verify the modal opens with the correct form section
5. Fill in some form data
6. Click Back/Next to navigate between steps
7. Verify form data persists between steps
8. Submit the application
9. Verify the modal closes

## Files Modified

- `src/components/dashboard/sections/DashboardHome.tsx`
- `src/components/referencing/context/ReferencingContext.tsx`

## Files Referenced

- `src/components/referencing/ReferencingModal.tsx`
- `src/components/referencing/sections/IdentitySection.tsx`
- `src/components/referencing/sections/EmploymentSection.tsx`
- `src/components/referencing/sections/ResidentialSection.tsx`
- `src/components/referencing/sections/FinancialSection.tsx`
- `src/components/referencing/sections/GuarantorSection.tsx`
- `src/components/referencing/sections/CreditCheckSection.tsx`

