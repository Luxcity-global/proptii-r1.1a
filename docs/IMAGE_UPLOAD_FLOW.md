# Image Upload Flow in ReferencingModal

## Overview
The ReferencingModal component handles image/document uploads by converting files to base64 data URLs and storing them directly in Firestore. This document explains the complete flow.

## Key Components

### 1. **File Processing Pipeline** (Lines 159-366)

The modal uses a multi-stage process to optimize file uploads:

#### Stage 1: File Compression (Lines 294-366)
```typescript
compressImage(file: File, maxSizeKB: number = 150)
```
- **Trigger**: Only for images larger than 500KB
- **Process**: 
  - Reduces dimensions to max 600px (width or height)
  - Compresses with 40% quality (very aggressive for speed)
  - Converts to JPEG format
- **Purpose**: Minimize file size for faster uploads and storage

#### Stage 2: File to Base64 Conversion (Lines 159-198)
```typescript
fileToStoredFile(file: File): Promise<StoredFile>
```
- **Process**:
  - Reads file using FileReader API
  - Converts to base64 data URL
  - Creates StoredFile object with metadata
- **Timeout**: 5 seconds max per file
- **Output**: 
```typescript
{
  name: string;
  type: string;
  size: number;
  lastModified: number;
  dataUrl: string  // Base64 encoded file data
}
```

#### Stage 3: Caching (Lines 477-494)
```typescript
processFileUpload(file: File): Promise<StoredFile>
```
- **Purpose**: Avoid reprocessing the same file
- **Method**: Caches by `filename_size_lastModified` key
- **Benefit**: Instant retrieval if user re-selects same file

### 2. **File Upload Components**

Each upload section uses dedicated components:
- `FileUpload.tsx` - Identity documents
- `EmploymentUpload.tsx` - Employment proof
- `ResidentialUpload.tsx` - Address proof
- `FinancialUpload.tsx` - Income proof
- `GuarantorUpload.tsx` - Guarantor documents

These components follow the same pattern:
1. User selects file via drag-and-drop or click
2. FileReader converts to base64 (lines 32-50 in FileUpload.tsx)
3. Creates StoredFile object
4. Calls `updateFormData()` to store in form state

### 3. **Form Data Update** (Lines 497-613)

```typescript
updateFormData(step: keyof FormData, data: Partial<FormData[keyof FormData]>)
```

When a file is uploaded:
1. **Parallel Processing**: All file uploads are processed simultaneously
2. **Batch Processing**: Files are converted together using `Promise.all()`
3. **State Update**: Form data is updated with StoredFile objects
4. **Auto-save**: Form data is automatically saved to localStorage via `requestIdleCallback()`

### 4. **Storage to Firestore** (Lines 936-1029)

```typescript
saveCurrentStep()
```

The save process handles multiple storage methods:

#### Method 1: localStorage (Immediate)
- Stores entire form data including base64 files
- Uses optimized `requestIdleCallback()` for non-blocking saves
- Key format: `referencing_{userId}_formData`

#### Method 2: Firestore (Primary Storage)
```typescript
firestoreService.saveReferencingForm(userId, propertyId, formData, currentStep, stepStatus)
```
- Stores complete form data with embedded base64 files
- Document structure:
```typescript
{
  userId: string;
  propertyId: string;
  formData: {
    identity: { identityProof: StoredFile },
    employment: { proofDocument: StoredFile },
    residential: { proofDocument: StoredFile },
    financial: { proofOfIncomeDocument: StoredFile },
    guarantor: { identityDocument: StoredFile }
  },
  currentStep: number;
  stepStatus: object;
  lastSaved: Timestamp;
  isSubmitted: boolean;
}
```

#### Method 3: Cosmos DB (Backward Compatibility)
- Also saves section-by-section to Cosmos DB
- Uses `referencingService` endpoints for each section

### 5. **Data Loading Flow** (Lines 773-933)

When the modal opens, it loads data in priority order:

1. **Primary**: Firestore by `userId_propertyId`
2. **Fallback**: Firestore for all user forms (uses latest)
3. **Secondary**: localStorage
4. **Default**: Empty form with user info pre-filled

Base64 files are loaded directly from Firestore/localStorage and displayed in the UI.

## Performance Optimizations

1. **Aggressive Compression**: 40% quality, 600px max dimension
2. **Lazy Loading**: Only compress files >500KB
3. **File Caching**: Prevent reprocessing same file
4. **Parallel Processing**: All files processed simultaneously
5. **Timeout Protection**: 5s max for file reading, 3s for image loading
6. **Non-blocking Saves**: Uses `requestIdleCallback()` for localStorage writes

## Storage Format

Files are stored as **base64 data URLs** directly in the Firestore document:

```typescript
identityProof: {
  name: "passport.jpg",
  type: "image/jpeg",
  size: 152340,  // compressed size
  lastModified: 1234567890123,
  dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

## Limitations

1. **Document Size**: Firestore has 1MB limit per document; large files may exceed this
2. **No Firebase Storage**: Files are NOT uploaded to Firebase Cloud Storage
3. **Base64 Overhead**: Base64 encoding increases file size by ~33%
4. **Multiple Large Files**: Combined file size could exceed Firestore limits

## Recommendations for Improvement

1. **Firebase Cloud Storage**: Upload files to Firebase Storage, store only URLs in Firestore
2. **Progressive Upload**: Show upload progress to users
3. **Image Optimization**: Use more efficient formats (WebP) and compression
4. **Thumbnail Generation**: Generate thumbnails for image previews
5. **Signed URLs**: Use Firebase Storage signed URLs for secure access
