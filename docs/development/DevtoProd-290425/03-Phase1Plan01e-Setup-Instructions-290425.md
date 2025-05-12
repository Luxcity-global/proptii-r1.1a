# Proptii Static Web App - Setup Instructions

## Local Development Guide

### Prerequisites
1. **Node.js**
   - Required version: [version from package.json]
   - Download from: https://nodejs.org/

2. **Azure CLI**
   ```bash
   # Windows (PowerShell Admin)
   winget install -e --id Microsoft.AzureCLI
   
   # Verify installation
   az --version
   ```

3. **Git**
   ```bash
   # Windows
   winget install -e --id Git.Git
   
   # Verify installation
   git --version
   ```

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/[organization]/proptii-r1.1a-2.git
   cd proptii-r1.1a-2
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env.local`
   - Update the following variables:
     ```
     VITE_API_URL=
     VITE_AZURE_AD_CLIENT_ID=
     VITE_AZURE_STORAGE_URL=
     ```

4. **Local Development Server**
   ```bash
   npm run dev
   ```

## Deployment Procedures

### Manual Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Azure Login**
   ```bash
   az login
   az account set --subscription [subscription-id]
   ```

3. **Deploy to Azure**
   ```bash
   az staticwebapp deploy --source dist
   ```

### Automated Deployment (GitHub Actions)

1. **Push to Main Branch**
   ```bash
   git add .
   git commit -m "your commit message"
   git push origin main
   ```

2. **Monitor Deployment**
   - Navigate to GitHub repository
   - Go to Actions tab
   - Monitor the deployment workflow

### Environment-Specific Deployments

1. **Development**
   - Automatically deployed from `develop` branch
   - URL: [dev-environment-url]

2. **Staging**
   - Deployed from `staging` branch
   - URL: [staging-environment-url]

3. **Production**
   - Deployed from `main` branch
   - URL: [production-environment-url]

## Troubleshooting Steps

### Common Issues and Solutions

1. **Build Failures**
   - Check Node.js version matches project requirements
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: 
     ```bash
     rm -rf node_modules
     npm install
     ```

2. **Deployment Issues**
   - Verify GitHub Actions permissions
   - Check Azure credentials
   - Review deployment logs in GitHub Actions

3. **Runtime Errors**
   - Check browser console for errors
   - Verify environment variables
   - Check Azure Static Web App logs

### Environment Variable Issues

1. **Local Environment**
   - Verify `.env.local` exists
   - Check variable naming (VITE_ prefix)
   - Restart development server

2. **Production Environment**
   - Check Azure Static Web App Configuration
   - Verify secrets in GitHub repository
   - Review environment-specific settings

### Network and API Issues

1. **API Connection Problems**
   - Verify API endpoints
   - Check CORS settings
   - Validate authentication tokens

2. **CDN Issues**
   - Clear browser cache
   - Check CDN endpoint status
   - Verify asset paths

## Performance Optimization

### Development Performance
1. **Vite Dev Server**
   - Enable network access: `npm run dev -- --host`
   - Use production mode locally: `npm run preview`

2. **Build Optimization**
   - Enable build caching
   - Optimize dependencies
   - Use production builds for testing

### Production Performance
1. **Asset Optimization**
   - Enable compression
   - Configure caching headers
   - Use CDN for static assets

## Support and Resources

### Documentation
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps)
- [Vite Documentation](https://vitejs.dev/)
- Internal Project Wiki: [link-to-wiki]

### Getting Help
- Technical Lead: [contact]
- DevOps Support: [contact]
- Azure Support: [contact]

### Useful Commands
```bash
# Health check
npm run verify

# Clean install
npm ci

# Build with type checking
npm run build-check

# Run tests
npm run test

# Check for updates
npm outdated
``` 