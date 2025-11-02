# Add Property Form - Structure & Firebase Integration

## Form Component Location
**File:** `src/landlord_agent/src/components/PropertySetup.tsx`

## Form Fields Identified

### Required Fields:
1. **address** (string, required)
   - Property full address
   - Input field with MapPin icon

2. **type** (string, required)
   - Property type selection
   - Options: 'Flat/Apartment', 'House', 'Studio', 'Room in shared house', 'Commercial', 'Other'
   - Dropdown/Select component

3. **rent** (number, required)
   - Monthly rent amount in £
   - Number input with PoundSterling icon
   - Must be > 0

### Optional Fields:
4. **bedrooms** (number, default: 1)
   - Number of bedrooms
   - Options: 0 (Studio), 1-6 bedrooms
   - Dropdown/Select component

5. **status** (string, default: 'vacant')
   - Occupancy status
   - Options: 'vacant', 'occupied', 'under-renovation'
   - Dropdown/Select with colored indicators

6. **amenities** (string[], default: [])
   - Array of selected amenities
   - Checkboxes for multiple selection
   - Available options:
     - Parking, Garden, Balcony, Furnished, Pet-friendly
     - Gym, Swimming Pool, Central Heating, Air Conditioning
     - Fireplace, Dishwasher, Washing Machine, High-speed Internet

7. **notes** (string, default: '')
   - Additional notes/text about the property
   - Textarea component

8. **photos** (PropertyPhoto[], default: [])
   - Array of property photos
   - Currently UI placeholder only (upload not implemented)
   - Structure: `{ id, url, filename, room?, isCover }`

9. **documents** (PropertyDocument[], default: [])
   - Array of property documents
   - Currently UI placeholder only (upload not implemented)
   - Structure: `{ id, name, type, url, issueDate, expiryDate?, status }`

## Property Interface (TypeScript)
```typescript
export interface Property {
  id: string;
  address: string;
  type: string;
  bedrooms: number;
  rent: number;
  status: 'vacant' | 'occupied' | 'under-renovation';
  amenities: string[];
  notes: string;
  photos: PropertyPhoto[];
  documents: PropertyDocument[];
  createdAt: Date;
  tenant?: Tenant;
  tenantId?: string;
}
```

## Current Form Submission
The form currently calls:
```typescript
onPropertyComplete(property)
```
Where property is:
```typescript
{
  address: string,
  type: string,
  bedrooms: number,
  rent: number,
  status: 'vacant' | 'occupied' | 'under-renovation',
  amenities: string[],
  notes: string,
  photos: PropertyPhoto[],
  documents: PropertyDocument[]
}
```

## Firebase Collection Structure

### Collection: `properties`

**Document Structure:**
```javascript
{
  // Required fields
  address: "123 Main Street, London, UK",
  type: "Flat/Apartment", // or House, Studio, etc.
  rent: 1500, // number
  
  // Optional fields
  bedrooms: 2, // number, default: 1
  status: "vacant", // "vacant" | "occupied" | "under-renovation"
  amenities: ["Parking", "Garden", "Furnished"], // string array
  notes: "Beautiful property with great views", // string
  
  // Nested arrays (for future implementation)
  photos: [], // PropertyPhoto[] - to be implemented
  documents: [], // PropertyDocument[] - to be implemented
  
  // Metadata
  createdAt: Timestamp, // Firebase Timestamp
  updatedAt: Timestamp, // Firebase Timestamp
  
  // Relations
  tenantId: "tenant-id-here", // optional, reference to tenant
  userId: "user-id-here", // landlord/agent who owns this property
  
  // IDs for relationships
  id: "property-id", // document ID
}
```

## Next Steps for Firebase Integration

1. Create `propertyService.ts` similar to `contractService.ts`
2. Implement CRUD operations (create, read, update, delete)
3. Update `PropertySetup.tsx` to use the service
4. Update Firestore rules to allow property creation
5. Integrate with Firebase Storage for photos/documents (future)


