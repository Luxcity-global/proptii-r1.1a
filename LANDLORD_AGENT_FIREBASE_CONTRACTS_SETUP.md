# Firebase Setup Guide for Contracts Page

## Overview

Firebase is perfect for the contracts flow because it provides:
- **Firestore** - NoSQL database for contract metadata
- **Firebase Storage** - For storing contract PDF files
- **Firebase Functions** - For sending emails/notifications
- **Real-time Updates** - Live status changes across devices
- **Security Rules** - Fine-grained access control

---

## 1. Firebase Configuration Setup

### Step 1: Create Firebase Config File

Create `src/landlord_agent/src/config/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Your Firebase config (from Firebase Console)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
```

### Step 2: Environment Variables

Add to `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 2. Firestore Data Structure

### Contracts Collection Structure

**Collection: `contracts`**

```typescript
{
  id: string,                    // Auto-generated document ID
  title: string,
  propertyId: string,            // Reference to properties collection
  propertyAddress: string,
  tenantId: string,              // Reference to tenants collection
  tenantName: string,
  tenantEmail: string,
  landlordId: string,           // Reference to landlords/users collection
  status: 'draft' | 'sent' | 'unsigned' | 'signed' | 'expired',
  contractType: 'tenancy-agreement' | 'deposit-certificate' | 'right-to-rent' | 'other',
  
  // File information
  fileName: string,
  fileUrl: string,               // Firebase Storage URL
  filePath: string,              // Storage path
  
  // Dates
  createdAt: Timestamp,
  sentDate: Timestamp,
  signedDate?: Timestamp,
  expiryDate?: Timestamp,
  
  // Additional info
  additionalInfo?: string,
  
  // Signing workflow
  recipientSignature?: {
    signed: boolean,
    signedAt?: Timestamp,
    signatureUrl?: string
  },
  landlordSignature?: {
    signed: boolean,
    signedAt?: Timestamp,
    signatureUrl?: string
  },
  
  // Notifications
  notificationSent: boolean,
  lastReminderSent?: Timestamp,
  reminderCount: number
}
```

### Indexes Required

Create these Firestore indexes:

1. **contracts/status + createdAt (descending)** - For filtering by status
2. **contracts/expiryDate + status** - For expiry alerts
3. **contracts/tenantId + status** - For tenant contract queries
4. **contracts/propertyId + status** - For property contract queries

---

## 3. Firebase Storage Structure

### Storage Paths

```
contracts/
  ├── {contractId}/
  │   ├── original/
  │   │   └── {fileName}.pdf
  │   ├── signed/
  │   │   └── {fileName}_signed.pdf
  │   └── signatures/
  │       ├── tenant_signature.png
  │       └── landlord_signature.png
```

---

## 4. Contract Service Implementation

Create `src/landlord_agent/src/services/contractService.ts`:

```typescript
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Contract } from '../components/ContractsPage';

class ContractService {
  private contractsCollection = collection(db, 'contracts');

  /**
   * Create a new contract
   */
  async createContract(
    contractData: Omit<Contract, 'id'>,
    file: File
  ): Promise<string> {
    try {
      // 1. Upload file to Firebase Storage
      const filePath = `contracts/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // 2. Create contract document in Firestore
      const contractDoc = {
        ...contractData,
        fileUrl,
        filePath,
        fileName: file.name,
        createdAt: Timestamp.now(),
        sentDate: Timestamp.now(),
        notificationSent: false,
        reminderCount: 0,
        status: 'sent' as const
      };

      const docRef = await addDoc(this.contractsCollection, contractDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  /**
   * Get all contracts with optional filters
   */
  async getContracts(
    filters?: {
      status?: Contract['status'];
      tenantId?: string;
      propertyId?: string;
    }
  ): Promise<Contract[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.tenantId) {
        constraints.push(where('tenantId', '==', filters.tenantId));
      }
      if (filters?.propertyId) {
        constraints.push(where('propertyId', '==', filters.propertyId));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(this.contractsCollection, ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentDate: doc.data().sentDate?.toDate(),
        signedDate: doc.data().signedDate?.toDate(),
        expiryDate: doc.data().expiryDate?.toDate(),
      })) as Contract[];
    } catch (error) {
      console.error('Error getting contracts:', error);
      throw error;
    }
  }

  /**
   * Get a single contract by ID
   */
  async getContract(contractId: string): Promise<Contract | null> {
    try {
      const docRef = doc(this.contractsCollection, contractId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          sentDate: data.sentDate?.toDate(),
          signedDate: data.signedDate?.toDate(),
          expiryDate: data.expiryDate?.toDate(),
        } as Contract;
      }
      return null;
    } catch (error) {
      console.error('Error getting contract:', error);
      throw error;
    }
  }

  /**
   * Update contract status
   */
  async updateContractStatus(
    contractId: string,
    status: Contract['status'],
    signedDate?: Date
  ): Promise<void> {
    try {
      const docRef = doc(this.contractsCollection, contractId);
      const updateData: any = { status };

      if (signedDate) {
        updateData.signedDate = Timestamp.fromDate(signedDate);
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating contract status:', error);
      throw error;
    }
  }

  /**
   * Mark contract as signed
   */
  async markAsSigned(
    contractId: string,
    signedBy: 'tenant' | 'landlord'
  ): Promise<void> {
    try {
      const docRef = doc(this.contractsCollection, contractId);
      const updateData: any = {
        [`${signedBy}Signature.signed`]: true,
        [`${signedBy}Signature.signedAt`]: Timestamp.now(),
        status: 'signed' as const,
        signedDate: Timestamp.now()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error marking contract as signed:', error);
      throw error;
    }
  }

  /**
   * Delete a contract
   */
  async deleteContract(contractId: string): Promise<void> {
    try {
      // Get contract to find file path
      const contract = await this.getContract(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Delete file from Storage
      if (contract.filePath) {
        const storageRef = ref(storage, contract.filePath);
        await deleteObject(storageRef);
      }

      // Delete document from Firestore
      const docRef = doc(this.contractsCollection, contractId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting contract:', error);
      throw error;
    }
  }

  /**
   * Get contracts expiring soon
   */
  async getExpiringContracts(days: number = 7): Promise<Contract[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      
      const q = query(
        this.contractsCollection,
        where('expiryDate', '<=', Timestamp.fromDate(expiryDate)),
        where('status', '==', 'sent'),
        orderBy('expiryDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentDate: doc.data().sentDate?.toDate(),
        signedDate: doc.data().signedDate?.toDate(),
        expiryDate: doc.data().expiryDate?.toDate(),
      })) as Contract[];
    } catch (error) {
      console.error('Error getting expiring contracts:', error);
      throw error;
    }
  }
}

export const contractService = new ContractService();
```

---

## 5. Update ContractsPage Component

Replace mock data with Firebase calls:

```typescript
import { useState, useEffect } from 'react';
import { contractService } from '../services/contractService';
import { Contract } from './ContractsPage';

export function ContractsPage({ onBack }: ContractsPageProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sent' | 'unsigned' | 'signed'>('sent');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  useEffect(() => {
    loadContracts();
  }, [activeTab]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const statusMap = {
        'sent': 'sent',
        'unsigned': 'unsigned',
        'signed': 'signed'
      };
      
      const fetchedContracts = await contractService.getContracts({
        status: statusMap[activeTab]
      });
      
      setContracts(fetchedContracts);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendContract = async (contractData: {
    file: File;
    recipientName: string;
    recipientEmail: string;
    additionalInfo?: string;
  }) => {
    try {
      // Create contract document
      const contractId = await contractService.createContract({
        title: contractData.file.name,
        tenantName: contractData.recipientName,
        tenantEmail: contractData.recipientEmail,
        propertyAddress: '', // Get from context
        contractType: 'tenancy-agreement',
        additionalInfo: contractData.additionalInfo,
        status: 'sent',
        sentDate: new Date(),
        fileUrl: '',
        fileName: contractData.file.name,
      }, contractData.file);

      // Reload contracts
      await loadContracts();
      setIsSendModalOpen(false);
    } catch (error) {
      console.error('Error sending contract:', error);
    }
  };

  const handleMarkAsSigned = async (contractId: string) => {
    try {
      await contractService.markAsSigned(contractId, 'tenant');
      await loadContracts();
    } catch (error) {
      console.error('Error marking contract as signed:', error);
    }
  };

  // ... rest of component
}
```

---

## 6. Firebase Security Rules

Add to `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Contracts collection
    match /contracts/{contractId} {
      // Users can read their own contracts
      allow read: if request.auth != null && 
        (resource.data.landlordId == request.auth.uid || 
         resource.data.tenantId == request.auth.uid);
      
      // Only landlords can create contracts
      allow create: if request.auth != null && 
        request.resource.data.landlordId == request.auth.uid;
      
      // Only landlords can update contracts
      allow update: if request.auth != null && 
        resource.data.landlordId == request.auth.uid;
      
      // Only landlords can delete contracts
      allow delete: if request.auth != null && 
        resource.data.landlordId == request.auth.uid;
    }
  }
}
```

Add to `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /contracts/{contractId}/{allPaths=**} {
      // Users can read their own contract files
      allow read: if request.auth != null;
      
      // Only authenticated users can upload
      allow write: if request.auth != null && 
        request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
  }
}
```

---

## 7. Real-time Updates (Optional)

For live contract status updates:

```typescript
import { onSnapshot, query, where } from 'firebase/firestore';

// Subscribe to contract changes
useEffect(() => {
  const q = query(
    contractsCollection,
    where('status', '==', 'sent'),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const updatedContracts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sentDate: doc.data().sentDate?.toDate(),
      signedDate: doc.data().signedDate?.toDate(),
      expiryDate: doc.data().expiryDate?.toDate(),
    })) as Contract[];
    
    setContracts(updatedContracts);
  });

  return () => unsubscribe();
}, [activeTab]);
```

---

## 8. Next Steps

1. **Set up Firebase Project**
   - Go to Firebase Console
   - Create new project or use existing
   - Enable Firestore Database
   - Enable Firebase Storage
   - Get your config credentials

2. **Install Dependencies** (already installed)
   ```bash
   npm install firebase
   ```

3. **Create Firebase Config File**
   - Create `src/landlord_agent/src/config/firebase.ts`
   - Add environment variables

4. **Create Contract Service**
   - Create `src/landlord_agent/src/services/contractService.ts`
   - Implement CRUD operations

5. **Update Components**
   - Replace mock data in `ContractsPage.tsx`
   - Update `SendContractModal.tsx` to use service

6. **Set Security Rules**
   - Configure Firestore rules
   - Configure Storage rules

7. **Test Integration**
   - Test contract creation
   - Test file uploads
   - Test status updates

---

## 9. Benefits of Using Firebase

✅ **Real-time Updates** - Contract status changes instantly  
✅ **Scalable** - Handles millions of documents  
✅ **Secure** - Built-in authentication and security rules  
✅ **File Storage** - Integrated storage for PDFs  
✅ **No Server Required** - Client-side operations  
✅ **Offline Support** - Works offline with sync  
✅ **Cost Effective** - Pay only for what you use  

---

## 10. Alternative: Backend API Approach

If you prefer a backend API instead of direct Firebase client access:

1. Create Firebase Admin SDK backend service
2. Create REST API endpoints for contracts
3. Frontend calls API, API uses Firebase Admin SDK
4. Better security control and business logic separation

Would you like me to create the backend API approach instead?

---

*Last Updated: [Current Date]*
*Status: Ready for Implementation*

