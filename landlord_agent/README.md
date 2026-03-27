# Proptii Landlord Agent Dashboard

A high-performance, specialized React dashboard for landlords to manage properties, tenants, arrears, and lease documentation.

## 🛠️ Technology Stack
- **Framework**: [Vite](https://vitejs.dev/) + [React 18](https://reactjs.org/)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 4.0
- **Icons**: Lucide React
- **Authentication**: Azure MSAL (@azure/msal-react)
- **Monitoring**: Built-in Native Performance Monitoring

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Copy `.env.local.template` to `.env.local` and fill in:
- `VITE_API_URL`: Path to the NestJS backend.
- `VITE_AZURE_CLIENT_ID`: MSAL application ID.
- `VITE_AZURE_TENANT_ID`: Azure AD B2C tenant ID.

### 3. Development
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
```
The build process includes:
- **Terser Optimization**: For minification.
- **Visualizer**: Generates a bundle analysis report at `build/bundle-analysis.html`.

---

## 📈 Performance & Health
This dashboard includes a custom [Performance Monitor](src/utils/performance-monitor.ts) that tracks:
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **TTFB** (Time to First Byte)

Metrics are logged to the console and can be persisted for analytics.

---

## 🚢 Deployment Automation
Automated scripts are located in the [`scripts/`](scripts/) directory:
- **[`swap-slots.sh`](scripts/swap-slots.sh)**: Automates Azure App Service deployment slot swaps (Staging ↔ Production).

Refer to [RECOVERY_PROCEDURES.md](docs/RECOVERY_PROCEDURES.md) for handling failed builds or deployment rollbacks.

---
© 2026 Proptii. All Rights Reserved.