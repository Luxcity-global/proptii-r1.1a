import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import chalk from 'chalk';

const configureCDN = async () => {
    try {
        console.log(chalk.blue('🔧 Configuring CDN settings...'));

        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

        const resourceGroupName = process.env.RESOURCE_GROUP_NAME;
        const profileName = process.env.CDN_PROFILE_NAME;
        const endpointName = process.env.CDN_ENDPOINT_NAME;

        // Update endpoint properties
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
                        hostName: 'proptii-cdn-endpoint.azureedge.net',
                        httpPort: 80,
                        httpsPort: 443,
                        priority: 1,
                        weight: 1000
                    }
                ]
            }
        );

        // Configure caching rules
        const cachingRules = [
            {
                name: 'StaticAssets',
                order: 1,
                conditions: [
                    {
                        matchVariable: 'RequestFilename',
                        operator: 'EndsWith',
                        matchValue: ['.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg']
                    }
                ],
                actions: [
                    {
                        name: 'CacheExpiration',
                        parameters: {
                            cacheBehavior: 'Override',
                            cacheType: 'All',
                            cacheDuration: '7.00:00:00' // 7 days
                        }
                    }
                ]
            },
            {
                name: 'HTMLFiles',
                order: 2,
                conditions: [
                    {
                        matchVariable: 'RequestFilename',
                        operator: 'EndsWith',
                        matchValue: ['.html']
                    }
                ],
                actions: [
                    {
                        name: 'CacheExpiration',
                        parameters: {
                            cacheBehavior: 'Override',
                            cacheType: 'All',
                            cacheDuration: '00:05:00' // 5 minutes
                        }
                    }
                ]
            }
        ];

        // Apply caching rules
        for (const rule of cachingRules) {
            await cdnClient.endpoints.beginUpdateRule(
                resourceGroupName,
                profileName,
                endpointName,
                rule.name,
                {
                    order: rule.order,
                    conditions: rule.conditions,
                    actions: rule.actions
                }
            );
        }

        // Configure custom domain HTTPS
        const customDomains = await cdnClient.customDomains.listByEndpoint(
            resourceGroupName,
            profileName,
            endpointName
        );

        for (const domain of customDomains) {
            await cdnClient.customDomains.beginEnableCustomHttps(
                resourceGroupName,
                profileName,
                endpointName,
                domain.name
            );
        }

        // Configure security policies
        await cdnClient.endpoints.beginUpdate(
            resourceGroupName,
            profileName,
            endpointName,
            {
                deliveryPolicy: {
                    description: 'Security Headers Policy',
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

        console.log(chalk.green('✅ CDN configuration completed successfully!'));
        console.log(chalk.blue('📝 Applied configurations:'));
        console.log(chalk.blue('   - Compression enabled for static assets'));
        console.log(chalk.blue('   - Caching rules configured'));
        console.log(chalk.blue('   - HTTPS enforced'));
        console.log(chalk.blue('   - Security headers implemented'));

    } catch (error) {
        console.error(chalk.red('❌ CDN configuration failed:'), error.message);
        process.exit(1);
    }
};

configureCDN(); 