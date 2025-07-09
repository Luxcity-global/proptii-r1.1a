# Cosmos DB Schema and Data Storage Requirements

## Overview
This document outlines the comprehensive data storage requirements for the Proptii application's migration from Firestore to Cosmos DB. It includes schema definitions, storage strategies, indexing requirements, and partitioning approaches.

## Core Data Models

### 1. User Management
```typescript
interface User {
  id: string;                 // Partition key
  type: 'document';          // For document type identification
  email: string;             // Unique index
  givenName?: string;
  familyName?: string;
  name?: string;
  phoneNumber?: string;
  role: 'tenant' | 'agent' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;         // ISO date string
  lastLogin: string;         // ISO date string
  preferences: {
    savedProperties: string[];  // Array of property IDs
    searchHistory: {
      query: string;
      timestamp: string;     // ISO date string
      filters?: Record<string, any>;
    }[];
  };
  metadata: {
    lastUpdated: string;     // ISO date string
    version: number;         // For optimistic concurrency
  };
}
```

### 2. Referencing System
```typescript
interface ReferencingApplication {
  id: string;                // Partition key
  type: 'document';          // For document type identification
  userId: string;            // Foreign key to User
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  sections: {
    identity: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      dateOfBirth: string;   // ISO date string
      isBritish: boolean;
      nationality: string;
      identityProofDocumentId: string;  // Reference to Blob Storage
    };
    employment: {
      status: string;
      companyDetails: string;
      lengthOfEmployment: string;
      jobPosition: string;
      reference: {
        fullName: string;
        email: string;
        phone: string;
      };
      proofDocumentId: string;  // Reference to Blob Storage
    };
    residential: {
      currentAddress: string;
      durationAtCurrentAddress: string;
      previousAddress: string;
      durationAtPreviousAddress: string;
      reasonForLeaving: string;
      proofDocumentId: string;  // Reference to Blob Storage
    };
    financial: {
      monthlyIncome: string;
      proofOfIncomeType: string;
      proofDocumentId: string;  // Reference to Blob Storage
      openBanking: {
        connected: boolean;
        consentId?: string;
        lastSync?: string;   // ISO date string
      };
    };
    guarantor: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      address: string;
    };
    creditCheck: {
      status: 'pending' | 'completed' | 'failed';
      score?: number;
      reportId?: string;
    };
  };
  createdAt: string;        // ISO date string
  updatedAt: string;        // ISO date string
  lastSavedStep: number;
  metadata: {
    version: number;        // For optimistic concurrency
  };
}
```

### 3. Property Viewings
```typescript
interface ViewingRequest {
  id: string;               // Partition key
  type: 'document';         // For document type identification
  propertyId: string;       // Foreign key to Property
  userId: string;           // Foreign key to User (tenant)
  agentId: string;         // Foreign key to User (agent)
  requestDate: string;      // ISO date string
  viewingDate: string;      // ISO date string
  viewingTime: string;      // 24-hour format "HH:mm"
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  documents: string[];      // Array of Blob Storage references
  createdAt: string;       // ISO date string
  updatedAt: string;       // ISO date string
  metadata: {
    version: number;       // For optimistic concurrency
  };
}
```

### 4. Contracts
```typescript
interface Contract {
  id: string;              // Partition key
  type: 'document';        // For document type identification
  propertyId: string;      // Foreign key to Property
  tenantIds: string[];     // Array of User IDs (tenants)
  agentId: string;        // Foreign key to User (agent)
  status: 'draft' | 'pending_signature' | 'signed' | 'active' | 'terminated';
  documentId: string;      // Reference to Blob Storage
  terms: {
    startDate: string;     // ISO date string
    endDate: string;       // ISO date string
    rentAmount: number;
    depositAmount: number;
    specialConditions?: string;
  };
  signatures: {
    userId: string;
    signedAt: string;     // ISO date string
    ipAddress: string;
  }[];
  createdAt: string;      // ISO date string
  updatedAt: string;      // ISO date string
  metadata: {
    version: number;      // For optimistic concurrency
  };
}
```

### 5. Dashboard Data
```typescript
interface DashboardData {
  id: string;             // Partition key (userId)
  type: 'document';       // For document type identification
  userId: string;         // Foreign key to User
  statistics: {
    totalProperties: number;
    activeViewings: number;
    pendingReferences: number;
    activeContracts: number;
    lastUpdated: string;  // ISO date string
  };
  recentActivity: {
    type: 'viewing' | 'reference' | 'contract';
    itemId: string;
    action: string;
    timestamp: string;    // ISO date string
  }[];
  documents: {
    id: string;
    name: string;
    type: string;
    category: 'identity' | 'employment' | 'residential' | 'financial' | 'contract';
    documentId: string;   // Reference to Blob Storage
    uploadedAt: string;   // ISO date string
  }[];
  metadata: {
    version: number;      // For optimistic concurrency
  };
}
```

## Storage Strategies

### Document Storage
- All file uploads will be stored in Azure Blob Storage
- Document references will be stored in Cosmos DB
- Blob Storage container structure:
  ```
  /documents
    /{userId}
      /identity/
      /employment/
      /residential/
      /financial/
      /contracts/
  ```

### Local Storage Strategy
```typescript
interface LocalStorageData {
  formId: string;
  step: number;
  data: Partial<FormData>;
  lastUpdated: string;     // ISO date string
}
```

Sync Triggers:
1. Manual save by user
2. Auto-save (5-minute intervals)
3. Section completion
4. Form submission

## Indexing Requirements

### Primary Indexes
- User email (unique)
- Property IDs
- Document references
- Status fields
- Date fields (createdAt, updatedAt)

### Composite Indexes
1. User Collection:
   - [email, role]
   - [role, status]

2. Viewing Requests:
   - [propertyId, status]
   - [agentId, viewingDate]
   - [userId, status]

3. References:
   - [status, createdAt]
   - [userId, status]

4. Contracts:
   - [status, startDate]
   - [propertyId, status]

## Partitioning Strategy

### Container: Users
- Partition Key: `/id`
- Logical partitioning by user ID
- Estimated document size: 2-5 KB
- Expected RU/s: 400-600

### Container: References
- Partition Key: `/id`
- Logical partitioning by reference ID
- Estimated document size: 10-15 KB
- Expected RU/s: 800-1000

### Container: Viewings
- Partition Key: `/propertyId`
- Logical partitioning by property
- Estimated document size: 2-4 KB
- Expected RU/s: 400-600

### Container: Contracts
- Partition Key: `/id`
- Logical partitioning by contract ID
- Estimated document size: 5-8 KB
- Expected RU/s: 400-600

### Container: Dashboard
- Partition Key: `/userId`
- Logical partitioning by user
- Estimated document size: 5-10 KB
- Expected RU/s: 400-600

## Performance Considerations

### Caching Strategy
1. Redis Cache for:
   - User profiles
   - Property listings
   - Dashboard statistics
   - Recent activities

2. Cache TTL:
   - User profiles: 1 hour
   - Property listings: 15 minutes
   - Dashboard data: 5 minutes
   - Recent activities: 2 minutes

### Query Optimization
1. Implement materialized views for:
   - User activity summaries
   - Property viewing statistics
   - Reference status counts

2. Use change feed for:
   - Real-time dashboard updates
   - Activity logging
   - Search index updates

## Migration Approach

### Phase 1: Data Migration
1. Export Firestore data to JSON
2. Transform data to match Cosmos DB schema
3. Import data in batches
4. Verify data integrity

### Phase 2: Application Updates
1. Update backend services to use Cosmos DB SDK
2. Implement new data access patterns
3. Update frontend to handle new data structures
4. Implement local storage strategy

### Phase 3: Validation
1. Run parallel systems
2. Validate data consistency
3. Performance testing
4. Gradual traffic migration 