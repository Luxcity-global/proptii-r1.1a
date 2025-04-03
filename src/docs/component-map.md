# Proptii Application Component Map

## Referencing Module Structure

### Core Components

1. **ReferencingModal** (`src/components/referencing/ReferencingModal.tsx`)
   - Main container component for the referencing process
   - Manages the modal dialog and layout
   - Uses ReferencingProvider for state management
   - Contains sub-components:
     - MobileStepper (for mobile view)
     - FormContent (renders the current form section)

2. **ReferencingForm** (`src/components/referencing/ui/ReferencingForm.tsx`)
   - Generic form wrapper that renders the appropriate section form
   - Handles form submission and navigation
   - Displays error messages and loading states

3. **ReferencingSidebar** (`src/components/referencing/ui/ReferencingSidebar.tsx`)
   - Navigation sidebar for desktop view
   - Shows progress through the referencing steps

### Section Forms

1. **IdentityForm** (`src/components/referencing/sections/IdentityForm.tsx`)
   - Collects personal identity information
   - Fields: firstName, lastName, email, phoneNumber, dateOfBirth, nationality, identityProof

2. **EmploymentForm** (`src/components/referencing/sections/EmploymentForm.tsx`)
   - Collects employment information
   - Fields: employmentStatus, companyDetails, lengthOfEmployment, jobPosition, references, proof documents

3. **ResidentialForm** (`src/components/referencing/sections/ResidentialForm.tsx`)
   - Collects residential history
   - Fields: currentAddress, durationAtCurrentAddress, previousAddress, reasonForLeaving, proof documents

4. **FinancialForm** (`src/components/referencing/sections/FinancialForm.tsx`)
   - Collects financial information
   - Fields: proofOfIncomeType, proofOfIncomeDocument, openBanking options

5. **GuarantorForm** (`src/components/referencing/sections/GuarantorForm.tsx`)
   - Collects guarantor information
   - Fields: firstName, lastName, email, phoneNumber, address

6. **CreditCheckForm** (`src/components/referencing/sections/CreditCheckForm.tsx`)
   - Handles credit check consent
   - Fields: hasAgreedToCheck

### Context and State Management

1. **ReferencingContext** (`src/components/referencing/context/ReferencingContext.tsx`)
   - Provides state management for the entire referencing process
   - Manages form data, validation, and API interactions
   - Exposes functions for navigation and data manipulation

### Custom Hooks

1. **useReferencingForm** (`src/components/referencing/hooks/useReferencingForm.ts`)
   - Handles form submission logic
   - Manages form validation and error states

2. **useFormValidation** (`src/components/referencing/hooks/useFormValidation.ts`)
   - Provides validation rules for each form section
   - Returns validation errors based on form data

## Data Types

The referencing module uses the following data types defined in `src/types/referencing.ts`:

1. **FormSection** - Union type of all section names
2. **FormData** - Complete form data structure
3. **IdentityData** - Identity section data structure
4. **EmploymentData** - Employment section data structure
5. **ResidentialData** - Residential section data structure
6. **FinancialData** - Financial section data structure
7. **GuarantorData** - Guarantor section data structure
8. **CreditCheckData** - Credit check section data structure

## Component Relationships

```
ReferencingModal
├── ReferencingProvider (Context)
│   └── ReferencingContext
├── MobileStepper (Mobile view)
├── ReferencingSidebar (Desktop view)
└── FormContent
    └── ReferencingForm
        ├── IdentityForm
        ├── EmploymentForm
        ├── ResidentialForm
        ├── FinancialForm
        ├── GuarantorForm
        └── CreditCheckForm
```

## Authentication Integration

The referencing module integrates with the application's authentication system:
- Uses MSAL for authentication (Azure AD B2C)
- Retrieves tokens for API calls
- Handles authentication errors and redirects 