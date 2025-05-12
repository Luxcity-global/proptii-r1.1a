import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const configureCDN = async () => {
    try {
        console.log(chalk.blue('🔧 Configuring CDN settings...'));

        // Debug: Log environment variables
        console.log(chalk.yellow('\nEnvironment Variables:'));
        console.log(chalk.yellow(`Subscription ID: ${process.env.AZURE_SUBSCRIPTION_ID}`));
        console.log(chalk.yellow(`Resource Group: ${process.env.RESOURCE_GROUP_NAME}`));
        console.log(chalk.yellow(`CDN Profile: ${process.env.CDN_PROFILE_NAME}`));
        console.log(chalk.yellow(`CDN Endpoint: ${process.env.CDN_ENDPOINT_NAME}\n`));

        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID, {
            apiVersion: '2020-09-01'
        });

        const resourceGroupName = process.env.RESOURCE_GROUP_NAME;
        const profileName = process.env.CDN_PROFILE_NAME;
        const endpointName = process.env.CDN_ENDPOINT_NAME;

        // Debug: Log configuration attempt
        console.log(chalk.blue('\nAttempting to configure CDN with:'));
        console.log(chalk.blue(`Resource Group: ${resourceGroupName}`));
        console.log(chalk.blue(`Profile Name: ${profileName}`));
        console.log(chalk.blue(`Endpoint Name: ${endpointName}\n`));

        // Update endpoint properties
        const endpoint = await cdnClient.endpoints.beginUpdateAndWait(
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
                        hostName: 'proptii-cdn-endpoint.azureedge.net',
                        httpPort: 80,
                        httpsPort: 443,
                        priority: 1,
                        weight: 1000
                    }
                ],
                deliveryPolicy: {
                    description: 'Caching Rules',
                    rules: [
                        {
                            name: 'StaticAssets1',
                            order: 1,
                            conditions: [
                                {
                                    name: 'UrlPath',
                                    parameters: {
                                        operator: 'EndsWith',
                                        matchValues: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico'],
                                        transforms: ['Lowercase']
                                    }
                                }
                            ],
                            actions: [
                                {
                                    name: 'CacheExpiration',
                                    parameters: {
                                        cacheBehavior: 'Override',
                                        cacheType: 'All',
                                        cacheDuration: '7.00:00:00'
                                    }
                                }
                            ]
                        },
                        {
                            name: 'StaticAssets2',
                            order: 2,
                            conditions: [
                                {
                                    name: 'UrlPath',
                                    parameters: {
                                        operator: 'EndsWith',
                                        matchValues: ['.css', '.js', '.woff', '.woff2', '.ttf', '.eot'],
                                        transforms: ['Lowercase']
                                    }
                                }
                            ],
                            actions: [
                                {
                                    name: 'CacheExpiration',
                                    parameters: {
                                        cacheBehavior: 'Override',
                                        cacheType: 'All',
                                        cacheDuration: '7.00:00:00'
                                    }
                                }
                            ]
                        },
                        {
                            name: 'HTMLFiles',
                            order: 3,
                            conditions: [
                                {
                                    name: 'UrlPath',
                                    parameters: {
                                        operator: 'EndsWith',
                                        matchValues: ['.html'],
                                        transforms: ['Lowercase']
                                    }
                                }
                            ],
                            actions: [
                                {
                                    name: 'CacheExpiration',
                                    parameters: {
                                        cacheBehavior: 'Override',
                                        cacheType: 'All',
                                        cacheDuration: '00:05:00'
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        );

        console.log(chalk.green('✅ CDN endpoint and caching rules configured successfully!'));

    } catch (error) {
        console.error(chalk.red('❌ CDN configuration failed:'), error.message);
        if (error.response) {
            console.error(chalk.red('Response data:'), error.response.data);
            console.error(chalk.red('Response status:'), error.response.status);
        }
        process.exit(1);
    }
};

// Run the configuration
configureCDN(); 