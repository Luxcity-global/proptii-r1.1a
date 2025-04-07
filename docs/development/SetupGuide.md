# Proptii Development Environment Setup Guide

This guide provides instructions for setting up the development environment for the Proptii application.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18.x or later)
- **npm** (v9.x or later)
- **Git** (v2.x or later)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-organization/proptii.git
cd proptii
```

### 2. Install Dependencies

```bash
npm ci
```

> Note: We use `npm ci` instead of `npm install` to ensure consistent installations based on the package-lock.json file.

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_AZURE_API_KEY=your_azure_api_key
VITE_AZURE_AD_TENANT_ID=your_azure_ad_tenant_id
VITE_AZURE_AD_CLIENT_ID=your_azure_ad_client_id
VITE_AZURE_AD_TENANT_NAME=your_azure_ad_tenant_name
```

> Note: Contact the project administrator to obtain the actual values for these environment variables.

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:5173 (or another port if 5173 is already in use).

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for feature development
- `feature/feature-name` - Feature branches for active development

Always create a new branch from `develop` when working on a new feature:

```bash
git checkout develop
git pull
git checkout -b feature/your-feature-name
```

### Code Style and Linting

The project uses ESLint and Prettier for code style and linting. To check your code:

```bash
# Run ESLint
npm run lint

# Run Prettier
npm run format
```

### Building for Production

To create a production build:

```bash
npm run build
```

The build output will be in the `dist` directory.

### Testing

To run tests:

```bash
npm test
```

## Troubleshooting

### Common Issues

1. **Port already in use**

   If port 5173 is already in use, Vite will automatically try another port. You'll see a message like:

   ```
   Port 5173 is in use, trying another one...
   ```

2. **API Key Issues**

   If you see errors related to the Azure API, ensure your environment variables are correctly set in the `.env` file.

3. **Authentication Issues**

   If you encounter authentication issues, ensure that the Azure B2C configuration is correct in `src/config/authConfig.ts`.

### Getting Help

If you encounter any issues not covered in this guide, please:

1. Check the project documentation in the `docs` directory
2. Reach out to the project team on the designated communication channel

## Additional Resources

- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Azure B2C Documentation](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)
- [Azure OpenAI Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/) 