/**
 * seed-messaging.mjs
 *
 * Seeds a landlord, tenant, conversation, and messages into MongoDB Atlas
 * for local testing of the Proptii messaging system.
 *
 * Usage:
 *   node scripts/seed-messaging.mjs
 *
 * Prerequisites:
 *   - MongoDB Atlas cluster accessible at the URI below
 *   - The proptii-communication database must exist (created on first insert)
 */

import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';

// ── Config ────────────────────────────────────────────────────────────────────
const MONGODB_URI = 'mongodb+srv://miracle:heavengate@proptii.o9zltfe.mongodb.net/';
const DB_NAME = 'proptii-communication';

// ── Test identities ───────────────────────────────────────────────────────────
// These IDs must match the Azure AD B2C `sub` claims of your test users.
// If you don't have real B2C users yet, use these placeholder UUIDs —
// the API will still store and return the data, but auth guards will block
// access unless the Bearer token's `sub` matches one of these IDs.
const LANDLORD_ID = 'landlord-test-001';
const TENANT_ID = 'tenant-test-001';
const PROPERTY_ID = 'property-test-001';

// ── Helpers ───────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();
const ago = (seconds) => new Date(Date.now() - seconds * 1000).toISOString();

async function seed() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');

        const db = client.db(DB_NAME);

        // ── 1. Create conversation ─────────────────────────────────────────────
        const conversationId = randomUUID();
        const conversation = {
            id: conversationId,
            propertyId: PROPERTY_ID,
            tenantId: TENANT_ID,
            landlordId: LANDLORD_ID,
            createdAt: ago(3600),       // 1 hour ago
            updatedAt: ago(60),         // 1 minute ago
            lastMessageAt: ago(60),
            isDeleted: false,
            deletedAt: null,
        };

        await db.collection('conversations').replaceOne(
            { id: conversationId },
            conversation,
            { upsert: true },
        );
        console.log(`✅ Conversation created: ${conversationId}`);

        // ── 2. Create participants ─────────────────────────────────────────────
        const participants = [
            {
                id: randomUUID(),
                conversationId,
                userId: TENANT_ID,
                role: 'tenant',
                joinedAt: ago(3600),
            },
            {
                id: randomUUID(),
                conversationId,
                userId: LANDLORD_ID,
                role: 'landlord',
                joinedAt: ago(3600),
            },
        ];

        for (const p of participants) {
            await db.collection('conversation_participants').replaceOne(
                { conversationId, userId: p.userId },
                p,
                { upsert: true },
            );
        }
        console.log(`✅ Participants created (tenant + landlord)`);

        // ── 3. Create messages ─────────────────────────────────────────────────
        const messages = [
            {
                id: randomUUID(),
                conversationId,
                senderId: TENANT_ID,
                senderRole: 'tenant',
                body: 'Hi, I saw your property listing and I\'m very interested. Is it still available?',
                attachmentIds: [],
                sentAt: ago(3500),
                readAt: ago(3400),        // Landlord has read this
                isDeleted: false,
                deletedAt: null,
            },
            {
                id: randomUUID(),
                conversationId,
                senderId: LANDLORD_ID,
                senderRole: 'landlord',
                body: 'Yes, the property is still available! Would you like to arrange a viewing?',
                attachmentIds: [],
                sentAt: ago(3400),
                readAt: ago(3300),        // Tenant has read this
                isDeleted: false,
                deletedAt: null,
            },
            {
                id: randomUUID(),
                conversationId,
                senderId: TENANT_ID,
                senderRole: 'tenant',
                body: 'That would be great! I\'m free this Saturday afternoon. Does 2pm work for you?',
                attachmentIds: [],
                sentAt: ago(3300),
                readAt: ago(3200),
                isDeleted: false,
                deletedAt: null,
            },
            {
                id: randomUUID(),
                conversationId,
                senderId: LANDLORD_ID,
                senderRole: 'landlord',
                body: 'Saturday 2pm works perfectly. The address is 42 Maple Street, London, E1 6RF. See you then!',
                attachmentIds: [],
                sentAt: ago(60),
                readAt: null,             // Tenant has NOT read this yet — will show as unread
                isDeleted: false,
                deletedAt: null,
            },
        ];

        for (const msg of messages) {
            await db.collection('messages').replaceOne(
                { id: msg.id },
                msg,
                { upsert: true },
            );
        }
        console.log(`✅ ${messages.length} messages created`);

        // ── 4. Create Users (for lastSeenAt tracking) ──────────────────────────
        const users = [
            {
                id: LANDLORD_ID,
                email: 'landlord@test.proptii.co',
                firstName: 'John',
                lastName: 'Smith',
                lastSeenAt: ago(600),     // 10 minutes ago — inactive, will receive email
            },
            {
                id: TENANT_ID,
                email: 'tenant@test.proptii.co',
                firstName: 'Sarah',
                lastName: 'Jones',
                lastSeenAt: ago(30),      // 30 seconds ago — active, won't receive email
            },
            {
                id: 'tenant-test-002',
                email: 'tenant-two@test.proptii.co',
                firstName: 'Emily',
                lastName: 'Davis',
                lastSeenAt: ago(30),
            },
        ];

        for (const user of users) {
            await db.collection('Users').replaceOne(
                { id: user.id },
                user,
                { upsert: true },
            );
        }
        console.log(`✅ Users created (landlord + tenant)`);

        // ── 5. Create native property for landlord-test-001 ───────────────────
        const nativeProperty = {
            id: 'seeded-native-001',
            title: 'Beautiful Seeded Penthouse in London',
            address: '1 Seeded Street, London',
            city: 'London',
            postcode: 'E1 6RF',
            price: '£2,500 pcm',
            bedrooms: 2,
            bathrooms: 2,
            amenities: ['wifi', 'gym', 'parking'],
            photos: [],
            documents: [],
            status: 'vacant',
            userId: 'landlord-test-001',
            ownerEmail: 'landlord@test.proptii.co',
            landlordId: 'landlord-test-001',
            source: 'native',
            createdAt: now(),
            updatedAt: now()
        };

        await db.collection('native_properties').replaceOne(
            { id: 'seeded-native-001' },
            nativeProperty,
            { upsert: true }
        );
        console.log('✅ Native property created for landlord-test-001');

        // ── 6. Create unclaimed scraped property for landlord-test-002 to claim ───────────────────
        const unclaimedScrapedProperty = {
            title: 'Spacious Unclaimed Apartment',
            price: '£1,800 pcm',
            location: '2 Seeded Lane, London',
            bedrooms: 3,
            bathrooms: 1,
            description: 'A beautiful unclaimed scraped property ready for claiming.',
            imageUrls: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'],
            agent: {
                name: 'Agent Two',
                email: 'landlord-two@test.proptii.co',
                phone: '07123456789',
                website: 'https://agenttwo.co.uk'
            },
            source: 'scraped',
            url: 'https://www.rightmove.co.uk/properties/seeded-scraped-002',
            scrapedAt: new Date(),
            landlordId: null
        };

        await db.collection('scraped_properties').replaceOne(
            { url: 'https://www.rightmove.co.uk/properties/seeded-scraped-002' },
            unclaimedScrapedProperty,
            { upsert: true }
        );
        console.log('✅ Unclaimed scraped property created');

        // ── 7. Create Landlord 2 User ──────────────────────────────────────────
        const landlord2 = {
            id: 'landlord-test-002',
            email: 'landlord-two@test.proptii.co',
            firstName: 'Jack',
            lastName: 'Smith',
            lastSeenAt: now()
        };

        await db.collection('Users').replaceOne(
            { id: 'landlord-test-002' },
            landlord2,
            { upsert: true }
        );
        console.log('✅ Landlord 2 user created');

        // ── Summary ────────────────────────────────────────────────────────────
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Seed complete. Test data summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  Conversation ID : ${conversationId}`);
        console.log(`  Landlord ID     : ${LANDLORD_ID}`);
        console.log(`  Tenant ID       : ${TENANT_ID}`);
        console.log(`  Property ID     : ${PROPERTY_ID}`);
        console.log(`  Messages        : ${messages.length} (1 unread for tenant)`);
        console.log('');
        console.log('  To test the API, use a Bearer token whose `sub` claim');
        console.log('  matches LANDLORD_ID or TENANT_ID above.');
        console.log('');
        console.log('  To use real B2C user IDs, update LANDLORD_ID and TENANT_ID');
        console.log('  at the top of this script to match your actual B2C object IDs.');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } finally {
        await client.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
