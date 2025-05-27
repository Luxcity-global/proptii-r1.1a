const { initializeFirestore } = require('../utils/firestore');
const { logger } = require('../utils/logger');
const { getConfig } = require('../utils/config');
const { validateSchema } = require('../utils/validation');
const { handleExportError, MigrationError, ErrorCodes } = require('../utils/errorHandling');
const fs = require('fs').promises;
const path = require('path');

async function validateDocument(doc, collectionName) {
  try {
    const data = doc.data();
    await validateSchema(collectionName, data);
    return true;
  } catch (error) {
    logger.error(`Schema validation failed for document ${doc.id} in ${collectionName}:`, error);
    return false;
  }
}

async function checkRelationships(doc, collectionName, db) {
  try {
    const data = doc.data();
    const references = findReferences(data);
    
    for (const ref of references) {
      if (!ref || !ref.path) continue;
      
      try {
        const refDoc = await db.doc(ref.path).get();
        if (!refDoc.exists) {
          logger.error(`Invalid reference in ${collectionName}/${doc.id}: ${ref.path} does not exist`);
          return false;
        }
      } catch (error) {
        logger.error(`Error checking reference ${ref.path}:`, error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error(`Error checking relationships for ${doc.id}:`, error);
    return false;
  }
}

function findReferences(obj) {
  const references = [];
  
  function traverse(current) {
    if (!current) return;
    
    if (current && typeof current === 'object') {
      // Check if object is a Firestore reference
      if (current.constructor.name === 'DocumentReference') {
        references.push(current);
        return;
      }
      
      // Traverse object properties or array elements
      for (const key in current) {
        traverse(current[key]);
      }
    }
  }
  
  traverse(obj);
  return references;
}

async function saveExportedData(collectionName, data) {
  const config = await getConfig();
  const exportDir = path.join(process.cwd(), 'exports');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${collectionName}_${timestamp}.json`;
  
  try {
    // Create exports directory if it doesn't exist
    await fs.mkdir(exportDir, { recursive: true });
    
    // Save data with pretty formatting for readability
    await fs.writeFile(
      path.join(exportDir, filename),
      JSON.stringify(data, null, 2)
    );
    
    logger.info(`Exported data saved to ${filename}`);
    return filename;
  } catch (error) {
    throw new MigrationError(
      `Failed to save exported data for ${collectionName}`,
      ErrorCodes.EXPORT_SAVE_ERROR,
      { error: error.message }
    );
  }
}

async function exportData(collectionName, batchSize = 500) {
  const db = await initializeFirestore();
  const validDocuments = [];
  const failedDocuments = [];
  let lastProcessedDoc = null;
  let totalProcessed = 0;

  try {
    logger.info(`Starting export of ${collectionName} collection`);

    // Export in batches to handle large collections
    while (true) {
      let query = db.collection(collectionName).orderBy('__name__').limit(batchSize);
      if (lastProcessedDoc) {
        query = query.startAfter(lastProcessedDoc);
      }

      const snapshot = await query.get();
      if (snapshot.empty) break;

      // Process each document in the batch
      for (const doc of snapshot.docs) {
        try {
          const isValidSchema = await validateDocument(doc, collectionName);
          const hasValidRelationships = await checkRelationships(doc, collectionName, db);

          if (isValidSchema && hasValidRelationships) {
            validDocuments.push({
              id: doc.id,
              ...doc.data(),
              _metadata: {
                exportedAt: new Date().toISOString(),
                collection: collectionName,
                version: '1.0'
              }
            });
          } else {
            failedDocuments.push({
              id: doc.id,
              reason: !isValidSchema ? 'Invalid schema' : 'Invalid relationships'
            });
          }
        } catch (error) {
          failedDocuments.push({
            id: doc.id,
            reason: error.message
          });
          handleExportError(error, doc.id, collectionName);
        }

        lastProcessedDoc = doc;
        totalProcessed++;

        // Log progress every 1000 documents
        if (totalProcessed % 1000 === 0) {
          logger.info(`Progress: ${totalProcessed} documents processed in ${collectionName}`);
        }
      }
    }

    // Save exported data to file
    const exportedDataFile = await saveExportedData(collectionName, {
      collection: collectionName,
      exportedAt: new Date().toISOString(),
      summary: {
        total: totalProcessed,
        valid: validDocuments.length,
        failed: failedDocuments.length
      },
      data: validDocuments,
      failures: failedDocuments
    });

    return {
      success: failedDocuments.length === 0,
      summary: {
        total: totalProcessed,
        valid: validDocuments.length,
        failed: failedDocuments.length,
        exportFile: exportedDataFile
      },
      data: validDocuments,
      failedDocuments: failedDocuments
    };
  } catch (error) {
    throw new MigrationError(
      `Fatal error during export of ${collectionName}`,
      ErrorCodes.EXPORT_ERROR,
      { error: error.message }
    );
  }
}

async function main() {
  try {
    const config = await getConfig();
    const collections = [
      'Users',
      'References',
      'Viewings',
      'Contracts',
      'Dashboard'
    ];

    for (const collection of collections) {
      const data = await exportData(collection);
      // TODO: Implement data storage logic
      logger.info(`Successfully exported ${data.data.length} documents from ${collection}`);
    }
  } catch (error) {
    logger.error(`Export failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  exportData,
  validateDocument,
  checkRelationships
}; 