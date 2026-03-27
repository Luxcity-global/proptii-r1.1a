# Proptii Enterprise Property Management System

Proptii is a multi-layered, enterprise-grade property management ecosystem designed for landlords, organizations, and tenants. It leverages a modern cloud-native stack across Azure and Firebase to provide high-performance search, secure document management, and automated landlord workflows.

## 🏗️ System Architecture

The repository is organized into several specialized sub-projects:

- **Root (Frontend/Website)**: [Vite + React] The main public-facing platform and tenant interface.
- **[proptii-backend/](proptii-backend/)**: [NestJS] The core API services, handling business logic, database (TypeORM/SQL), and cloud integrations.
- **[landlord_agent/](landlord_agent/)**: [Vite + React] A dedicated, high-performance dashboard specifically for landlords.
- **[functions/](functions/)**: [Firebase Cloud Functions] Serverless background tasks and event-driven logic.
- **[search/](search/)**: Specialized search micro-service for high-speed property discovery.
- **[scripts/](scripts/)**: Comprehensive DevOps and automation suite (CDN, WAF, Security).

---

## 🚀 Getting Started (Combined Setup)

To run the full Proptii stack locally, follow these steps:

### 1. Prerequisites
- **Node.js**: v20.11.1 (LTS) - *Required for project consistency*
- **Azure CLI**: For authentication and cloud resource management.
- **Firebase CLI**: For local emulators and function management.
- **Git**: For version control.

### 2. Initial Installation
Install dependencies for all core components:
```bash
# Root Frontend
npm install

# Core Backend
cd proptii-backend && npm install

# Landlord Dashboard
cd ../landlord_agent && npm install
```

### 3. Environment Configuration
Each component requires its own environment file. Templates are provided:

- **Root**: Copy `env.local.template` to `.env.local`
- **Backend**: Copy `proptii-backend/.env.example` to `proptii-backend/.env`
- **Landlord Agent**: Copy `landlord_agent/.env.local.template` to `landlord_agent/.env.local`

> [!IMPORTANT]
> Ensure `VITE_API_URL` in the frontend configs matches your local backend address (default: `http://localhost:3000`).

### 4. Running the App
The root project provides a convenient script to launch both the frontend and backend simultaneously:

```bash
# From root directory
npm run start:dev
```

To run components individually:
- **Backend Only**: `npm run start:backend`
- **Frontend Only**: `npm run start:frontend`
- **Landlord Dashboard**: `cd landlord_agent && npm run dev`

---

## 📁 Repository Map

| Directory | Purpose | Tech Stack |
|-----------|---------|------------|
| [`src/`](src/) | Root Frontend Source | React, Vite, MUI |
| [`proptii-backend/`](proptii-backend/) | Primary API Layer | NestJS, TypeORM, SQL |
| [`landlord_agent/`](landlord_agent/) | Landlord Workflows | React, Vite, Lucide |
| [`functions/`](functions/) | Background Jobs | Firebase Functions, TS |
| [`scripts/`](scripts/) | Infrastructure & DevOps | Node.js, Shell |
| [`server/`](server/) | Legacy/Auxiliary Proxy | Express |
| [`docs/`](docs/) | Integration Guides | Markdown |

---

## 🛠️ DevOps & Deployment

### Manual Deployment
Proptii uses **Azure Static Web Apps** for frontend hosting and **GitHub Actions** for CI/CD.

```bash
# Build production bundle
npm run build:production

# Manual deploy to Azure (requires login)
npm run deploy:production
```

### CDN & Security
The system includes advanced CDN management via the `scripts/` directory:
- **Purge Cache**: `npm run cdn:purge`
- **Verify CDN**: `npm run verify:cdn`
- **Configure WAF**: `npm run configure:waf`

---

## 📈 Monitoring & Health
- **Performance**: Real-time Web Vitals monitoring via `performance-monitor.ts`.
- **Diagnostics**: Detailed bundle analysis available at `landlord_agent/build/bundle-analysis.html` after build.
- **Staging Monitor**: `npm run monitor:staging` for continuous integration checks.

## 🤝 Contributing & Support
Please refer to the [Internal Documentation](docs/) for architectural decision records (ADRs) and API specifications.

---
© 2026 Proptii. All Rights Reserved.

