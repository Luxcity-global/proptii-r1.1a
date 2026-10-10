import * as admin from 'firebase-admin';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountStr) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountStr);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

// Test IDs
const LANDLORD_ID = '7ZJRluJwx2e4UXIJlOKUtMRTmuY2'; // tosin@theluxcity.co.uk
const TENANT_ID = '0dedfacd-0a2c-43e5-911b-b166fd77ab4d'; // dev.01@theluxcity.co.uk
const PROPERTY_ID = 'seed-prop-001';

async function seed() {
  console.log('Seeding Firestore...');

  const conversationId = randomUUID();
  const now = new Date().toISOString();
  
  // 1. Create Conversation
  const convPayload = {
    id: conversationId,
    propertyId: PROPERTY_ID,
    tenantId: TENANT_ID,
    landlordId: LANDLORD_ID,
    propertyTitle: 'Beautiful Seeded Apartment',
    tenantName: 'Dev Tenant 01',
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    lastMessagePreview: 'Is the apartment still available?',
    unreadForTenant: 0,
    unreadForLandlord: 1, // Landlord has 1 unread message
    isDeleted: false,
  };

  await db.collection('conversations').doc(conversationId).set(convPayload);
  console.log(`✅ Conversation created: ${conversationId}`);

  // 2. Create Message
  const messageId = randomUUID();
  const msgPayload = {
    id: messageId,
    conversationId: conversationId,
    senderId: TENANT_ID,
    body: 'Hi there! Is the apartment still available? I would love to arrange a viewing.',
    attachmentIds: [],
    senderRole: 'tenant',
    sentAt: now,
    readAt: null,
    isDeleted: false,
  };

  await db.collection('messages').doc(messageId).set(msgPayload);
  console.log(`✅ Message created: ${messageId}`);

  console.log('\nSeeding completed.');
  console.log('You can now log in to test:');
  console.log('Landlord: tosin@theluxcity.co.uk');
  console.log('Tenant: dev.01@theluxcity.co.uk');
}

seed().catch(console.error).finally(() => process.exit(0));
