# Proptii Core Backend Service

The Proptii Backend is a high-performance, modular **NestJS** application serving as the central API gateway and business logic engine for the entire ecosystem.

## 🛠️ Core Technology Stack
- **Framework**: [NestJS](https://nestjs.com/) (Express-based)
- **Database**: [Azure SQL Database](https://azure.microsoft.com/en-us/products/azure-sql/database/) with [TypeORM](https://typeorm.io/)
- **AI Engine**: [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service/) for semantic property discovery.
- **Cloud Storage**: [Azure Blob Storage](https://azure.microsoft.com/en-us/products/storage/blobs/) for secure document management.
- **Authentication**: Firebase Admin SDK & MSAL for secure identity verification.

---

## 🚀 Quick Start (Backend Only)

### 1. Installation
Ensure you have Node.js 20+ installed.
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file based on the keys required in `src/config/`. Essential variables:
- `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`: SQL Server credentials.
- `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`: AI search credentials.
- `FIREBASE_PROJECT_ID`: Backend auth validation.

### 3. Database Management
The project uses TypeORM migrations to manage the SQL Server schema.
```bash
# Run pending migrations
npm run migration:run

# Generate a new migration after entity changes
npm run migration:generate -- name=DescriptionOfChange
```

### 4. Running the Service
```bash
# Development (with watch mode)
npm run start:dev

# Production build and run
npm run build
npm run start:prod
```

---

## 📁 Architectural Overview

The backend is structured into specialized modules to ensure scalability:

- **[`entities/`](src/entities/)**: Data models defining the SQL Server schema.
- **[`controllers/`](src/controllers/)**: API endpoints and request validation.
- **[`services/`](src/services/)**: Core business logic and database interactions.
- **[`storage/`](src/storage/)**: Integration layer for Azure Blob Storage (Document uploads, proofs).
- **[`search/`](src/search/)**: Logic for semantic search using OpenAI embeddings.
- **[`sheets/`](src/sheets/)**: Google Sheets integration for automated reporting.

---

## 🔒 Security
- **MSAL Node**: Secure Microsoft identity integration.
- **Firebase Admin**: Server-side validation of JWT tokens from the frontend.
- **Throttler**: Request rate-limiting to prevent brute force or DDoS.

---
© 2026 Proptii. All Rights Reserved.