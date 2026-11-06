# React Router Implementation - Landlord Agent App

## Overview

The landlord_agent app now uses React Router for URL-based navigation. Previously, navigation was handled entirely through internal state, which meant URLs never changed when navigating between pages. Now each page has its own URL that can be shared or bookmarked.

## Changes Made

### 1. Dependencies Added
- **react-router-dom**: Installed for client-side routing
- **@types/react-router-dom**: TypeScript type definitions

### 2. Core Files Modified

#### **main.tsx**
- Wrapped the `<App />` component in `<BrowserRouter>` with `basename="/landlord"`
- This ensures all routes are prefixed with `/landlord` to match the deployment path

#### **App.tsx**
- Added imports: `useNavigate`, `useLocation` from react-router-dom
- Added URL synchronization logic:
  - **URL to State**: Listens to URL changes (e.g., browser back/forward) and updates internal state
  - **State to URL**: Updates the URL when state changes programmatically
- Created mapping functions:
  - `screenToUrl()`: Maps internal screen names to URLs
  - URL patterns: Maps URLs back to screen states
- Updated `navigateToScreen()` to also update the browser URL

#### **MainLayout.tsx**
- Added imports: `useNavigate`, `useLocation` from react-router-dom
- Updated `CustomNavigationMenu` to use `navigate()` for direct URL navigation
- Added `path` property to each navigation item
- Removed the `onNavigate` parameter from `CustomSidebar` (now uses React Router directly)

### 3. Build Configuration
- **vite.config.ts** already had the correct `base: '/landlord/'` setting
- Build output goes to `../../public/landlord`

## URL Structure

The app now uses the following URL structure:

### Main Navigation
- `/landlord/dashboard` - Dashboard page
- `/landlord/properties` - Properties list
- `/landlord/documents` - Documents list
- `/landlord/clients` - Clients/Tenants list
- `/landlord/contracts` - Contracts page
- `/landlord/insights` - Portfolio insights
- `/landlord/inbox` - Tenant inbox

### Property Pages
- `/landlord/property/{id}` - Property details
- `/landlord/property/{id}/documents` - Property document management
- `/landlord/property/{id}/photos` - Property photo management
- `/landlord/property/{id}/insights` - Property-specific insights

### Tenant/Client Pages
- `/landlord/tenant/{id}` - Tenant details
- `/landlord/landlord/{id}` - Landlord details (agent view only)

### Add/Create Pages
- `/landlord/add-property` - Start adding a property
- `/landlord/add-property/type` - Select property type
- `/landlord/add-property/details` - Enter property details
- `/landlord/add-property/amenities` - Select amenities
- `/landlord/add-property/images` - Upload images
- `/landlord/add-property/preview` - Preview before publishing
- `/landlord/add-tenant` - Tenant selection method
- `/landlord/add-tenant/manual` - Manually add tenant
- `/landlord/add-tenant/invite` - Invite tenant via email
- `/landlord/add-tenant/existing` - Select existing tenant
- `/landlord/add-landlord` - Add landlord (agent only)

### Alerts
- `/landlord/vacancy-alerts/{id}` - Vacancy prevention details
- `/landlord/arrears-alerts/{id}` - Arrears management details

## How to Use

### Sharing Links
You can now share direct links to specific pages. For example:
- Share a property link: `https://yourdomain.com/landlord/property/abc123`
- Share the clients page: `https://yourdomain.com/landlord/clients`

### Email Links
When creating emails with links to specific pages:
```html
<a href="https://yourdomain.com/landlord/property/123">View Property Details</a>
<a href="https://yourdomain.com/landlord/contracts">Review Unsigned Contracts</a>
```

### Navigation in Code
The app maintains backward compatibility with the existing navigation system:
```javascript
// Still works - calls navigateToScreen which updates both state and URL
navigateToScreen('property-details');

// Or use React Router directly (in new components)
const navigate = useNavigate();
navigate('/landlord/properties');
```

## Server Configuration Notes

For production deployment, ensure your web server is configured to serve `index.html` for all routes under `/landlord/*`. This is necessary for client-side routing to work correctly.

### Example configurations:

**Nginx:**
```nginx
location /landlord {
    try_files $uri $uri/ /landlord/index.html;
}
```

**Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /landlord/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /landlord/index.html [L]
</IfModule>
```

**Express.js:**
```javascript
app.get('/landlord/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/landlord/index.html'));
});
```

## Testing

### Build and Test
```bash
cd src/landlord_agent
npm run build
```

The built files are output to `public/landlord/`.

### Development
```bash
cd src/landlord_agent
npm run dev
```

Then navigate to `http://localhost:3000/landlord` to test the routing.

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ All modern browsers with HTML5 History API support

## Known Limitations

1. **Refresh on deep URLs**: If a user directly visits or refreshes a deep URL (e.g., `/landlord/property/123`), the server must serve `index.html`. Otherwise, you'll get a 404 error.

2. **State persistence**: Some page state (like form data in progress) is not persisted in the URL. If you refresh, you'll lose unsaved changes.

3. **Backward compatibility**: The app still uses internal state management for screen transitions, which is then synchronized with URLs. This maintains backward compatibility but adds some complexity.

## Future Improvements

Consider these enhancements:
1. Use URL query parameters for filters and search
2. Implement URL state management for forms (so progress is saved in the URL)
3. Add route guards for authentication
4. Implement lazy loading for route components
5. Add scroll restoration for better UX
6. Migrate fully to React Router (remove dual state/URL system)

