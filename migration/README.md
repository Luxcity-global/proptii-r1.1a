# Proptii Firestore to Cosmos DB Migration Tools

This repository contains the tools and scripts for migrating data from Firebase Firestore to Azure Cosmos DB.

## Repository Structure

```
migration/
├── src/
│   ├── export/           # Firestore export utilities
│   ├── transform/        # Data transformation logic
│   ├── import/          # Cosmos DB import utilities
│   ├── validation/      # Validation scripts
│   └── common/          # Shared utilities
│
├── config/              # Configuration files
│   ├── dev/            # Development environment
│   ├── staging/        # Staging environment
│   └── prod/           # Production environment
│
├── tests/              # Test suites
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── data/          # Test datasets
│
└── scripts/            # Utility scripts
    ├── setup/         # Environment setup
    ├── monitoring/    # Monitoring tools
    └── rollback/      # Rollback procedures
```

## Setup Instructions

1. Prerequisites
   - Node.js 18+
   - Firebase CLI
   - Azure CLI
   - Cosmos DB SDK

2. Environment Setup
   ```bash
   # Install dependencies
   npm install

   # Configure environment
   npm run setup:dev
   ```

3. Configuration
   - Copy `.env.example` to `.env.development`
   - Fill in required credentials
   - Configure collection mappings

## Migration Tools

### Export Tools
- Collection data export
- Schema validation
- Reference mapping
- Progress tracking

### Transform Tools
- Schema transformation
- Data type conversion
- Reference resolution
- Metadata enrichment

### Import Tools
- Batch import
- Validation checks
- Performance monitoring
- Error handling

### Validation Tools
- Data integrity checks
- Performance testing
- Reference validation
- Business rule verification

## Usage

1. Development Testing
   ```bash
   # Export test data
   npm run export:dev

   # Transform data
   npm run transform:dev

   # Import to dev environment
   npm run import:dev

   # Run validation
   npm run validate:dev
   ```

2. Staging Migration
   ```bash
   # Full migration
   npm run migrate:staging

   # Validation suite
   npm run validate:staging
   ```

3. Production Migration
   ```bash
   # Production migration
   npm run migrate:prod

   # Production validation
   npm run validate:prod
   ```

## Monitoring

- Azure Monitor integration
- Progress tracking
- Error logging
- Performance metrics

## Rollback Procedures

1. Trigger Conditions
   - Data inconsistency
   - Performance issues
   - Application errors

2. Rollback Steps
   ```bash
   # Initiate rollback
   npm run rollback:prod

   # Verify rollback
   npm run verify:rollback
   ```

## Support

For issues and support:
- Create an issue in the repository
- Contact the development team 