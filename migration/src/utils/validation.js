const { logger } = require('./logger');
const { MigrationError, ErrorCodes } = require('./errorHandling');

// Schema definitions for each collection
const schemas = {
    Users: {
        required: ['email', 'createdAt'],
        properties: {
            email: { type: 'string', format: 'email' },
            displayName: { type: 'string' },
            phoneNumber: { type: 'string' },
            createdAt: { type: 'object' }, // Firestore Timestamp
            lastLoginAt: { type: 'object' }, // Firestore Timestamp
            role: { type: 'string', enum: ['user', 'admin', 'agent'] }
        }
    },
    Properties: {
        required: ['title', 'price', 'status', 'createdAt'],
        properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            status: { type: 'string', enum: ['available', 'pending', 'sold'] },
            createdAt: { type: 'object' }, // Firestore Timestamp
            address: {
                type: 'object',
                required: ['street', 'city', 'state', 'postalCode'],
                properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    postalCode: { type: 'string' }
                }
            },
            coordinates: { type: 'object' }, // Firestore GeoPoint
            propertyType: { type: 'string' },
            bedrooms: { type: 'number' },
            bathrooms: { type: 'number' },
            area: { type: 'number' },
            features: { type: 'array', items: { type: 'string' } },
            images: { type: 'array', items: { type: 'string' } },
            videos: { type: 'array', items: { type: 'string' } }
        }
    },
    ViewingRequests: {
        required: ['propertyId', 'userId', 'requestDate', 'status'],
        properties: {
            propertyId: { type: 'object' }, // Firestore Reference
            userId: { type: 'object' }, // Firestore Reference
            requestDate: { type: 'object' }, // Firestore Timestamp
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'completed'] },
            notes: { type: 'string' }
        }
    }
};

function validateType(value, type) {
    switch (type) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number';
        case 'boolean':
            return typeof value === 'boolean';
        case 'object':
            return typeof value === 'object' && value !== null;
        case 'array':
            return Array.isArray(value);
        default:
            return true; // Unknown types are considered valid
    }
}

function validateEnum(value, enumValues) {
    return enumValues.includes(value);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function validateSchema(collectionName, data) {
    const schema = schemas[collectionName];
    if (!schema) {
        throw new MigrationError(
            `No schema defined for collection: ${collectionName}`,
            ErrorCodes.SCHEMA_VALIDATION_ERROR
        );
    }

    const errors = [];

    // Check required fields
    for (const field of schema.required) {
        if (!(field in data)) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Validate properties
    for (const [field, value] of Object.entries(data)) {
        const propertySchema = schema.properties[field];
        if (!propertySchema) continue; // Skip validation for unknown fields

        // Type validation
        if (!validateType(value, propertySchema.type)) {
            errors.push(`Invalid type for ${field}: expected ${propertySchema.type}`);
            continue;
        }

        // Enum validation
        if (propertySchema.enum && !validateEnum(value, propertySchema.enum)) {
            errors.push(`Invalid value for ${field}: must be one of [${propertySchema.enum.join(', ')}]`);
        }

        // Email format validation
        if (propertySchema.format === 'email' && !validateEmail(value)) {
            errors.push(`Invalid email format for ${field}`);
        }

        // Nested object validation
        if (propertySchema.type === 'object' && propertySchema.properties) {
            for (const [nestedField, nestedSchema] of Object.entries(propertySchema.properties)) {
                if (propertySchema.required?.includes(nestedField) && !(nestedField in value)) {
                    errors.push(`Missing required nested field: ${field}.${nestedField}`);
                }
                if (value[nestedField] && !validateType(value[nestedField], nestedSchema.type)) {
                    errors.push(`Invalid type for ${field}.${nestedField}: expected ${nestedSchema.type}`);
                }
            }
        }

        // Array validation
        if (propertySchema.type === 'array' && propertySchema.items) {
            for (const item of value) {
                if (!validateType(item, propertySchema.items.type)) {
                    errors.push(`Invalid type in array ${field}: expected items of type ${propertySchema.items.type}`);
                    break;
                }
            }
        }
    }

    if (errors.length > 0) {
        throw new MigrationError(
            `Schema validation failed for ${collectionName}`,
            ErrorCodes.SCHEMA_VALIDATION_ERROR,
            { errors }
        );
    }

    return true;
}

module.exports = {
    validateSchema,
    schemas
}; 