# Proptii Core Backend Service

The Proptii Backend is a high-performance, modular **NestJS** application serving as the central API gateway and business logic engine for the entire ecosystem.

## 🛠️ Core Technology Stack
- **Framework**: [NestJS](https://nestjs.com/) (Express-based)
- **Database**: [Firebase Firestore](https://firebase.google.com/products/firestore) & [Azure Cosmos DB](https://azure.microsoft.com/en-us/products/cosmos-db/)
- **AI Engine**: [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service/) for semantic property discovery.
- **Cloud Storage**: [Azure Blob Storage](https://azure.microsoft.com/en-us/products/storage/blobs/) (Current) & [Firebase Storage](https://firebase.google.com/products/storage) (Migration Target).
- **Authentication**: MSAL (Azure AD B2C) & Firebase Admin SDK.

---

## 🚀 Quick Start (Backend Only)

### 1. Installation
Ensure you have Node.js 20+ installed.
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file based on the keys required in `src/config/`. Essential variables:
- `COSMOS_DB_CONNECTION_STRING`, `COSMOS_DB_KEY`: Cosmos DB credentials.
- `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`: AI search credentials.
- `MSAL_CLIENT_ID`, `MSAL_AUTHORITY`: Authentication configuration.

### 3. Running the Service
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

- **[`models/`](src/models/)**: Data models for Firestore and Cosmos DB.
- **[`controllers/`](src/controllers/)**: API endpoints and request validation.
- **[`services/`](src/services/)**: Core business logic and database interactions.
- **[`storage/`](src/storage/)**: Integration layer for document and media storage.
- **[`search/`](src/search/)**: Logic for semantic search using OpenAI embeddings.
- **[`sheets/`](src/sheets/)**: Google Sheets integration for automated reporting.

---

## 🔒 Security
- **MSAL Node**: Secure Microsoft identity integration for Azure AD B2C.
- **Firebase Admin**: Server-side validation of JWT tokens and Firestore access.
- **Throttler**: Request rate-limiting to prevent brute force or DDoS.

---
© 2026 Proptii. All Rights Reserved.