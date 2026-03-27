# Proptii Auxiliary Backend Server

A lightweight **Express**-based server that complements the main [NestJS Backend](../proptii-backend/). 

## 🛠️ Purpose
This component serves as an auxiliary service for specialized tasks:
- **Proxy Services**: Relaying requests to third-party endpoints to avoid CORS issues on the frontend.
- **Identity Proxy**: Managing complex Azure AD MSAL-node workflows before hand-off to the main API.
- **Legacy Support**: Handling specific routes required by older integrations.

---

## 🚀 Quick Start

### 1. Installation
```bash
cd server
npm install
```

### 2. Running Locally
```bash
# Standard start
npm start

# Development (auto-reload)
npm run dev
```

### 3. Service Account Setup
The server requires a `service-account.json` file for secure communication with cloud identity providers. Ensure this is never committed to version control.

---

## 📁 Repository Structure
- **[`routes/`](routes/)**: API endpoint definitions (REST/Express style).
- **[`services/`](services/)**: Logic modules for data proxying and auth verification.
- **`index.js`**: Main entry point for the Express app.
- **`index.mjs`**: Modern ESM variant used for specific cloud deployment targets.

---
© 2026 Proptii. All Rights Reserved.
