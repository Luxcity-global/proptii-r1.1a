const { CosmosClient } = require('@azure/cosmos');
const { initializeFirestore } = require('../../src/utils/firestore');
const { runMigration, migrateCollection } = require('../../src');
const { getConfig } = require('../../src/utils/config');

describe('Migration Integration Tests', () => {
    let firestoreDb;
    let cosmosContainers;
    let config;

    beforeAll(async () => {
        // Initialize Firestore
        firestoreDb = await initializeFirestore();

        // Get configuration
        config = await getConfig();

        // Initialize Cosmos DB
        const client = new CosmosClient({
            endpoint: config.cosmosDb.endpoint,
            key: config.cosmosDb.key
        });
        const database = client.database(config.cosmosDb.database);

        cosmosContainers = {
            users: database.container('Users'),
            references: database.container('References'),
            viewings: database.container('Viewings')
        };
    });

    beforeEach(async () => {
        // Clean up Cosmos DB containers before each test
        for (const container of Object.values(cosmosContainers)) {
            const { resources } = await container.items.readAll().fetchAll();
            for (const doc of resources) {
                await container.item(doc.id, doc._partitionKey).delete();
            }
        }
    });

    describe('Collection Migration', () => {
        test('should successfully migrate Users collection', async () => {
            const result = await migrateCollection('Users', cosmosContainers.users);
            expect(result.success).toBe(true);
            expect(result.summary.exported.total).toBeGreaterThan(0);
            expect(result.summary.transformed.total).toBe(result.summary.exported.valid);
            expect(result.summary.imported.successful).toBe(result.summary.transformed.transformed);
        });

        test('should successfully migrate Properties collection', async () => {
            const result = await migrateCollection('Properties', cosmosContainers.references);
            expect(result.success).toBe(true);
            expect(result.summary.exported.total).toBeGreaterThan(0);
            expect(result.summary.transformed.total).toBe(result.summary.exported.valid);
            expect(result.summary.imported.successful).toBe(result.summary.transformed.transformed);
        });

        test('should successfully migrate ViewingRequests collection', async () => {
            const result = await migrateCollection('ViewingRequests', cosmosContainers.viewings);
            expect(result.success).toBe(true);
            expect(result.summary.exported.total).toBeGreaterThan(0);
            expect(result.summary.transformed.total).toBe(result.summary.exported.valid);
            expect(result.summary.imported.successful).toBe(result.summary.transformed.transformed);
        });

        test('should handle non-existent collection gracefully', async () => {
            const result = await migrateCollection('NonExistentCollection', cosmosContainers.users);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Data Validation', () => {
        test('should maintain data integrity during migration', async () => {
            // Migrate Users collection
            const migrationResult = await migrateCollection('Users', cosmosContainers.users);
            expect(migrationResult.success).toBe(true);

            // Verify data in Cosmos DB
            const { resources: cosmosUsers } = await cosmosContainers.users.items.readAll().fetchAll();

            // Get original Firestore data
            const firestoreSnapshot = await firestoreDb.collection('Users').get();
            const firestoreUsers = [];
            firestoreSnapshot.forEach(doc => {
                firestoreUsers.push({ id: doc.id, ...doc.data() });
            });

            // Compare counts
            expect(cosmosUsers.length).toBe(firestoreUsers.length);

            // Compare data
            for (const firestoreUser of firestoreUsers) {
                const cosmosUser = cosmosUsers.find(u => u.id === firestoreUser.id);
                expect(cosmosUser).toBeDefined();
                expect(cosmosUser.email).toBe(firestoreUser.email);
                expect(cosmosUser._type).toBe('Users');
                expect(cosmosUser._partitionKey).toBeDefined();
            }
        });

        test('should handle references correctly', async () => {
            // Migrate ViewingRequests collection
            const result = await migrateCollection('ViewingRequests', cosmosContainers.viewings);
            expect(result.success).toBe(true);

            // Verify references in Cosmos DB
            const { resources: cosmosViewings } = await cosmosContainers.viewings.items.readAll().fetchAll();

            for (const viewing of cosmosViewings) {
                expect(viewing.propertyId).toHaveProperty('id');
                expect(viewing.propertyId).toHaveProperty('path');
                expect(viewing.userId).toHaveProperty('id');
                expect(viewing.userId).toHaveProperty('path');
            }
        });
    });

    describe('Error Handling', () => {
        test('should handle export errors gracefully', async () => {
            // Simulate export error by using invalid collection
            const result = await migrateCollection('InvalidCollection', cosmosContainers.users);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should handle transform errors gracefully', async () => {
            // Mock invalid data in Firestore
            await firestoreDb.collection('TestCollection').add({
                invalidField: new Date(), // This will cause a transform error
            });

            const result = await migrateCollection('TestCollection', cosmosContainers.users);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should handle import errors gracefully', async () => {
            // Mock network error during import
            jest.spyOn(cosmosContainers.users.items, 'bulk').mockRejectedValueOnce(new Error('Network error'));

            const result = await migrateCollection('Users', cosmosContainers.users);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Network error');
        });
    });

    describe('Full Migration', () => {
        test('should successfully complete full migration', async () => {
            const result = await runMigration();
            expect(result.startTime).toBeDefined();
            expect(result.collections).toHaveLength(3);

            for (const collection of result.collections) {
                expect(collection.success).toBe(true);
                expect(collection.summary).toBeDefined();
                expect(collection.error).toBeNull();
            }
        });
    });
}); 