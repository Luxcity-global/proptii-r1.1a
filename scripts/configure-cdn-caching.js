import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import chalk from 'chalk';

const CACHE_RULES = {
    staticAssets: {
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
                    cacheDuration: '1.00:00:00' // 1 day
                }
            }
        ]
    },
    fonts: {
        name: 'FontFiles',
        order: 2,
        conditions: [
            {
                name: 'UrlFileExtension',
                parameters: {
                    operator: 'Equal',
                    matchValues: ['.woff', '.woff2']
                }
            }
        ],
        actions: [
            {
                name: 'CacheExpiration',
                parameters: {
                    cacheBehavior: 'Override',
                    cacheType: 'All',
                    cacheDuration: '30.00:00:00' // 30 days
                }
            }
        ]
    },
    mediaFiles: {
        name: 'MediaFiles',
        order: 3,
        conditions: [
            {
                name: 'UrlFileExtension',
                parameters: {
                    operator: 'Equal',
                    matchValues: ['.mp4', '.webm', '.mp3', '.aac', '.ogg']
                }
            }
        ],
        actions: [
            {
                name: 'CacheExpiration',
                parameters: {
                    cacheBehavior: 'Override',
                    cacheType: 'All',
                    cacheDuration: '1.00:00:00' // 1 day
                }
            }
        ]
    },
    dynamicContent: {
        name: 'DynamicContent',
        order: 4,
        conditions: [
            {
                name: 'UrlFileExtension',
                parameters: {
                    operator: 'Equal',
                    matchValues: ['.html', '.json']
                }
            }
        ],
        actions: [
            {
                name: 'CacheExpiration',
                parameters: {
                    cacheBehavior: 'Override',
                    cacheType: 'All',
                    cacheDuration: '00:05:00' // 5 minutes for HTML
                }
            }
        ]
    }
};

const configureCDNCaching = async () => {
    try {
        console.log(chalk.blue('🔧 Configuring CDN caching rules...'));

        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

        const resourceGroupName = process.env.RESOURCE_GROUP_NAME;
        const profileName = process.env.CDN_PROFILE_NAME;
        const endpointName = process.env.CDN_ENDPOINT_NAME;

        // Configure cache key settings
        await cdnClient.endpoints.beginUpdate(
            resourceGroupName,
            profileName,
            endpointName,
            {
                queryStringCachingBehavior: 'IgnoreQueryString',
                deliveryPolicy: {
                    rules: [
                        // Cache key configuration
                        {
                            name: 'CacheKeySettings',
                            order: 0,
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
                                    name: 'ModifyRequestHeader',
                                    parameters: {
                                        headerAction: 'Append',
                                        headerName: 'Vary',
                                        value: 'Accept-Encoding, User-Agent'
                                    }
                                }
                            ]
                        },
                        // Apply all cache rules
                        ...Object.values(CACHE_RULES)
                    ]
                }
            }
        );

        // Configure purge rules
        await cdnClient.endpoints.beginUpdate(
            resourceGroupName,
            profileName,
            endpointName,
            {
                deliveryPolicy: {
                    rules: [
                        {
                            name: 'PurgeRules',
                            order: 5,
                            conditions: [
                                {
                                    name: 'RequestHeader',
                                    parameters: {
                                        headerName: 'X-Purge-Cache',
                                        operator: 'Equal',
                                        matchValues: ['true']
                                    }
                                }
                            ],
                            actions: [
                                {
                                    name: 'CacheExpiration',
                                    parameters: {
                                        cacheBehavior: 'BypassCache',
                                        cacheType: 'All'
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        );

        console.log(chalk.green('✅ CDN caching rules configured successfully!'));
        console.log(chalk.blue('📝 Applied configurations:'));
        console.log(chalk.blue('   - Static assets: 1 day cache'));
        console.log(chalk.blue('   - Font files: 30 days cache'));
        console.log(chalk.blue('   - Media files: 1 day cache'));
        console.log(chalk.blue('   - Dynamic content: 5 minutes cache'));
        console.log(chalk.blue('   - Cache key settings configured'));
        console.log(chalk.blue('   - Purge rules configured'));

    } catch (error) {
        console.error(chalk.red('❌ CDN caching configuration failed:'), error.message);
        process.exit(1);
    }
};

// Run the configuration
configureCDNCaching(); 