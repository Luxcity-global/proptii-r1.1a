# Proptii Static Web Application

## Overview
Proptii is a modern web application built with Vite and hosted on Azure Static Web Apps. This application provides a robust frontend interface with Azure AD B2C authentication and CDN integration for optimal performance.

## 🚀 Quick Start

### Prerequisites
- Node.js (version specified in package.json)
- Azure CLI
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/[organization]/proptii-r1.1a-2.git
cd proptii-r1.1a-2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
npm run dev
```

## 🏗️ Project Structure
```
proptii-r1.1a-2/
├── src/               # Source code
├── public/            # Static assets
├── dist/             # Build output
├── docs/             # Documentation
│   └── development/  # Development guides
├── tests/            # Test files
└── scripts/          # Utility scripts
```

## 🛠️ Development

### Available Scripts
```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Type checking
npm run type-check
```

### Environment Variables
Required environment variables:
- `VITE_API_URL`: Backend API endpoint
- `VITE_AZURE_AD_CLIENT_ID`: Azure AD B2C client ID
- `VITE_AZURE_STORAGE_URL`: Azure Storage account URL

## 🚀 Deployment

### Automated Deployment
The application automatically deploys through GitHub Actions:
- `develop` branch → Development environment
- `staging` branch → Staging environment
- `main` branch → Production environment

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy to Azure Static Web Apps
az staticwebapp deploy --source dist
```

## 🔒 Security

### Authentication
- Azure AD B2C integration
- Role-based access control
- Secure token management

### Environment Security
- Secrets management through Azure Key Vault
- Secure environment variable handling
- HTTPS enforcement

## 📚 Documentation
- [Setup Instructions](docs/development/DevtoProd-290425/03-Dev%20A-%20Steps/05A02-Setup-Instructions.md)
- [Resource Documentation](docs/development/DevtoProd-290425/03-Dev%20A-%20Steps/05A01-Resource-Documentation.md)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps)

## 🔧 Troubleshooting
Common issues and solutions are documented in the [Setup Instructions](docs/development/DevtoProd-290425/03-Dev%20A-%20Steps/05A02-Setup-Instructions.md#troubleshooting-steps).

## 📈 Performance
- CDN integration for static assets
- Optimized build configuration
- Caching strategies implemented

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License
[License information to be added]

## 👥 Support
For support and questions, please contact:
- Technical Lead: [contact]
- DevOps Support: [contact]
- Project Manager: [contact]
