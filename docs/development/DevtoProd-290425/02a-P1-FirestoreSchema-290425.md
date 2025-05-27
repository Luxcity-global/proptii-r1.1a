**Current Firestore Schema Documentation**

1. **Project Configuration**
   ```
   Project ID: proptii-2ae8d
   Storage Bucket: proptii-2ae8d.appspot.com
   Authentication Domain: proptii-2ae8d.firebaseapp.com
   ```

2. **Collections Structure**

   a. **Properties Collection**
   ```typescript
   interface Property {
     // Basic Information
     propertyId: string;          // Document ID
     title: string;
     description: string;
     price: number;
     status: 'available' | 'pending' | 'sold';
     createdAt: Timestamp;
     updatedAt: Timestamp;

     // Location Information
     address: {
       street: string;
       city: string;
       town?: string;            // Optional
       postcode: string;
     };
     coordinates: GeoPoint;      // Latitude/Longitude
     region: string;             // Used for partitioning

     // Property Details
     propertyType: string;
     bedrooms: number;
     bathrooms: number;
     area: number;
     features: string[];         // Array of property features

     // Media
     images: string[];          // Array of image URLs
     videos?: string[];         // Optional array of video URLs

     // References
     agentId: string;          // Reference to agent
   }
   ```

   b. **ViewingRequests Collection**
   ```typescript
   interface ViewingRequest {
     requestId: string;         // Document ID
     propertyId: string;        // Reference to property
     userId: string;            // Reference to user
     agentId: string;          // Reference to agent
     requestDate: Timestamp;
     viewingDate: Timestamp;
     viewingTime: string;       // Format: "HH:mm"
     status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
     preference: string;
     notes?: string;           // Optional notes
     createdAt: Timestamp;
     updatedAt: Timestamp;
   }
   ```

   c. **Users Collection**
   ```typescript
   interface User {
     userId: string;           // Document ID
     email: string;
     displayName: string;
     phoneNumber?: string;     // Optional
     
     // Preferences
     savedProperties: string[];    // Array of property IDs
     searchHistory: {
       query: string;
       timestamp: Timestamp;
     }[];

     // Metadata
     createdAt: Timestamp;
     lastLogin: Timestamp;
     userType: 'buyer' | 'agent' | 'admin';
   }
   ```

3. **Indexes**
   ```
   Properties Collection:
   - Composite Index 1:
     Fields: [status ASC, price ASC]
     Purpose: Filter properties by status and sort by price

   - Composite Index 2:
     Fields: [location.city ASC, price ASC]
     Purpose: Filter properties by city and sort by price

   ViewingRequests Collection:
   - Composite Index 1:
     Fields: [agentId ASC, status ASC, requestDate DESC]
     Purpose: Filter agent's viewing requests by status and sort by date

   - Composite Index 2:
     Fields: [userId ASC, requestDate DESC]
     Purpose: Get user's viewing requests sorted by date
   ```

4. **Security Rules**
   ```javascript
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users Collection
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth.uid == userId;
       }

       // Properties Collection
       match /properties/{propertyId} {
         allow read: if true;  // Public read access
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null && 
           (resource.data.agentId == request.auth.uid || 
            request.auth.token.admin == true);
       }

       // ViewingRequests Collection
       match /viewingRequests/{requestId} {
         allow read: if request.auth != null && 
           (resource.data.userId == request.auth.uid || 
            resource.data.agentId == request.auth.uid);
         allow create: if request.auth != null;
         allow update: if request.auth != null && 
           (resource.data.userId == request.auth.uid || 
            resource.data.agentId == request.auth.uid);
         allow delete: if request.auth != null && 
           (resource.data.agentId == request.auth.uid || 
            request.auth.token.admin == true);
       }
     }
   }
   ```

5. **Query Patterns**
   ```typescript
   // Common queries based on the codebase:

   // Properties
   - Get available properties in a city sorted by price
   - Get properties by status
   - Get properties by agent
   - Search properties by features
   - Get properties in a price range

   // ViewingRequests
   - Get upcoming viewings for a property
   - Get agent's viewing schedule
   - Get user's viewing history
   - Get viewing requests by status

   // Users
   - Get user's saved properties
   - Get user's recent searches
   - Get agents in a specific region
   ```

6. **Data Relationships**
   ```
   One-to-Many:
   - Agent -> Properties
   - Property -> ViewingRequests
   - User -> ViewingRequests
   - User -> SavedProperties

   Many-to-One:
   - ViewingRequest -> Property
   - ViewingRequest -> Agent
   - ViewingRequest -> User
   ```

This documentation represents the current state of the Firestore database based on:
- Firebase configuration files
- Security rules
- Index definitions
- Entity definitions in the codebase
- API endpoints and services
- Frontend components and interfaces

Next steps will involve mapping this schema to Cosmos DB's structure while considering:
1. Partition key strategies
2. Data access patterns
3. Performance optimization
4. Migration approach 