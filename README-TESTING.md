# Testing the Referencing Flow

This document provides instructions on how to test the complete referencing flow in the Proptii application, including authentication, file handling, and data storage.

## Overview

The referencing flow is a multi-step process that allows users to submit their personal, employment, residential, financial, and guarantor information, along with supporting documents. The flow includes validation, file uploads with progress tracking, and error handling.

## Testing Methods

There are three ways to test the referencing flow:

1. **Manual Testing**: Using the application UI directly
2. **Automated Browser Testing**: Using the test page
3. **Automated Script Testing**: Using the test script

## 1. Manual Testing

To manually test the referencing flow:

1. Log in to the application
2. Navigate to a property listing
3. Click on "Apply" or "Start Referencing"
4. Complete each step of the referencing form:
   - Identity
   - Employment
   - Residential
   - Financial
   - Guarantor
   - Credit Check
5. Upload documents for each relevant section
6. Submit the application

### Test Cases for Manual Testing

- **Validation**: Try submitting forms with missing required fields
- **File Uploads**: Test uploading files of different types and sizes
- **Navigation**: Test moving between steps and saving progress
- **Error Handling**: Test how the application handles API errors

## 2. Automated Browser Testing

We've created a dedicated test page to automate the testing process in a browser environment.

### Running the Browser Test

1. Start the development server:
   ```
   npm run dev
   ```

2. Navigate to the test page:
   ```
   http://localhost:3000/test-referencing
   ```

3. On the test page, you can:
   - Set a custom application ID
   - Open the referencing modal to test it manually
   - Run an automated test that simulates the entire flow
   - View logs of the test progress and results

### What the Browser Test Covers

The automated browser test:
- Creates mock data for all sections
- Creates mock files for document uploads
- Tests the API calls for loading, saving, and submitting data
- Tests file uploads with progress tracking
- Handles and reports errors

## 3. Automated Script Testing

For headless testing or CI/CD environments, we've created a script that tests the referencing flow without a browser.

### Running the Script Test

```
npx ts-node src/scripts/testReferencingFlow.ts
```

This script will:
- Simulate the entire referencing flow
- Log the progress and results to the console
- Report any errors encountered

## Unit Tests

We also have unit tests for the ReferencingModal component and related functionality.

### Running Unit Tests

```
npm test
```

The unit tests cover:
- Component rendering
- Form validation
- File upload handling
- API error handling
- Complete flow from start to submission

## Common Issues and Troubleshooting

### API Connection Issues

If you encounter API connection issues:
- Check that the API server is running
- Verify the API URL in the environment variables
- Check network connectivity

### File Upload Issues

If file uploads fail:
- Check file size (max 10MB)
- Check file type (only PDF, JPEG, PNG allowed)
- Check browser console for detailed error messages

### Authentication Issues

If authentication fails:
- Check that you're logged in
- Verify that the auth token is being included in API requests
- Check token expiration

## Reporting Bugs

When reporting bugs in the referencing flow, please include:
1. The step where the issue occurred
2. Any error messages displayed
3. Browser and device information
4. Steps to reproduce the issue
5. Screenshots if applicable

## Contact

For questions or issues related to testing, please contact the development team at dev@proptii.com. 