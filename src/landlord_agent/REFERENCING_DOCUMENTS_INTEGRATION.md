# Referencing Documents Integration Guide

## Overview

The Documents tab in the Tenant Details page now displays referencing documents that were uploaded by tenants during the referencing process. These documents are fetched from Firestore and displayed alongside other tenant documents.

## Implementation Details

### 1. Data Flow

```
Tenant completes referencing
    ↓
Documents uploaded to Firestore (as base64 dataUrl)
    ↓
TenantDetails component fetches referencing data
    ↓
Documents extracted and formatted
    ↓
Displayed in Documents tab with download/view options
```

### 2. Document Types Included

The following documents from the referencing process are displayed:

| Document Type | Form Section | Field Name |
|--------------|--------------|------------|
| Identity Document | Identity | `identityProof` |
| Employment Proof | Employment | `proofDocument` |
| Proof of Address | Residential | `proofDocument` |
| Proof of Income | Financial | `proofOfIncomeDocument` |
| Guarantor ID | Guarantor | `identityDocument` |

### 3. Components Modified

#### TenantDetails.tsx

**New State Variables:**
```typescript
const [referencingDocuments, setReferencingDocuments] = useState<TenantDocument[]>([]);
```

**New useEffect Hook:**
- Extracts documents from `referencingData.formData`
- Converts StoredFile objects to TenantDocument format
- Updates `referencingDocuments` state

**New Functions:**
```typescript
formatFileSize(bytes: number): string
handleDownloadDocument(document: TenantDocument): void
handleViewDocument(document: TenantDocument): void
```

**Updated Interface:**
```typescript
interface TenantDocument {
  id: string;
  name: string;
  type: 'tenancy-agreement' | 'deposit-certificate' | 'right-to-rent' | 'id-document' | 'other';
  dateUploaded: Date;
  expiryDate?: Date;
  status: 'valid' | 'expired' | 'pending';
  downloadUrl?: string;      // NEW
  fileSize?: number;          // NEW
  fileType?: string;          // NEW
}
```

#### referencingService.ts

**Updated Interfaces:**
```typescript
export interface StoredFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  dataUrl: string;
}

export interface ReferencingFormData {
  identity: {
    // ... other fields
    identityProof?: StoredFile;
  };
  employment: {
    // ... other fields
    proofDocument?: StoredFile;
  };
  residential: {
    // ... other fields
    proofDocument?: StoredFile;
  };
  financial: {
    // ... other fields
    proofOfIncomeDocument?: StoredFile;
  };
  guarantor: {
    // ... other fields
    identityDocument?: StoredFile;
  };
  // ... other sections
}
```

## Features

### 1. Document Display

- **Referencing Badge**: Documents from referencing are marked with a blue "Referencing" badge
- **File Information**: Displays file size and type for referencing documents
- **Status Badge**: Shows document status (valid, expired, pending)
- **Upload Date**: Displays when the document was uploaded
- **Loading State**: Shows spinner while fetching referencing data
- **Empty State**: Informative message when no documents are available

### 2. Document Actions

- **View**: Opens document in a new browser tab
- **Download**: Downloads document to user's device
- **Dropdown Menu**: Accessible via the three-dot menu next to each document

### 3. Visual Design

- Documents are displayed in cards with hover effects
- Referencing documents are clearly distinguished with badges
- Responsive layout that works on all screen sizes
- Consistent styling with the rest of the application

## Usage

### For Tenants

1. Complete the referencing form via `ReferencingModal`
2. Upload required documents (identity, employment, residential, financial, guarantor)
3. Submit the referencing form

### For Landlords/Agents

1. Navigate to Clients page
2. Click on a tenant to view their details
3. Go to the "Documents" tab
4. View all documents including those from referencing
5. Click the dropdown menu on any referencing document to view or download

## Data Structure

### Firestore Collection: `referencingForms`

```javascript
{
  userId: "user123",
  propertyId: "property456",
  formData: {
    identity: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@email.com",
      // ... other fields
      identityProof: {
        name: "passport.jpg",
        type: "image/jpeg",
        size: 245678,
        lastModified: 1699876543210,
        dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // base64 encoded
      }
    },
    employment: {
      // ... other fields
      proofDocument: { /* StoredFile */ }
    },
    residential: {
      // ... other fields
      proofDocument: { /* StoredFile */ }
    },
    financial: {
      // ... other fields
      proofOfIncomeDocument: { /* StoredFile */ }
    },
    guarantor: {
      // ... other fields
      identityDocument: { /* StoredFile */ }
    }
  },
  currentStep: 7,
  isSubmitted: true,
  submittedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Testing Guide

### 1. Test Document Display

**Steps:**
1. Log in as a landlord/agent
2. Navigate to the Clients page
3. Click on a tenant who has completed referencing
4. Go to the Documents tab

**Expected Result:**
- Referencing documents are displayed
- Each document shows a "Referencing" badge
- File size and type are displayed
- Documents are marked as "valid"

### 2. Test Document Download

**Steps:**
1. Navigate to a tenant's Documents tab
2. Click the three-dot menu on a referencing document
3. Click "Download"

**Expected Result:**
- Browser initiates download
- File downloads with the correct name
- File can be opened successfully

### 3. Test Document View

**Steps:**
1. Navigate to a tenant's Documents tab
2. Click the three-dot menu on a referencing document
3. Click "View Document"

**Expected Result:**
- Document opens in a new browser tab
- Image/PDF displays correctly

### 4. Test Empty State

**Steps:**
1. Navigate to a tenant who hasn't completed referencing
2. Go to the Documents tab (if no other documents exist)

**Expected Result:**
- Empty state message is displayed
- Message suggests uploading documents or completing referencing

### 5. Test Loading State

**Steps:**
1. Navigate to Clients page
2. Click on a tenant
3. Quickly navigate to Documents tab

**Expected Result:**
- Loading spinner is displayed briefly
- Documents load after referencing data is fetched

### 6. Test Mixed Documents

**Steps:**
1. Navigate to a tenant with both referencing documents and uploaded documents
2. Go to the Documents tab

**Expected Result:**
- Both types of documents are displayed
- Referencing documents are clearly marked with badges
- Header shows count of referencing documents

## Troubleshooting

### Issue: Documents not showing

**Possible Causes:**
1. Tenant hasn't completed referencing
2. Tenant didn't upload documents during referencing
3. Firestore rules blocking access
4. Wrong tenant email used for query

**Solution:**
1. Check browser console for errors
2. Verify tenant has completed referencing (check referencing status badge)
3. Check Firestore console for document existence
4. Verify Firestore security rules allow read access

### Issue: Download not working

**Possible Causes:**
1. Base64 dataUrl is invalid
2. Browser blocking download
3. File size too large

**Solution:**
1. Check console for errors
2. Check browser download settings
3. Test with smaller files first

### Issue: View opens blank page

**Possible Causes:**
1. Base64 encoding issue
2. File type not supported by browser
3. Popup blocker active

**Solution:**
1. Verify dataUrl is valid base64
2. Test with image files (JPEG, PNG)
3. Disable popup blocker for localhost

## Future Enhancements

1. **Document Preview**: Add inline preview for images/PDFs
2. **Document Deletion**: Allow deletion of documents
3. **Document Categories**: Group documents by category
4. **Document Expiry Alerts**: Notify when documents are about to expire
5. **Bulk Download**: Download all documents as a ZIP file
6. **Document Notes**: Add notes/comments to documents
7. **Document Verification**: Mark documents as verified by agent
8. **Document History**: Track document upload/view/download history

## Security Considerations

1. **Access Control**: Only landlords/agents assigned to the tenant can view documents
2. **Data Privacy**: Documents are stored as base64 in Firestore (consider Cloud Storage for production)
3. **File Size Limits**: Currently no limit, recommend adding validation
4. **File Type Validation**: Ensure only allowed file types are uploaded
5. **Firestore Rules**: Ensure proper security rules are configured

## Performance Considerations

1. **Base64 Storage**: Documents stored as base64 increase Firestore document size
   - Consider migrating to Firebase Storage for large files
   - Current implementation suitable for documents under 1MB

2. **Lazy Loading**: Documents are loaded only when tenant details are viewed

3. **Caching**: Consider implementing caching to reduce Firestore reads

## Database Schema

### Firestore Index Required

```
Collection: referencingForms
Fields: formData.identity.email (Ascending), updatedAt (Descending)
```

This index is required for the query in `getReferencingStatusByEmail`.

## Related Files

- `src/landlord_agent/src/components/TenantDetails.tsx`
- `src/landlord_agent/src/components/ClientsPage.tsx`
- `src/landlord_agent/src/services/referencingService.ts`
- `src/components/ReferencingModal.OLD.tsx`

## Support

For issues or questions:
1. Check browser console for error messages
2. Review Firestore console for data structure
3. Test with different tenants and document types
4. Verify Firestore security rules and indexes





