# API Simulation Documentation

This directory contains documentation related to the API simulation functions used in the Proptii application.

## Files

- **[ApiSimulationFunctions.md](./ApiSimulationFunctions.md)**: Detailed documentation of all API simulation functions in the application, including their purpose, implementation, expected behavior, and future implementation plans.

- **[ApiSummary.md](./ApiSummary.md)**: A high-level overview of all API functions in the application, categorized by their current implementation status and future plans.

## Purpose

The purpose of this documentation is to:

1. **Document Current Implementation**: Provide a clear understanding of how API calls are currently implemented in the application.

2. **Plan Future Implementation**: Outline the expected API endpoints and functionality that will replace the current simulation functions.

3. **Guide Development**: Serve as a reference for developers working on implementing the real API endpoints.

## API Implementation Strategy

The Proptii application currently uses a mix of real API calls (to Azure B2C and Azure OpenAI) and simulated API calls for features that will be implemented in the future. The strategy for implementing the real API endpoints is as follows:

1. **Phase 1**: Implement the core API endpoints for the referencing process, including saving application data and uploading documents.

2. **Phase 2**: Implement the open banking integration and enhance the property search functionality.

3. **Phase 3**: Implement analytics and caching mechanisms for improved performance and user experience.

## Contributing

When adding new API simulation functions to the application, please update the documentation in this directory to reflect the changes. This includes:

1. Adding the function to the appropriate file in this directory.
2. Documenting the purpose, implementation, expected behavior, and future implementation plans.
3. Updating the API summary document if necessary.

## Related Documentation

- [Component Documentation](../components/README.md): Documentation for the components that use these API functions.
- [Authentication Documentation](../auth/README.md): Documentation for the authentication system used in the application. 