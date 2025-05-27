import { app } from '@azure/functions';
import { type HttpRequest } from '@azure/functions';

app.http('authTest', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request: HttpRequest, context) => {
        try {
            // Get B2C configuration from environment
            const b2cConfig = {
                tenantName: process.env.AzureAD_B2C_TenantName,
                clientId: process.env.AzureAD_B2C_ClientId,
                signUpSignInPolicy: process.env.AzureAD_B2C_SignUpPolicy
            };

            return {
                status: 200,
                jsonBody: {
                    message: 'B2C Configuration Test',
                    status: 'Configuration loaded successfully',
                    config: {
                        tenantName: b2cConfig.tenantName,
                        clientId: b2cConfig.clientId,
                        signUpSignInPolicy: b2cConfig.signUpSignInPolicy
                    }
                }
            };
        } catch (err) {
            const error = err as Error;
            context.log('Error in auth test function:', error.message);
            return {
                status: 500,
                jsonBody: {
                    message: 'Error testing B2C configuration',
                    error: error.message
                }
            };
        }
    }
}); 