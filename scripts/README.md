# Proptii DevOps & Utility Scripts

Essential scripts to manage Azure infrastructure, optimize assets, and automate builds.

## 🛠️ Infrastructure Management
These scripts interface directly with the Azure CLI to manage cloud resources:
- **`configure-cdn.js`**: Sets up custom domains and SSL for Azure CDN.
- **`configure-cdn-ssl.js`**: Automates SSL certificate binding and verification.
- **`configure-waf.js`**: Provisions and configures Web Application Firewall rules for resource security.
- **`monitor-cdn-health.js`**: Provides continuous health monitoring for performance and uptime.
- **`cdn:purge`**: Purges CDN edge locations for instant asset updates.

---

## 🏗️ Build & Environment Validation
Scripts to ensure stability before deployments:
- **`validate-staging-env.js`**: Checks for required environment variables and staging slot connectivity.
- **`validate-production-env.js`**: Pre-flight checks for production-specific dependencies.
- **`verify-github-integration.js`**: Validates safe communication between local repos and GitHub Actions.
- **`validate-feature-flags.js`**: Ensures consistent feature states across frontend and backend.
- **`monitor-web-vitals.js`**: Automated Lighthouse-style performance score evaluations.

---

## 🖼️ Media & Asset Optimization
Scripts to reduce bundle size and improve page load metrics:
- **`optimize-images.js`**: Lossless compression and WebP conversion for all project image assets.
- **`optimize-fonts.js`**: Subset fonts and generate modern WOFF2 variants.
- **`optimize-videos.js`**: Compresses property walkthrough videos for mobile-friendly streaming.
- **`optimize-audio.js`**: Optimizes background audio or notification sounds.

---

## 🧪 Testing & Diagnostics
- **`integration-test.js`**: Orchestrates end-to-end tests across frontend and backend.
- **`load-test.js`**: Stress tests API endpoints before high-traffic events.
- **`edge-test.js`**: Validates CDN routing and edge-case behavior.

---

## 📁 Usage Examples
Individual scripts can be run directly using Node or through the root `package.json`:
```bash
# Optimize production images
npm run optimize:images

# Check CDN health
npm run monitor:cdn

# Run full staging validation
npm run verify:staging
```

---
© 2026 Proptii. All Rights Reserved.
