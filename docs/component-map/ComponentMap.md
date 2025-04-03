# Proptii Application Component Map

## Application Structure

```
App
├── AuthContext (Provider)
│   └── MsalAuthProvider
├── Routing
│   ├── Home Page
│   │   ├── Navbar
│   │   ├── Search Section
│   │   ├── Property Results
│   │   ├── PropertyModal (conditional)
│   │   ├── FAQSection
│   │   └── Footer
│   ├── Referencing Page
│   │   ├── Navbar
│   │   ├── Hero Section
│   │   ├── Steps Section
│   │   ├── FAQSection
│   │   ├── Footer
│   │   └── ReferencingModal (conditional)
│   │       ├── Sidebar Navigation
│   │       ├── Form Content (step-based)
│   │       └── Action Buttons
```

## Core Components

### Authentication Components

#### `AuthContext.tsx`
- **Purpose**: Manages authentication state and methods
- **Props**: 
  - `pca`: IPublicClientApplication
  - `children`: React.ReactNode
- **State**:
  - `isAuthenticated`: boolean
  - `user`: UserProfile | null
  - `error`: string | null
- **Methods**:
  - `login()`: Initiates login process with Azure B2C
  - `logout()`: Handles user logout
  - `editProfile()`: Allows user to edit their profile
- **Dependencies**:
  - MSAL library
  - Azure B2C configuration

#### `MsalAuthProvider`
- **Purpose**: Wrapper for Microsoft Authentication Library
- **Props**:
  - `instance`: IPublicClientApplication
  - `children`: React.ReactNode
- **Dependencies**:
  - MSAL library
  - AuthProvider component

### Page Components

#### `Home.tsx`
- **Purpose**: Main landing page with property search functionality
- **State**:
  - `searchQuery`: string
  - `searchResults`: SearchResult | null
  - `isLoading`: boolean
  - `error`: string | null
  - `isModalOpen`: boolean
  - `selectedProperty`: 'openrent' | 'zoopla' | null
- **Methods**:
  - `handleSearch()`: Sends search query to Azure API
- **Dependencies**:
  - Azure AI Inference client
  - Navbar, Footer, FAQSection components
  - PropertyModal component

#### `Referencing.tsx`
- **Purpose**: Page for referencing process
- **State**:
  - `isModalOpen`: boolean
  - `wasAuthenticated`: boolean
  - `loginAttempted`: boolean
- **Methods**:
  - `handleGetStarted()`: Opens modal or initiates login
- **Dependencies**:
  - AuthContext
  - ReferencingModal
  - Navbar, Footer, FAQSection components

### UI Components

#### `Navbar.tsx`
- **Purpose**: Site navigation
- **Props**: None
- **State**:
  - `isDropdownOpen`: boolean
- **Dependencies**:
  - AuthContext for user authentication state
  - React Router for navigation
  - Lucide React for icons

#### `Footer.tsx`
- **Purpose**: Site footer
- **Props**: None
- **Dependencies**:
  - React Router for navigation
  - Lucide React for icons

#### `FAQSection.tsx`
- **Purpose**: FAQ display
- **Props**: None
- **State**: None
- **Dependencies**:
  - React Router for navigation
  - Lucide React for icons

#### `PropertyModal.tsx`
- **Purpose**: Modal for property details from search results
- **Props**:
  - `isOpen`: boolean
  - `onClose`: () => void
  - `searchQuery`: string
  - `searchResults`: any
  - `selectedProperty`: 'openrent' | 'zoopla' | null
- **Methods**:
  - `parseResults()`: Parses URLs from API response
  - `handleViewListings()`: Opens property listings in new tab
- **Dependencies**:
  - Lucide React for icons

#### `ReferencingModal.tsx`
- **Purpose**: Multi-step form modal for referencing process
- **Props**:
  - `isOpen`: boolean
  - `onClose`: () => void
- **State**:
  - `currentStep`: number
  - `formData`: FormData (complex object with sections)
  - `lastSaved`: Date | null
  - `isSaving`: boolean
  - `isSubmitting`: boolean
- **Methods**:
  - `updateFormData()`: Updates form data for a specific section
  - `saveCurrentStep()`: Simulates saving current form data
  - `goToStep()`: Navigates to a specific step
  - `nextStep()`: Moves to the next step
  - `prevStep()`: Moves to the previous step
  - `submitApplication()`: Simulates submitting the application
- **Dependencies**:
  - AuthContext for user data
  - Lucide React for icons

#### `ReferencingForm.tsx`
- **Purpose**: Alternative form component for referencing
- **Props**: None
- **State**:
  - `formData`: FormData
  - `step`: number
  - `isSubmitting`: boolean
  - `submitSuccess`: boolean
- **Methods**:
  - `handleChange()`: Updates form data
  - `nextStep()`: Moves to next step
  - `prevStep()`: Moves to previous step
  - `handleSubmit()`: Submits the form
- **Dependencies**:
  - AuthContext for user data

## Form Sections in ReferencingModal

### Identity Section
- **Fields**:
  - First Name
  - Last Name
  - Email Address
  - Phone Number
  - Date of Birth
  - British Citizenship
  - Nationality
  - Identity Proof Upload

### Employment Section
- **Fields**:
  - Employment Status
  - Company Details
  - Length of Employment
  - Job Position
  - Reference Full Name
  - Reference Email
  - Reference Phone
  - Proof Type
  - Proof Document Upload

### Residential Section
- **Fields**:
  - Current Address
  - Duration at Current Address
  - Previous Address
  - Duration at Previous Address
  - Reason for Leaving
  - Proof Type
  - Proof Document Upload

### Financial Section
- **Fields**:
  - Proof of Income Type
  - Proof of Income Document Upload
  - Open Banking Connection Option

### Guarantor Section
- **Fields**:
  - First Name
  - Last Name
  - Email Address
  - Phone Number
  - Address

### Credit Check Section
- **Fields**:
  - Agreement Checkbox
  - Display of Personal Details

## API Simulation Functions

### In ReferencingModal
- `saveCurrentStep()`: Simulates saving form data with a timeout
- `submitApplication()`: Simulates submitting the application with a timeout

### In AuthContext
- `login()`: Real Azure B2C authentication
- `logout()`: Real Azure B2C logout
- `editProfile()`: Real Azure B2C profile editing

### In Home
- `handleSearch()`: Real API call to Azure AI Inference for property search

## Authentication Configuration

### Azure B2C Configuration (`authConfig.ts`)
- **Client ID**: 49f7bfc0-cab3-4c54-aa25-279cc788551f
- **Authority**: proptii.b2clogin.com
- **Policies**:
  - Sign Up/Sign In: B2C_1_SignUpandSignInProptii
  - Password Reset: B2C_1_passwordreset
  - Profile Editing: B2C_1_profileediting
- **Scopes**: openid, profile, email, offline_access

## Authentication Flow

1. User clicks "Get Started" on Referencing page
2. If not authenticated, `loginAttempted` is set to true and `login()` is called
3. After successful authentication, `isAuthenticated` becomes true
4. useEffect in Referencing.tsx detects the change and opens the modal
5. User data from authentication is used to pre-fill some form fields

## Refactoring Opportunities

### ReferencingModal
- Split into smaller components:
  - Sidebar component
  - Step navigation component
  - Form section components (one per step)
  - File upload component
  - Progress indicator component

### Form Validation
- Add validation for each form section
- Prevent progression if required fields are not filled

### Data Persistence
- Add local storage for form data
- Implement actual API calls for saving data

## Protected Authentication Elements

> **IMPORTANT**: The following authentication elements must be preserved:

1. `AuthContext.tsx` - Core authentication logic
2. `login()`, `logout()`, and `editProfile()` methods
3. Azure B2C integration in `authConfig.ts`
4. Authentication state management in `Referencing.tsx`
5. The event dispatch mechanism after successful login 