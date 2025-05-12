**Database Migration Plan: Firestore to Cosmos DB**

1. **Current Firestore Schema Analysis**
   ```
   Properties Collection:
   ├── Document Structure
   │   ├── Basic Information
   │   │   ├── propertyId (string)
   │   │   ├── title (string)
   │   │   ├── description (string)
   │   │   ├── price (number)
   │   │   ├── status (string: available/pending/sold)
   │   │   └── createdAt (timestamp)
   │   │
   │   ├── Location Data
   │   │   ├── address (object)
   │   │   │   ├── street
   │   │   │   ├── city
   │   │   │   ├── state
   │   │   │   └── postalCode
   │   │   ├── coordinates (geopoint)
   │   │   └── region (string)
   │   │
   │   ├── Property Details
   │   │   ├── propertyType (string)
   │   │   ├── bedrooms (number)
   │   │   ├── bathrooms (number)
   │   │   ├── area (number)
   │   │   └── features (array)
   │   │
   │   └── Media
   │       ├── images (array)
   │       └── videos (array)

   ViewingRequests Collection:
   ├── Document Structure
   │   ├── requestId (string)
   │   ├── propertyId (reference)
   │   ├── userId (reference)
   │   ├── requestDate (timestamp)
   │   ├── status (string)
   │   └── notes (string)

   Users Collection:
   ├── Document Structure
   │   ├── Basic Info
   │   │   ├── userId (string)
   │   │   ├── email (string)
   │   │   ├── displayName (string)
   │   │   └── phoneNumber (string)
   │   │
   │   ├── Preferences
   │   │   ├── savedProperties (array)
   │   │   └── searchHistory (array)
   │   │
   │   └── Metadata
   │       ├── createdAt (timestamp)
   │       ├── lastLogin (timestamp)
   │       └── userType (string)
   ```

2. **Cosmos DB Design**
   ```
   Database: ProptiiBD
   ├── Container: Properties
   │   ├── Partition Key: /region
   │   ├── Unique Key: /propertyId
   │   └── Indexing Policy
   │       ├── Included Paths
   │       │   ├── /propertyId/*
   │       │   ├── /status/*
   │       │   └── /location/*
   │       └── Excluded Paths
   │           └── /media/*
   │
   ├── Container: ViewingRequests
   │   ├── Partition Key: /propertyId
   │   ├── Unique Key: /requestId
   │   └── Indexing Policy
   │       └── Default
   │
   └── Container: Users
       ├── Partition Key: /userId
       ├── Unique Key: /email
       └── Indexing Policy
           ├── Included Paths
           │   ├── /userId/*
           │   └── /email/*
           └── Excluded Paths
               └── /searchHistory/*
   ```

3. **Data Mapping Strategy**
   ```
   Field Type Mappings:
   ├── Timestamps
   │   ├── Firestore: timestamp
   │   └── Cosmos DB: ISO 8601 string
   │
   ├── References
   │   ├── Firestore: document reference
   │   └── Cosmos DB: string (ID)
   │
   ├── Geopoint
   │   ├── Firestore: {latitude, longitude}
   │   └── Cosmos DB: Point GeoJSON
   │
   └── Arrays
       ├── Firestore: array
       └── Cosmos DB: array

   Special Handling:
   ├── Document References
   │   └── Convert to string IDs with container prefix
   │
   ├── Nested Objects
   │   └── Maintain structure with dot notation
   │
   └── Computed Fields
       ├── Add partitionKey field
       └── Add documentType field
   ```

4. **Migration Process**
   ```
   Pre-Migration:
   ├── Data Validation
   │   ├── Schema validation
   │   ├── Data integrity check
   │   └── Reference validation
   │
   ├── Environment Setup
   │   ├── Cosmos DB provisioning
   │   ├── Connection testing
   │   └── Tool preparation
   │
   └── Performance Planning
       ├── RU/s calculation
       ├── Batch size determination
       └── Throughput estimation

   Migration Execution:
   ├── Phase 1: Initial Sync
   │   ├── Users migration
   │   ├── Properties migration
   │   └── ViewingRequests migration
   │
   ├── Phase 2: Delta Sync
   │   ├── Change tracking setup
   │   ├── Incremental updates
   │   └── Consistency verification
   │
   └── Phase 3: Cutover
       ├── Read-only mode
       ├── Final sync
       └── Switch to Cosmos DB
   ```

5. **Validation Strategy**
   ```
   Data Validation:
   ├── Record Count Verification
   │   ├── Document counts match
   │   ├── Collection integrity
   │   └── Reference integrity
   │
   ├── Data Quality Checks
   │   ├── Schema compliance
   │   ├── Data type verification
   │   └── Business rule validation
   │
   └── Performance Validation
       ├── Query performance
       ├── Write performance
       └── Index effectiveness

   Application Testing:
   ├── Functionality Testing
   │   ├── CRUD operations
   │   ├── Query patterns
   │   └── Business logic
   │
   ├── Integration Testing
   │   ├── API endpoints
   │   ├── Authentication flows
   │   └── Frontend integration
   │
   └── Performance Testing
       ├── Load testing
       ├── Stress testing
       └── Latency measurement
   ```

6. **Rollback Plan**
   ```
   Rollback Triggers:
   ├── Data inconsistency
   ├── Performance degradation
   ├── Application errors
   └── Business validation failures

   Rollback Process:
   ├── Stop application traffic
   ├── Revert connection strings
   ├── Verify Firestore state
   └── Resume application

   Data Recovery:
   ├── Backup verification
   ├── Point-in-time recovery
   └── Data reconciliation
   ```

**Implementation Checklist:**

1. **Preparation Phase**
   - [ ] Document current Firestore schema
   - [ ] Design Cosmos DB structure
   - [ ] Create mapping documentation
   - [ ] Set up development environment
   - [ ] Prepare migration tools

2. **Development Phase**
   - [ ] Create migration scripts
   - [ ] Implement data transformations
   - [ ] Develop validation tools
   - [ ] Build monitoring solutions
   - [ ] Create rollback scripts

3. **Testing Phase**
   - [ ] Test with sample data
   - [ ] Validate data integrity
   - [ ] Performance testing
   - [ ] Rollback testing
   - [ ] Application integration testing

4. **Production Migration**
   - [ ] Schedule maintenance window
   - [ ] Execute migration plan
   - [ ] Validate production data
   - [ ] Monitor application performance
   - [ ] Document final state

**Critical Considerations:**
- Maintain data consistency during migration
- Monitor RU consumption
- Handle large document collections
- Manage reference integrity
- Plan for downtime minimization
- Consider regional distribution
- Implement proper error handling
- Document all transformation logic 