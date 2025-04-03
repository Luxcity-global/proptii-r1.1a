# Proptii

Proptii is a property management and referencing application that helps users find properties, apply for tenancy, and complete the referencing process.

## Features

- **Property Search**: Search for properties using natural language queries
- **Referencing Process**: Complete the referencing process online
- **Open Banking Integration**: Connect to open banking services for financial verification
- **User Authentication**: Secure authentication using Azure B2C

## Getting Started

### Prerequisites

- Node.js (v18.x or later)
- npm (v9.x or later)
- Git (v2.x or later)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-organization/proptii.git
cd proptii
```

2. Set up the development environment:

```bash
# Option 1: Using the setup script (recommended)
./scripts/setup-dev.sh

# Option 2: Manual setup
npm ci
```

3. Create a `.env` file in the root directory with the following variables:

```
VITE_AZURE_API_KEY=your_azure_api_key
VITE_AZURE_AD_TENANT_ID=your_azure_ad_tenant_id
VITE_AZURE_AD_CLIENT_ID=your_azure_ad_client_id
VITE_AZURE_AD_TENANT_NAME=your_azure_ad_tenant_name
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173 (or another port if 5173 is already in use).

## Development

### Project Structure

See [Project Structure](./docs/development/ProjectStructure.md) for a detailed overview of the codebase.

### Coding Standards

See [Coding Standards](./docs/development/CodingStandards.md) for the coding standards and best practices.

### Testing

See [Testing Strategy](./docs/development/TestingStrategy.md) for the testing strategy and guidelines.

### API Documentation

See [API Simulation](./docs/api-simulation/README.md) for documentation on the API simulation functions.

## Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run lint`: Run ESLint to check for code style issues
- `npm run format`: Run Prettier to format code
- `npm test`: Run tests

## Documentation

Comprehensive documentation is available in the `docs` directory:

- [Development Documentation](./docs/development/README.md)
- [API Simulation Documentation](./docs/api-simulation/README.md)
- [Component Documentation](./docs/components/README.md)
- [Authentication Documentation](./docs/auth/README.md)

## Contributing

1. Create a new branch from `develop`:

```bash
git checkout develop
git pull
git checkout -b feature/your-feature-name
```

2. Make your changes following the coding standards

3. Test your changes

4. Submit a pull request to the `develop` branch

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.