# Backend Integration Guide

This document provides instructions for setting up the backend integration with Azure services for the referencing form application.

## Overview

The application integrates with the following Azure services:

1. **Azure SQL Database** - For storing application data
2. **Azure Storage Account** - For storing uploaded documents
3. **Azure API** - For backend API services
4. **Azure AD B2C** - For authentication (optional)

## Setup Instructions

### 1. Environment Configuration

1. Copy the `.env.template` file to a new file named `.env.local`:
   ```bash
   cp .env.template .env.local
   ```

2. Fill in the environment variables in `.env.local` with your Azure credentials:
   ```
   # API Configuration
   VITE_API_BASE_URL=https://your-api-url.azurewebsites.net/api
   
   # Azure Storage Configuration
   VITE_AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
   VITE_AZURE_STORAGE_CONTAINER_NAME=documents
   VITE_AZURE_STORAGE_SAS_TOKEN=?sv=2020-08-04&ss=...
   
   # Azure AD B2C Configuration (if using)
   VITE_AZURE_AD_B2C_CLIENT_ID=your-client-id
   VITE_AZURE_AD_B2C_AUTHORITY=https://yourtenant.b2clogin.com/yourtenant.onmicrosoft.com/B2C_1_signin
   VITE_AZURE_AD_B2C_KNOWN_AUTHORITY=yourtenant.b2clogin.com
   VITE_AZURE_AD_B2C_REDIRECT_URI=http://localhost:5173
   VITE_AZURE_AD_B2C_SCOPES="openid profile email"
   ```

### 2. Azure SQL Database

The application uses Azure SQL Database to store referencing application data.

1. Create an Azure SQL Database if you haven't already:
   - Go to the Azure Portal
   - Create a new SQL Database resource
   - Configure server, database name, and authentication

2. Set up the database schema:
   - The backend API should handle database schema creation
   - Ensure the database user has appropriate permissions

3. Update the `.env.local` file with your SQL Database credentials:
   ```
   VITE_AZURE_SQL_SERVER=yourserver.database.windows.net
   VITE_AZURE_SQL_DATABASE=yourdatabase
   VITE_AZURE_SQL_USERNAME=yourusername
   VITE_AZURE_SQL_PASSWORD=yourpassword
   ```

### 3. Azure Storage Account

The application uses Azure Storage Account to store uploaded documents.

1. Create an Azure Storage Account if you haven't already:
   - Go to the Azure Portal
   - Create a new Storage Account resource
   - Create a container named "documents" (or your preferred name)

2. Generate a SAS token for the container:
   - Go to your Storage Account in the Azure Portal
   - Navigate to "Shared access signature"
   - Configure permissions (Read, Write, Delete, List)
   - Set an appropriate expiry time
   - Generate the SAS token

3. Update the `.env.local` file with your Storage Account details:
   ```
   VITE_AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
   VITE_AZURE_STORAGE_CONTAINER_NAME=documents
   VITE_AZURE_STORAGE_SAS_TOKEN=?sv=2020-08-04&ss=...
   ```

### 4. Azure API

The application communicates with a backend API hosted on Azure.

1. Ensure your API is deployed and accessible
2. Update the `.env.local` file with your API URL:
   ```
   VITE_API_BASE_URL=https://your-api-url.azurewebsites.net/api
   ```

3. API Endpoints:
   The frontend expects the following API endpoints:

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

### 5. Authentication (Optional)

The application can use Azure AD B2C for authentication.

1. Create an Azure AD B2C tenant if you haven't already
2. Register your application in Azure AD B2C
3. Configure user flows for sign-up and sign-in
4. Update the `.env.local` file with your Azure AD B2C details:
   ```
   VITE_AZURE_AD_B2C_CLIENT_ID=your-client-id
   VITE_AZURE_AD_B2C_AUTHORITY=https://yourtenant.b2clogin.com/yourtenant.onmicrosoft.com/B2C_1_signin
   VITE_AZURE_AD_B2C_KNOWN_AUTHORITY=yourtenant.b2clogin.com
   VITE_AZURE_AD_B2C_REDIRECT_URI=http://localhost:5173
   VITE_AZURE_AD_B2C_SCOPES="openid profile email"
   ```

## Testing the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the referencing form page
3. Test file uploads to ensure they are stored in Azure Storage
4. Test form submissions to ensure data is saved to Azure SQL Database
5. Test authentication if configured

## Troubleshooting

### Storage Issues

- Check that your SAS token has the correct permissions
- Ensure the container exists in your Storage Account
- Check for CORS issues if uploads fail

### API Issues

- Verify the API URL is correct
- Check that the API is running and accessible
- Verify the API endpoints match the expected format

### Authentication Issues

- Check that your Azure AD B2C configuration is correct
- Ensure the redirect URI matches your application URL
- Verify that the scopes are configured correctly 