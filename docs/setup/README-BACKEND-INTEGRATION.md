# Proptii Backend Integration

This document provides an overview of the backend integration implemented for the Proptii referencing form application.

## Overview

The application now integrates with Azure backend services for:

1. **Form Data Storage**: Saving and retrieving form data via API
2. **Document Upload**: Uploading documents directly to Azure Storage
3. **Application Management**: Creating, updating, and submitting applications

## Components Implemented

### 1. API Service Layer

- **Base API Service** (`src/services/api.ts`): Handles HTTP requests, authentication, and error handling
- **Referencing Service** (`src/services/referencingService.ts`): Provides specific methods for referencing form operations

### 2. Azure Storage Integration

- **Storage Service** (`src/services/storageService.ts`): Manages file uploads to Azure Blob Storage
- **DocumentUpload Component** (`src/components/referencing/ui/DocumentUpload.tsx`): Enhanced to upload files directly to Azure Storage

### 3. Context Integration

- **ReferencingContext** (`src/components/referencing/context/ReferencingContext.tsx`): Updated to use API services for data persistence
- **Form Components**: Updated to use the new DocumentUpload component with proper section and field props

### 4. Configuration

- **Azure Configuration** (`src/config/azure.ts`): Manages Azure service configuration
- **Environment Variables**: Added in `.env.local` for Azure service credentials

## Testing the Integration

A test page has been created to verify the backend integration:

- **URL**: `/backend-test`
- **Features**:
  - Create an application
  - Upload a document
  - Save section data
  - Submit an application

## How to Use

### 1. Configure Environment Variables

Copy the `.env.template` file to `.env.local` and fill in your Azure credentials:

```bash
cp .env.template .env.local
```

Required variables:
- `VITE_API_BASE_URL`: Your API base URL
- `VITE_AZURE_STORAGE_ACCOUNT_NAME`: Your Azure Storage account name
- `VITE_AZURE_STORAGE_CONTAINER_NAME`: Your Azure Storage container name
- `VITE_AZURE_STORAGE_SAS_TOKEN`: Your Azure Storage SAS token
- `VITE_AZURE_AD_B2C_CLIENT_ID`: Your Azure AD B2C client ID
- `VITE_AZURE_AD_B2C_AUTHORITY`: Your Azure AD B2C authority URL
- `VITE_AZURE_AD_B2C_KNOWN_AUTHORITY`: Your Azure AD B2C known authority
- `VITE_AZURE_AD_B2C_REDIRECT_URI`: Your Azure AD B2C redirect URI
- `VITE_AZURE_AD_B2C_SCOPES`: Your Azure AD B2C scopes

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Test the Integration

Navigate to `/backend-test` in your browser to test the backend integration.

## API Endpoints

The application expects the following API endpoints:

- **Create Application**: `POST /referencing/applications`
- **Get Application**: `GET /referencing/applications/{applicationId}`
- **Get Application Status**: `GET /referencing/applications/{applicationId}/status`
- **Save Section Data**: `PUT /referencing/applications/{applicationId}/sections/{section}`
- **Submit Application**: `POST /referencing/applications/{applicationId}/submit`
- **Upload Document**: `POST /referencing/applications/{applicationId}/documents`
- **Get Documents**: `GET /referencing/applications/{applicationId}/documents`
- **Delete Document**: `DELETE /referencing/applications/{applicationId}/documents/{documentId}`
- **Save Draft**: `POST /referencing/applications/{applicationId}/drafts`
- **Get Drafts**: `GET /referencing/applications/{applicationId}/drafts`
- **Load Draft**: `GET /referencing/applications/{applicationId}/drafts/{draftId}`
- **Delete Draft**: `DELETE /referencing/applications/{applicationId}/drafts/{draftId}`

## Fallback Mechanism

The application includes a fallback mechanism to use localStorage when the API is not available or not configured. This ensures that the application can still function in development environments without a backend.

## Security Considerations

- SAS tokens should have appropriate permissions and expiration dates
- Azure AD B2C should be configured with proper scopes and redirect URIs
- Environment variables should never be committed to version control

## Next Steps

1. Implement the backend API endpoints
2. Set up Azure SQL Database for data storage
3. Configure Azure Storage for document storage
4. Implement authentication and authorization
5. Deploy the application to production 