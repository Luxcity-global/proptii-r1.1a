# URL Quick Reference - Landlord Agent App

## Quick Links You Can Share

Copy these URLs to share specific pages with others (replace `yourdomain.com` with your actual domain):

### Main Pages
```
Dashboard:       https://yourdomain.com/landlord/dashboard
Properties:      https://yourdomain.com/landlord/properties
Documents:       https://yourdomain.com/landlord/documents
Clients:         https://yourdomain.com/landlord/clients
Contracts:       https://yourdomain.com/landlord/contracts
Portfolio Insights: https://yourdomain.com/landlord/insights
Inbox:           https://yourdomain.com/landlord/inbox
```

### Property-Specific Pages
```
Property Details:    https://yourdomain.com/landlord/property/{PROPERTY_ID}
Property Documents:  https://yourdomain.com/landlord/property/{PROPERTY_ID}/documents
Property Photos:     https://yourdomain.com/landlord/property/{PROPERTY_ID}/photos
Property Insights:   https://yourdomain.com/landlord/property/{PROPERTY_ID}/insights
```

### Client Pages
```
Tenant Details:      https://yourdomain.com/landlord/tenant/{TENANT_ID}
Landlord Details:    https://yourdomain.com/landlord/landlord/{LANDLORD_ID}
```

### Actions
```
Add Property:        https://yourdomain.com/landlord/add-property
Add Tenant:          https://yourdomain.com/landlord/add-tenant
Add Landlord:        https://yourdomain.com/landlord/add-landlord
```

## Example Email Templates

### Share Property Details
```
Subject: Property Details - 123 Main Street

Hi [Name],

Please review the property details here:
https://yourdomain.com/landlord/property/abc123

Best regards,
[Your Name]
```

### Invite to Review Contract
```
Subject: Contract Awaiting Signature

Hi [Name],

Please review and sign the contract:
https://yourdomain.com/landlord/contracts

Thanks,
[Your Name]
```

### Request Document Upload
```
Subject: Please Upload Property Documents

Hi [Name],

Please upload the required documents for the property:
https://yourdomain.com/landlord/property/abc123/documents

Regards,
[Your Name]
```

## Getting Property/Tenant IDs

To find the ID of a property or tenant:

1. Navigate to the property or tenant in the app
2. Look at the URL in your browser - the ID is the last part of the URL
3. Example: If the URL is `https://yourdomain.com/landlord/property/abc123`, the ID is `abc123`

Alternatively, you can find IDs in:
- The browser's developer console (check network requests)
- Firebase console (if you have access)
- Property/tenant list API responses

## Testing Locally

When testing locally (development server), use:
```
http://localhost:3000/landlord/dashboard
http://localhost:3000/landlord/properties
http://localhost:3000/landlord/property/1
etc.
```

## Notes

- All URLs are case-sensitive
- IDs in URLs must match exactly with database IDs
- Invalid IDs will redirect to the list page (e.g., invalid property ID → properties page)
- Sharing URLs requires the recipient to be logged in (if authentication is enabled)

