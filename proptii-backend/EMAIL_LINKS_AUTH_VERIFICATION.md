# Email Links Authentication & Redirect Verification

This document confirms that all email template links are properly configured with authentication and redirect handling.

## Authentication Flow

All protected routes in the frontend use the `ProtectedRoute` component which:
1. Checks if user is authenticated
2. If not authenticated, stores the intended destination in `sessionStorage` and as a query parameter
3. Redirects to `/login?redirect=<intended-path>`
4. After successful login, redirects user back to the intended page

## Email Template Links Verification

### 1. Referencing Emails (`email.service.ts`)

#### Agent Email (`agent`)
- **Link**: `${baseUrl}/landlord/clients`
- **Route**: `/landlord/*` (Protected via `ProtectedRoute`)
- **Auth Status**: ✅ Protected - Will redirect to login if not authenticated
- **Redirect Path**: Stored and restored after login

#### User Email (`user`)
- **Link**: `${baseUrl}/dashboard/tenant-referencing`
- **Route**: `/dashboard/*` (Protected via `ProtectedRoute`)
- **Auth Status**: ✅ Protected - Will redirect to login if not authenticated
- **Redirect Path**: Stored and restored after login

#### Referee Email (`referee`)
- **Link**: `${baseUrl}/?responseType=referee&applicant=...&email=...&tenantEmail=...`
- **Route**: `/` (Public route - no authentication required)
- **Auth Status**: ✅ Public - No auth needed (external reference form)

#### Guarantor Email (`guarantor`)
- **Link**: `${baseUrl}/?responseType=guarantor&applicant=...&email=...&tenantEmail=...`
- **Route**: `/` (Public route - no authentication required)
- **Auth Status**: ✅ Public - No auth needed (external guarantor form)

### 2. Viewing Emails (`email.service.ts`)

#### Viewing Agent Email (`viewing-agent`)
- **Link**: `${baseUrl}/landlord/viewings`
- **Route**: `/landlord/viewings` (Protected via `ProtectedRoute`)
- **Auth Status**: ✅ Protected - Will redirect to login if not authenticated
- **Redirect Path**: Stored and restored after login

#### Viewing User Email (`viewing-user`)
- **Link**: `${baseUrl}/dashboard/viewings`
- **Route**: `/dashboard/viewings` (Protected via `ProtectedRoute`)
- **Auth Status**: ✅ Protected - Will redirect to login if not authenticated
- **Redirect Path**: Stored and restored after login

#### Viewing Confirmed Email (`viewing-confirmed`)
- **Link**: `${baseUrl}/dashboard/viewings`
- **Route**: `/dashboard/viewings` (Protected via `ProtectedRoute`)
- **Auth Status**: ✅ Protected - Will redirect to login if not authenticated
- **Redirect Path**: Stored and restored after login

#### Viewing Reschedule Email (`viewing-reschedule`)
- **Link**: `${baseUrl}${ctaPath}` where `ctaPath` is:
  - `/dashboard/viewings` (if manager initiated - tenant receives email)
  - `/landlord/viewings` (if tenant initiated - landlord receives email)
- **Routes**: Both protected via `ProtectedRoute`
- **Auth Status**: ✅ Protected - Will redirect to login if not authenticated
- **Redirect Path**: Stored and restored after login

#### Viewing Cancel Email (`viewing-cancel` / `viewing-cancellation`)
- **Link**: `${baseUrl}${ctaPath}` where `ctaPath` is:
  - `/dashboard/viewings` (if manager initiated - tenant receives email)
  - `/landlord/viewings` (if tenant initiated - landlord receives email)
- **Routes**: Both protected via `ProtectedRoute`
- **Auth Status**: ✅ Protected - Will redirect to login if not authenticated
- **Redirect Path**: Stored and restored after login

### 3. Contract Emails (`contract-email.service.ts`)

#### Signed Contract Email
- **Link**: `${baseUrl}/landlord/contracts?tab=signed`
- **Route**: `/landlord/contracts` (Protected via `ProtectedRoute`)
- **Auth Status**: ✅ Protected - Will redirect to login if not authenticated
- **Redirect Path**: Stored and restored after login (includes query params)

## Frontend Implementation Details

### ProtectedRoute Component (`src/components/common/ProtectedRoute.tsx`)
- Checks authentication status
- Stores redirect path in `sessionStorage` and query parameter
- Redirects to `/login?redirect=<path>`

### Login Page (`src/pages/Login.tsx`)
- Reads redirect from:
  1. Query parameter (`?redirect=...`)
  2. Location state (from ProtectedRoute)
  3. SessionStorage (backup)
- After successful login, redirects to stored path

### LandlordDemo Component (`src/pages/LandlordDemo.tsx`)
- Shows login prompt if not authenticated
- Stores current path before redirecting to login
- Includes redirect in login button URL

## Summary

✅ **All protected email links are properly configured:**
- 9 protected links (require authentication)
- 2 public links (referee/guarantor forms - no auth needed)
- All protected links will automatically redirect to login if user is not authenticated
- After login, users are redirected back to the intended page
- Query parameters are preserved in redirects

## Testing Checklist

- [ ] Click agent email link → Should redirect to login if not authenticated → After login, should go to `/landlord/clients`
- [ ] Click user email link → Should redirect to login if not authenticated → After login, should go to `/dashboard/tenant-referencing`
- [ ] Click viewing-agent email link → Should redirect to login if not authenticated → After login, should go to `/landlord/viewings`
- [ ] Click viewing-user email link → Should redirect to login if not authenticated → After login, should go to `/dashboard/viewings`
- [ ] Click viewing-confirmed email link → Should redirect to login if not authenticated → After login, should go to `/dashboard/viewings`
- [ ] Click viewing-reschedule email link (tenant) → Should redirect to login if not authenticated → After login, should go to `/dashboard/viewings`
- [ ] Click viewing-reschedule email link (landlord) → Should redirect to login if not authenticated → After login, should go to `/landlord/viewings`
- [ ] Click viewing-cancel email link (tenant) → Should redirect to login if not authenticated → After login, should go to `/dashboard/viewings`
- [ ] Click viewing-cancel email link (landlord) → Should redirect to login if not authenticated → After login, should go to `/landlord/viewings`
- [ ] Click contract email link → Should redirect to login if not authenticated → After login, should go to `/landlord/contracts?tab=signed`






















