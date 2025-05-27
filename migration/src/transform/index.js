const { logger } = require('../utils/logger');
const { MigrationError, ErrorCodes } = require('../utils/errorHandling');

// Type transformation functions
const transformers = {
  timestamp: (value) => {
    if (!value) return null;
    if (value._seconds) {
      return new Date(value._seconds * 1000).toISOString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  },

  geopoint: (value) => {
    if (!value) return null;
    return {
      type: 'Point',
      coordinates: [
        value.longitude || value._longitude || 0,
        value.latitude || value._latitude || 0
      ]
    };
  },

  reference: (value) => {
    if (!value) return null;
    return {
      id: value.id,
      path: value.path,
      collection: value.parent?.id || value.path.split('/')[0]
    };
  },

  array: (value, itemTransformer = null) => {
    if (!Array.isArray(value)) return [];
    return itemTransformer 
      ? value.map(item => itemTransformer(item))
      : value;
  }
};

// Collection-specific transformation rules
const transformationRules = {
  Users: {
    email: { type: 'string' },
    displayName: { type: 'string' },
    phoneNumber: { type: 'string' },
    createdAt: { type: 'timestamp', transformer: transformers.timestamp },
    lastLoginAt: { type: 'timestamp', transformer: transformers.timestamp },
    role: { type: 'string' },
    _partitionKey: (doc) => doc.id
  },

  Properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    price: { type: 'number' },
    status: { type: 'string' },
    createdAt: { type: 'timestamp', transformer: transformers.timestamp },
    address: { type: 'object' },
    coordinates: { type: 'geopoint', transformer: transformers.geopoint },
    propertyType: { type: 'string' },
    bedrooms: { type: 'number' },
    bathrooms: { type: 'number' },
    area: { type: 'number' },
    features: { type: 'array' },
    images: { type: 'array' },
    videos: { type: 'array' },
    _partitionKey: (doc) => doc.address?.region || 'default'
  },

  ViewingRequests: {
    propertyId: { type: 'reference', transformer: transformers.reference },
    userId: { type: 'reference', transformer: transformers.reference },
    requestDate: { type: 'timestamp', transformer: transformers.timestamp },
    status: { type: 'string' },
    notes: { type: 'string' },
    _partitionKey: (doc) => doc.propertyId?.id || 'default'
  }
};

async function transformDocument(doc, collectionName) {
  try {
    const rules = transformationRules[collectionName];
    if (!rules) {
      throw new MigrationError(
        `No transformation rules defined for collection: ${collectionName}`,
        ErrorCodes.TRANSFORM_ERROR
      );
    }

    const transformed = {
      id: doc.id,
      _type: collectionName
    };

    // Apply field transformations
    for (const [field, value] of Object.entries(doc)) {
      const rule = rules[field];
      
      if (!rule) {
        // Copy fields without transformation rules as-is
        transformed[field] = value;
        continue;
      }

      if (rule.transformer) {
        transformed[field] = rule.transformer(value);
      } else {
        transformed[field] = value;
      }
    }

    // Generate partition key
    if (typeof rules._partitionKey === 'function') {
      transformed._partitionKey = rules._partitionKey(doc);
    }

    // Add metadata
    transformed._metadata = {
      createdAt: new Date().toISOString(),
      source: 'firestore',
      originalId: doc.id
    };

    return transformed;
  } catch (error) {
    throw new MigrationError(
      `Failed to transform document ${doc.id}`,
      ErrorCodes.TRANSFORM_ERROR,
      { error: error.message, document: doc.id }
    );
  }
}

async function transformCollection(documents, collectionName) {
  const transformedDocs = [];
  const failedDocs = [];
  let totalProcessed = 0;

  logger.info(`Starting transformation of ${documents.length} documents from ${collectionName}`);

  for (const doc of documents) {
    try {
      const transformed = await transformDocument(doc, collectionName);
      transformedDocs.push(transformed);
    } catch (error) {
      failedDocs.push({
        id: doc.id,
        error: error.message
      });
      logger.error(`Failed to transform document ${doc.id}:`, error);
    }

    totalProcessed++;
    if (totalProcessed % 1000 === 0) {
      logger.info(`Transformed ${totalProcessed} documents from ${collectionName}`);
    }
  }

  return {
    success: failedDocs.length === 0,
    summary: {
      total: documents.length,
      transformed: transformedDocs.length,
      failed: failedDocs.length
    },
    data: transformedDocs,
    failedDocuments: failedDocs
  };
}

module.exports = {
  transformCollection,
  transformDocument,
  transformationRules
}; 