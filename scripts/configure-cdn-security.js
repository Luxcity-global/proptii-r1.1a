import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import chalk from 'chalk';

const configureCDNSecurity = async () => {
    try {
        console.log(chalk.blue('🔧 Configuring CDN security settings...'));

        const credential = new DefaultAzureCredential();
        const subscriptionId = '93714023-0875-491f-bd2f-dbc0ce275c4c';
        const cdnClient = new CdnManagementClient(credential, subscriptionId);

        const resourceGroupName = 'proptii-rg-eastus2';
        const profileName = 'proptii-cdn-profile';
        const endpointName = 'proptii-cdn-endpoint';

        // Update endpoint properties with security settings and caching rules
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
                            name: 'StaticAssets',
                            order: 1,
                            conditions: [
                                {
                                    name: 'UrlFileExtension',
                                    parameters: {
                                        operator: 'Equal',
                                        matchValues: ['.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg']
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
                            order: 2,
                            conditions: [
                                {
                                    name: 'UrlFileExtension',
                                    parameters: {
                                        operator: 'Equal',
                                        matchValues: ['.html']
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

        console.log(chalk.green('✅ CDN security configuration completed successfully!'));
        console.log(chalk.blue('📝 Applied configurations:'));
        console.log(chalk.blue('   - HTTPS enforced'));
        console.log(chalk.blue('   - Compression enabled'));
        console.log(chalk.blue('   - Caching rules configured'));

    } catch (error) {
        console.error(chalk.red('❌ CDN security configuration failed:'), error.message);
        process.exit(1);
    }
};

configureCDNSecurity(); 