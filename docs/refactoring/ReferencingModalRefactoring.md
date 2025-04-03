# ReferencingModal Refactoring Plan

## Current Structure

The `ReferencingModal` component is currently a large, monolithic component with the following responsibilities:

1. Managing the multi-step form state
2. Rendering different form sections based on the current step
3. Handling form data updates
4. Simulating API calls for saving and submitting data
5. Managing UI state (loading, saving, etc.)
6. Rendering the sidebar navigation
7. Handling file uploads

This structure makes the component difficult to maintain and extend. The refactoring plan aims to break it down into smaller, more focused components.

## Refactoring Goals

1. Improve code organization and maintainability
2. Enhance user experience with better validation and feedback
3. Add data persistence with localStorage
4. Prepare for real API integration
5. Maintain compatibility with the existing authentication system

## Component Breakdown

### 1. Container Component

**`ReferencingModal.tsx`** (Container)
- Manages the overall state of the form
- Coordinates between child components
- Handles API calls and data persistence
- Maintains compatibility with the existing props interface

```typescript
interface ReferencingModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### 2. Sidebar Component

**`ReferencingSidebar.tsx`**
- Displays the step navigation
- Shows progress indicator
- Handles step navigation clicks

```typescript
interface ReferencingSidebarProps {
  currentStep: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
  completedSteps: number[];
}
```

### 3. Form Section Components

Each form section will be extracted into its own component:

**`IdentitySection.tsx`**
```typescript
interface IdentitySectionProps {
  data: IdentityData;
  onChange: (data: Partial<IdentityData>) => void;
  onFileUpload: (file: File) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
}
```

**`EmploymentSection.tsx`**
```typescript
interface EmploymentSectionProps {
  data: EmploymentData;
  onChange: (data: Partial<EmploymentData>) => void;
  onFileUpload: (file: File) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
}
```

**`ResidentialSection.tsx`**
```typescript
interface ResidentialSectionProps {
  data: ResidentialData;
  onChange: (data: Partial<ResidentialData>) => void;
  onFileUpload: (file: File) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
}
```

**`FinancialSection.tsx`**
```typescript
interface FinancialSectionProps {
  data: FinancialData;
  onChange: (data: Partial<FinancialData>) => void;
  onFileUpload: (file: File) => void;
  onConnectOpenBanking: () => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
}
```

**`GuarantorSection.tsx`**
```typescript
interface GuarantorSectionProps {
  data: GuarantorData;
  onChange: (data: Partial<GuarantorData>) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
}
```

**`CreditCheckSection.tsx`**
```typescript
interface CreditCheckSectionProps {
  data: CreditCheckData;
  identityData: IdentityData;
  onChange: (data: Partial<CreditCheckData>) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
}
```

### 4. Reusable UI Components

**`FileUpload.tsx`**
```typescript
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  label: string;
  description?: string;
  selectedFile?: File | null;
  error?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}
```

**`ProgressBar.tsx`**
```typescript
interface ProgressBarProps {
  progress: number;
  label?: string;
}
```

**`FormField.tsx`**
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}
```

### 5. Validation Utilities

**`validation.ts`**
- Contains validation functions for each form section
- Returns error messages for invalid fields

```typescript
export function validateIdentityData(data: IdentityData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!data.firstName) {
    errors.firstName = 'First name is required';
  }
  
  // More validation rules...
  
  return errors;
}

// Similar functions for other sections...
```

### 6. Data Persistence Utilities

**`storage.ts`**
- Handles saving and loading form data from localStorage

```typescript
export function saveFormData(formData: FormData): void {
  localStorage.setItem('referencingFormData', JSON.stringify(formData));
}

export function loadFormData(): FormData | null {
  const savedData = localStorage.getItem('referencingFormData');
  return savedData ? JSON.parse(savedData) : null;
}
```

## Implementation Steps

### Phase 1: Create Base Components

1. Create the folder structure for the new components
2. Implement the reusable UI components
3. Create skeleton implementations of the form section components
4. Implement the sidebar component

### Phase 2: Implement Form Sections

1. Extract the form section rendering logic from ReferencingModal
2. Implement validation for each section
3. Add error display to form fields
4. Implement file upload component with progress indicator

### Phase 3: Refactor Container Component

1. Update ReferencingModal to use the new components
2. Implement data persistence with localStorage
3. Add form validation before step navigation
4. Enhance error handling and user feedback

### Phase 4: Add API Integration Preparation

1. Create service functions for API calls
2. Update the container component to use these services
3. Add proper error handling for API calls
4. Implement loading and error states

## Testing Strategy

1. Create unit tests for validation functions
2. Create component tests for form sections
3. Create integration tests for the complete form flow
4. Test edge cases like validation errors and API failures

## Backward Compatibility

To ensure backward compatibility with the existing authentication system:

1. Maintain the same props interface for ReferencingModal
2. Continue using the AuthContext for user data
3. Preserve the reset mechanism when the modal is opened
4. Keep the same event handling for modal open/close

## Protected Authentication Elements

> **IMPORTANT**: The following authentication elements must be preserved:

1. `AuthContext.tsx` - Core authentication logic
2. `login()`, `logout()`, and `editProfile()` methods
3. Azure B2C integration in `authConfig.ts`
4. Authentication state management in `Referencing.tsx`
5. The event dispatch mechanism after successful login 