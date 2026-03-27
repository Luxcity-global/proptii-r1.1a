# Proptii Azure Functions API

A specialized serverless API built with **Azure Functions** to handle high-performance backend tasks.

## 🛠️ Technology Stack
- **Runtime**: Node.js 20
- **Framework**: [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- **Language**: TypeScript

---

## 🚀 Purpose
While the main NestJS backend handles core business logic, this API provides:
- **Fast Endpoints**: Optimized serverless functions for map data and search results.
- **Auto-scaling**: Designed to handle bursts of traffic during property launches.
- **Cloud Integration**: Native binding to Azure Cosmos DB and Storage.

---

## 📁 Repository Structure
- **[`src/`](src/)**: Function definitions and logic.
- **`host.json`**: Global configuration for Azure Functions.
- **`local.settings.json`**: Local environment variables (do not commit).
- **`package.json`**: Dependencies and deployment scripts.

---
© 2026 Proptii. All Rights Reserved.
