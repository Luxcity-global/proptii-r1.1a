# API Simulation Functions

This document describes the current API simulation functions used in the Proptii application. These functions will be replaced with real API calls in the future.

## ReferencingModal Component

### `saveCurrentStep()`

**Purpose**: Simulates saving the current form step data to a database.

**Implementation**:
```typescript
const saveCurrentStep = async () => {
  try {
    setIsSaving(true);
    
    // In a real implementation, you would save to your database here
    // For now, simulate a save operation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Update last saved time
    setLastSaved(new Date());
  } catch (error) {
    console.error('Error saving form:', error);
  } finally {
    setIsSaving(false);
  }
};
```

**Expected Behavior**:
- Sets `isSaving` state to `true` to show a loading indicator
- Simulates an API call with a timeout of 800ms
- Updates `lastSaved` state with the current date/time
- Sets `isSaving` state back to `false`
- Handles errors by logging them to the console

**Future Implementation**:
- Send a PUT request to the API with the form data for the current step
- Handle API errors and display them to the user
- Update the UI based on the API response

### `submitApplication()`

**Purpose**: Simulates submitting the complete application to the API.

**Implementation**:
```typescript
const submitApplication = async () => {
  try {
    setIsSubmitting(true);
    
    // In a real implementation, you would submit to your API here
    // For now, simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    alert('Your application has been submitted successfully!');
    onClose();
  } catch (error) {
    console.error('Error submitting application:', error);
  } finally {
    setIsSubmitting(false);
  }
};
```

**Expected Behavior**:
- Sets `isSubmitting` state to `true` to show a loading indicator
- Simulates an API call with a timeout of 1500ms
- Shows an alert to the user on successful submission
- Closes the modal
- Sets `isSubmitting` state back to `false`
- Handles errors by logging them to the console

**Future Implementation**:
- Send a POST request to the API with the complete form data
- Handle API errors and display them to the user
- Update the UI based on the API response
- Redirect the user to a success page or show a success message

## Financial Section

### `connectToOpenBanking()`

**Purpose**: Simulates connecting to open banking services.

**Implementation**:
```typescript
// In the Financial section of the form
// This is not a separate function but part of the onClick handler
onClick={() => {
  // In a real implementation, you would initiate an open banking connection flow here
  // For now, simulate a successful connection
  setTimeout(() => {
    updateFormData('financial', { 
      useOpenBanking: true,
      isConnectedToOpenBanking: true
    });
  }, 1000);
}}
```

**Expected Behavior**:
- Simulates an API call with a timeout of 1000ms
- Updates the form data to indicate that the user is connected to open banking
- No error handling is implemented

**Future Implementation**:
- Redirect the user to the open banking authorization page
- Handle the callback from the open banking service
- Update the UI based on the connection status
- Implement proper error handling

## Home Component

### `handleSearch()`

**Purpose**: Makes a real API call to Azure OpenAI to search for property listings.

**Implementation**:
```typescript
const handleSearch = useCallback(async (): Promise<void> => {
  if (!searchQuery.trim() || isLoading) return;
  
  setIsLoading(true);
  setError(null);
  setSearchResults(null); // Clear previous results
  
  const apiKey = import.meta.env.VITE_AZURE_API_KEY;
  if (!apiKey) {
    setError('API key is not configured');
    setIsLoading(false);
    return;
  }

  try {
    const client = createClient(
      'https://ai-tosinai2685488296748963.openai.azure.com',
      new AzureKeyCredential(apiKey)
    );

    const requestBody = {
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that helps users find properties in the UK...`
        },
        { role: "user", content: searchQuery }
      ],
      temperature: 0.7,
      max_tokens: 800,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    console.log('Sending request with query:', searchQuery);
    
    const response = await client.path("/openai/deployments/gpt-4o/chat/completions").post({
      body: requestBody,
      queryParameters: {
        'api-version': '2024-02-15-preview'
      }
    });

    // Process response...
    setSearchResults(response.body as SearchResult);
    
  } catch (error) {
    console.error('Error searching properties:', error);
    setError('An error occurred while searching for properties. Please try again.');
  } finally {
    setIsLoading(false);
  }
}, [searchQuery, isLoading]);
```

**Expected Behavior**:
- Sets `isLoading` state to `true` to show a loading indicator
- Clears previous search results and errors
- Makes a real API call to Azure OpenAI
- Updates `searchResults` state with the response
- Sets `isLoading` state back to `false`
- Handles errors by updating the `error` state

**Future Implementation**:
- This is already a real API call, but it could be enhanced to:
  - Cache search results
  - Implement pagination for large result sets
  - Add filters for property types, price ranges, etc.
  - Integrate with a backend service to track user searches

## PropertyModal Component

### `parseResults()`

**Purpose**: Parses property listing URLs from the Azure OpenAI API response.

**Implementation**:
```typescript
const parseResults = (content: string) => {
  const sections = content.split('###').filter(section => section.trim());
  const results: { [key: string]: string } = {
    openrent: '',
    zoopla: ''
  };

  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const siteTitle = lines[0].trim().toLowerCase();
    
    if (siteTitle.includes('openrent')) {
      const urlLine = lines.find(line => line.includes('openrent.co.uk'));
      results.openrent = urlLine ? urlLine.match(/https?:\/\/[^\s\]]+/)?.[0] || '' : '';
    } else if (siteTitle.includes('zoopla')) {
      const urlLine = lines.find(line => line.includes('zoopla.co.uk'));
      results.zoopla = urlLine ? urlLine.match(/https?:\/\/[^\s\]]+/)?.[0] || '' : '';
    }
  });

  return results;
};
```

**Expected Behavior**:
- Parses the content from the Azure OpenAI API response
- Extracts URLs for OpenRent and Zoopla property listings
- Returns an object with the extracted URLs

**Future Implementation**:
- This function could be enhanced to:
  - Support additional property listing websites
  - Implement more robust URL extraction
  - Handle different response formats
  - Move the parsing logic to a backend service

### `handleViewListings()`

**Purpose**: Opens the selected property listing URL in a new tab.

**Implementation**:
```typescript
const handleViewListings = () => {
  const url = urls[selectedProperty];
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  }
};
```

**Expected Behavior**:
- Opens the selected property listing URL in a new tab
- Closes the modal after opening the URL

**Future Implementation**:
- This function could be enhanced to:
  - Track which listings users click on
  - Save user preferences for property listings
  - Implement analytics for user behavior

## AuthContext Component

### `login()`

**Purpose**: Makes a real API call to Azure B2C to authenticate the user.

**Implementation**:
```typescript
const login = async () => {
  try {
    setError(null);
    console.log('Login attempt started');
    const result = await instance.loginPopup(loginRequest);
    if (result) {
      console.log('Login successful, updating state');
      setIsAuthenticated(true);
      setUser(extractUserProfile(result.account));
      instance.setActiveAccount(result.account);
      
      // Force a re-render after successful login
      setTimeout(() => {
        console.log('Dispatching auth state change event');
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      }, 100);
    }
  } catch (error: any) {
    console.error('Login failed:', error);
    setError(error.message || 'Login failed. Please try again.');
  }
};
```

**Expected Behavior**:
- Clears any previous errors
- Opens a popup for Azure B2C authentication
- Updates authentication state and user profile on successful login
- Dispatches a custom event to notify other components of the authentication state change
- Handles errors by updating the `error` state

**Future Enhancements**:
- Add support for silent token renewal
- Implement token caching
- Add support for different authentication flows (e.g., redirect instead of popup)

### `logout()`

**Purpose**: Makes a real API call to Azure B2C to log out the user.

**Implementation**:
```typescript
const logout = async () => {
  try {
    await instance.logoutPopup({
      postLogoutRedirectUri: window.location.origin,
    });
    setIsAuthenticated(false);
    setUser(null);
  } catch (error: any) {
    console.error('Logout failed:', error);
    setError(error.message || 'Logout failed. Please try again.');
  }
};
```

**Expected Behavior**:
- Opens a popup for Azure B2C logout
- Updates authentication state and clears user profile on successful logout
- Redirects to the home page after logout
- Handles errors by updating the `error` state

**Future Enhancements**:
- Add support for different logout flows (e.g., redirect instead of popup)
- Implement cleanup of local storage and session data

### `editProfile()`

**Purpose**: Makes a real API call to Azure B2C to allow the user to edit their profile.

**Implementation**:
```typescript
const editProfile = async () => {
  try {
    const result = await instance.loginPopup({
      authority: b2cPolicies.editProfile,
      scopes: ["openid", "profile"]
    });
    
    if (result) {
      // Update the user profile after editing
      setUser(extractUserProfile(result.account));
    }
  } catch (error: any) {
    // Ignore the error if user cancels the profile editing
    if (error.errorCode !== "user_cancelled") {
      console.error('Profile editing failed:', error);
      setError(error.message || 'Profile editing failed. Please try again.');
    }
  }
};
```

**Expected Behavior**:
- Opens a popup for Azure B2C profile editing
- Updates the user profile on successful edit
- Ignores errors if the user cancels the profile editing
- Handles other errors by updating the `error` state

**Future Enhancements**:
- Add support for different profile editing flows (e.g., redirect instead of popup)
- Implement validation of profile changes
- Add support for additional profile fields

## Expected API Endpoints

Based on the current simulation functions, the following API endpoints will be needed:

1. `PUT /api/applications/:applicationId/sections/:sectionName`
   - Save data for a specific section of the application
   - Request body: Section data
   - Response: Updated section data with timestamp

2. `POST /api/applications/:applicationId/submit`
   - Submit the complete application
   - Request body: None (application data is already saved)
   - Response: Submission confirmation with timestamp

3. `POST /api/applications/:applicationId/open-banking/connect`
   - Initiate open banking connection
   - Request body: User consent and required parameters
   - Response: Connection status and redirect URL

4. `GET /api/applications/:applicationId/open-banking/status`
   - Check open banking connection status
   - Response: Connection status and available financial data

5. `POST /api/search/properties`
   - Search for properties (currently using Azure OpenAI directly)
   - Request body: Search query and filters
   - Response: Property listings from multiple sources 