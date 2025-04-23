# API Simulation Documentation

## Overview

The application currently uses simulated API functions for development purposes. These functions are defined in `src/services/api.ts` and provide mock implementations of backend functionality.

## API Service Structure

The API service uses Axios for HTTP requests and includes:
- A base Axios instance with default configuration
- Request interceptors for authentication
- Mock data for testing
- Error handling and response formatting

## Authentication Integration

The API service integrates with the MSAL authentication system:
1. Attempts to acquire tokens silently from MSAL
2. Falls back to localStorage token if MSAL fails
3. Adds the token to the Authorization header

## Available API Functions

### Property Management

1. **getProperties**
   - Purpose: Retrieves a list of properties
   - Parameters: None
   - Returns: `ApiResponse<any[]>` with mock property data
   - Implementation: Currently returns hardcoded mock data

### Referencing Application

1. **saveSectionData**
   - Purpose: Saves data for a specific section of a referencing application
   - Parameters:
     - `applicationId`: string - The ID of the application
     - `section`: string - The section name (e.g., 'identity', 'employment')
     - `data`: Record<string, any> - The section data to save
   - Returns: `ApiResponse<any>` with the saved data
   - Implementation: Makes a PUT request to `/applications/{applicationId}/{section}`

2. **uploadDocument**
   - Purpose: Uploads a document for a specific section
   - Parameters:
     - `applicationId`: string - The ID of the application
     - `section`: string - The section name
     - `file`: File - The file to upload
     - `onProgress`: (progress: number) => void - Optional callback for upload progress
   - Returns: `ApiResponse<FileUploadResponse>` with file URL and name
   - Implementation: Makes a POST request to `/applications/{applicationId}/upload` with FormData

3. **submitApplication**
   - Purpose: Submits a completed application
   - Parameters:
     - `applicationId`: string - The ID of the application
   - Returns: `ApiResponse<any>` with submission result
   - Implementation: Makes a POST request to `/applications/{applicationId}/submit`

4. **getApplicationById**
   - Purpose: Retrieves an application by ID
   - Parameters:
     - `applicationId`: string - The ID of the application
   - Returns: `ApiResponse<any>` with application data
   - Implementation: Makes a GET request to `/applications/{applicationId}`

5. **getDocuments**
   - Purpose: Retrieves documents for an application
   - Parameters:
     - `applicationId`: string - The ID of the application
     - `section`: string (optional) - The section to filter by
   - Returns: `ApiResponse<any>` with document data
   - Implementation: Makes a GET request to `/applications/{applicationId}/documents` or `/applications/{applicationId}/documents/{section}`

6. **deleteDocument**
   - Purpose: Deletes a document
   - Parameters:
     - `documentId`: string - The ID of the document to delete
   - Returns: `ApiResponse<any>` with deletion result
   - Implementation: Makes a DELETE request to `/documents/{documentId}`

## Response Types

1. **ApiResponse<T>**
   ```typescript
   interface ApiResponse<T> {
     success: boolean;
     data?: T;
     error?: string;
   }
   ```

2. **FileUploadResponse**
   ```typescript
   interface FileUploadResponse {
     fileUrl: string;
     fileName: string;
   }
   ```

## Mock Data

The API service includes mock property data for testing:
- 3 properties with different attributes
- Each property has an ID, address, type, rent, and image URL

## Integration with ReferencingContext

The ReferencingContext in `src/components/referencing/context/ReferencingContext.tsx` uses these API functions:
- `saveCurrentStep`: Simulates saving the current step (currently uses a timeout)
- `submitApplication`: Simulates submitting the application (currently uses a timeout)

## Future Improvements

1. Replace mock implementations with real API calls
2. Add proper error handling and retry logic
3. Implement caching for frequently accessed data
4. Add request cancellation for aborted operations
5. Implement proper type definitions for API responses 