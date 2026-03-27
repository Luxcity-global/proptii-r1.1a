# Proptii Firebase Functions

Serverless background logic and event-driven automation for the Proptii ecosystem.

## 🛠️ Technology Stack
- **Runtime**: [Node.js 20](https://nodejs.org/)
- **Language**: TypeScript (Strict Mode)
- **Framework**: [Firebase Functions v2 SDK](https://firebase.google.com/docs/functions)
- **Authentication**: Firebase Admin SDK

---

## 🚀 Purpose
Cloud functions handle tasks that shouldn't block the frontend UI or require constant server presence:
- **Database Triggers**: Automated cleanup or synchronization when Firestore documents change.
- **Scheduled Tasks**: Nightly reports, automated arrears calculations, and data pruning.
- **Third-party Integrations**: Webhook handlers for payment providers or document signing services (e.g., DocuSign).
- **Onboarding Hooks**: Sending welcome emails via the Backend SMTP service.

---

## 🛠️ Development & Deployment

### 1. Prerequisites
- [Firebase CLI](https://firebase.google.com/docs/cli) installed (`npm install -g firebase-tools`).
- Authenticated via `firebase login`.

### 2. Local Setup
```bash
cd functions
npm install
```

### 3. Running Emulators
Test functions locally with the Firebase Emulator Suite:
```bash
# From root directory
firebase emulators:start
```

### 4. Deployment
Deploy specific functions or the entire module:
```bash
# All functions
firebase deploy --only functions

# Specific function
firebase deploy --only functions:onUserCreated
```

---

## 📁 Key Files
- **`src/index.ts`**: Entry point where all functions are exported.
- **`src/triggers/`**: Logic for Firestore/Auth event handlers.
- **`src/jobs/`**: Scheduled (cron) job logic.
- **`src/services/`**: Shared communication logic with the [proptii-backend](../proptii-backend/).

---
© 2026 Proptii. All Rights Reserved.
