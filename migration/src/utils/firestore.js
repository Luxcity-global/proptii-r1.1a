const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getConfig } = require('./config');
const { logger } = require('./logger');
const { MigrationError, ErrorCodes } = require('./errorHandling');

let firestoreInstance = null;

async function initializeFirestore() {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  try {
    const config = await getConfig();

    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert({
        projectId: config.firestore.projectId,
        clientEmail: config.firestore.clientEmail,
        privateKey: config.firestore.privateKey
      })
    });

    // Get Firestore instance
    firestoreInstance = getFirestore(app);

    // Configure Firestore settings
    firestoreInstance.settings({
      ignoreUndefinedProperties: true,
      timestampsInSnapshots: true
    });

    if (config.firestore.emulator) {
      const host = process.env.FIRESTORE_EMULATOR_HOST || 'localhost';
      const port = process.env.FIRESTORE_EMULATOR_PORT || 8080;
      
      firestoreInstance.settings({
        host: `${host}:${port}`,
        ssl: false
      });

      logger.info(`Firestore initialized with emulator at ${host}:${port}`);
    } else {
      logger.info('Firestore initialized with production settings');
    }

    return firestoreInstance;
  } catch (error) {
    throw new MigrationError(
      'Failed to initialize Firestore',
      ErrorCodes.CONFIG_ERROR,
      { error: error.message }
    );
  }
}

module.exports = {
  initializeFirestore
}; 