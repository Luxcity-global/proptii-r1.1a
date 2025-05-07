import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import chalk from 'chalk';

const configureCDNSSL = async () => {
    try {
        console.log(chalk.blue('🔧 Configuring CDN SSL settings...'));

        const credential = new DefaultAzureCredential();
        const subscriptionId = '93714023-0875-491f-bd2f-dbc0ce275c4c';
        const cdnClient = new CdnManagementClient(credential, subscriptionId);

        const resourceGroupName = 'proptii-rg-eastus2';
        const profileName = 'proptii-cdn-profile';
        const endpointName = 'proptii-cdn-endpoint';

        // Update endpoint with SSL settings
        await cdnClient.endpoints.beginUpdate(
            resourceGroupName,
            profileName,
            endpointName,
            {
                isHttpAllowed: false,
                isHttpsAllowed: true,
                optimizationType: 'GeneralWebDelivery',
                queryStringCachingBehavior: 'IgnoreQueryString',
                contentTypesToCompress: [
                    'application/javascript',
                    'text/javascript',
                    'text/css',
                    'text/html',
                    'application/json',
                    'image/svg+xml'
                ],
                isCompressionEnabled: true,
                origins: [
                    {
                        name: 'static-web-app',
                        hostName: 'black-wave-0bb98540f.6.azurestaticapps.net',
                        httpPort: 80,
                        httpsPort: 443,
                        priority: 1,
                        weight: 1000
                    }
                ],
                deliveryPolicy: {
                    rules: [
                        {
                            name: 'SecurityHeaders',
                            order: 1,
                            conditions: [
                                {
                                    name: 'RequestScheme',
                                    parameters: {
                                        matchValues: ['HTTP', 'HTTPS'],
                                        operator: 'Equal'
                                    }
                                }
                            ],
                            actions: [
                                {
                                    name: 'ModifyResponseHeader',
                                    parameters: {
                                        headerAction: 'Append',
                                        headerName: 'Strict-Transport-Security',
                                        value: 'max-age=31536000; includeSubDomains'
                                    }
                                },
                                {
                                    name: 'ModifyResponseHeader',
                                    parameters: {
                                        headerAction: 'Append',
                                        headerName: 'X-Content-Type-Options',
                                        value: 'nosniff'
                                    }
                                },
                                {
                                    name: 'ModifyResponseHeader',
                                    parameters: {
                                        headerAction: 'Append',
                                        headerName: 'X-Frame-Options',
                                        value: 'DENY'
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        );

        console.log(chalk.green('✅ CDN SSL configuration completed successfully!'));
        console.log(chalk.blue('📝 Applied configurations:'));
        console.log(chalk.blue('   - HTTPS enforced'));
        console.log(chalk.blue('   - Security headers configured'));
        console.log(chalk.blue('   - HSTS enabled'));

    } catch (error) {
        console.error(chalk.red('❌ CDN SSL configuration failed:'), error.message);
        process.exit(1);
    }
};

configureCDNSSL(); 