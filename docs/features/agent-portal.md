# Agent Portal Documentation

## Overview

The Proptii application now includes a dedicated agent portal that provides property management features for real estate agents. This documentation covers the implementation details, configuration, and usage of the agent portal features.

## Features

### 1. Agent Home Page

The agent home page (`/agent`) provides a streamlined interface for property agents with the following features:

- **User Type Toggle**: Allows switching between tenant and agent views
- **Start New Listing Button**: Direct access to the property listing creation page
- **Custom Styling**: 
  - Agent toggle button color: `#FFEFD4`
  - Start New Listing button color: `#FFEFD4`
  - Text color for buttons: `text-gray-900`

### 2. Property Listing Management

The agent portal includes a comprehensive property listing management system:

- **New Listing Creation**: Accessible via `/listings/new`
- **Image Upload**: Support for multiple property images with preview
- **Property Details**: Comprehensive form for property information
- **Listing Preview**: Ability to preview listings before publishing

## Implementation Details

### Routes

The following routes have been added to support the agent portal:

```typescript
// In App.tsx
<Route path="/agent" element={<AgentHome />} />
<Route path="/listings/new" element={<NewListingPage />} />
```

### Components

Key components for the agent portal:

1. **AgentHome.tsx**
   - Main agent portal landing page
   - Toggle between tenant and agent views
   - Start New Listing button

2. **NewListingPage.tsx**
   - Property listing creation form
   - Image upload functionality
   - Property details management

### Styling

The agent portal uses custom styling for its components:

```css
/* Agent toggle button */
.agent-toggle {
  background-color: #FFEFD4;
  color: text-gray-900;
}

/* Start New Listing button */
.start-new-listing {
  background-color: #FFEFD4;
  color: text-gray-900;
}
```

## Configuration

### Environment Variables

The following environment variables are required for the agent portal:

```env
# Azure OpenAI Configuration (for AI search)
VITE_AZURE_OPENAI_API_KEY=your_api_key
VITE_AZURE_OPENAI_ENDPOINT=your_endpoint
VITE_AZURE_OPENAI_DEPLOYMENT=your_deployment

# Azure Storage Configuration (for image uploads)
VITE_AZURE_STORAGE_ACCOUNT_NAME=your_storage_account
VITE_AZURE_STORAGE_CONTAINER_NAME=your_container
VITE_AZURE_STORAGE_SAS_TOKEN=your_sas_token
```

### AI Search Configuration

The AI search functionality requires the following settings:

1. **Azure OpenAI Service**:
   - API key and endpoint configuration
   - Deployment name for the AI model
   - API version: '2024-02-15-preview'

2. **Search Results Layout**:
   - 2x2 grid layout for property listings
   - Integration with Rightmove, Zoopla, OpenRent, and OnTheMarket
   - Loading state bar for search progress
   - Predictive search typing functionality

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-organization/proptii.git
   cd proptii
   ```

2. **Install Dependencies**:
   ```bash
   npm ci
   ```

3. **Configure Environment Variables**:
   - Copy `.env.template` to `.env.local`
   - Fill in the required environment variables

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

## Testing

The agent portal features can be tested using the following steps:

1. **Navigation Test**:
   - Visit the home page
   - Click the "Agent" toggle
   - Verify redirection to `/agent`
   - Click "Start New Listing"
   - Verify redirection to `/listings/new`

2. **AI Search Test**:
   - Enter a search query
   - Verify predictive search functionality
   - Check loading state bar
   - Verify 2x2 grid layout of results
   - Check integration with property portals

3. **Image Upload Test**:
   - Test multiple image uploads
   - Verify image preview functionality
   - Check image storage in Azure

## Troubleshooting

### Common Issues

1. **AI Search Not Working**:
   - Verify Azure OpenAI configuration
   - Check API key and endpoint
   - Ensure proper deployment name

2. **Image Upload Issues**:
   - Verify Azure Storage configuration
   - Check SAS token permissions
   - Ensure container exists

3. **Navigation Issues**:
   - Verify route configuration in App.tsx
   - Check component imports
   - Ensure proper link paths

## Maintenance

To ensure the agent portal remains functional:

1. **Regular Updates**:
   - Keep dependencies up to date
   - Update Azure service configurations
   - Maintain API integrations

2. **Backup Configuration**:
   - Keep environment variables backed up
   - Document all configuration changes
   - Maintain version control of settings

3. **Testing**:
   - Regular testing of all features
   - Verification of AI search functionality
   - Check image upload capabilities

## Future Enhancements

Planned improvements for the agent portal:

1. **Enhanced AI Features**:
   - Improved property matching
   - Advanced search filters
   - Automated property descriptions

2. **Additional Integrations**:
   - More property portals
   - CRM system integration
   - Document management system

3. **UI Improvements**:
   - Enhanced property listing interface
   - Better image management
   - Improved search results display 