import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const requiredEnvVars = [
    'AZURE_SUBSCRIPTION_ID',
    'RESOURCE_GROUP_NAME',
    'CDN_PROFILE_NAME',
    'CDN_ENDPOINT_NAME',
    'VITE_AZURE_STORAGE_URL',
    'STATIC_WEB_APP_RESOURCE_ID'
];

const validateEnvironment = () => {
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error(chalk.red('❌ Missing required environment variables:'));
        missingVars.forEach(varName => {
            console.error(chalk.yellow(`   - ${varName}`));
        });
        console.error(chalk.blue('\nPlease set these variables in your .env file or environment.'));
        process.exit(1);
    }
};

const configureCDNEndpoint = async () => {
    try {
        console.log(chalk.blue('🔧 Configuring CDN endpoint with health monitoring...'));

        // Validate environment variables
        validateEnvironment();

        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

        const resourceGroupName = process.env.RESOURCE_GROUP_NAME;
        const profileName = process.env.CDN_PROFILE_NAME;
        const endpointName = process.env.CDN_ENDPOINT_NAME;

        // Configure endpoint with health monitoring
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
                    'image/svg+xml',
                    'application/xml',
                    'text/plain'
                ],
                isCompressionEnabled: true,
                origins: [
                    {
                        name: 'static-web-app',
                        hostName: process.env.VITE_AZURE_STORAGE_URL.replace('https://', ''),
                        httpPort: 80,
                        httpsPort: 443,
                        priority: 1,
                        weight: 1000,
                        enabled: true,
                        privateLinkApprovalMessage: 'Please approve the private link request for CDN endpoint',
                        privateLinkLocation: 'eastus2',
                        privateLinkResourceId: process.env.STATIC_WEB_APP_RESOURCE_ID
                    }
                ],
                deliveryPolicy: {
                    description: 'Performance and Security Policy',
                    rules: [
                        {
                            name: 'StaticAssets',
                            order: 1,
                            conditions: [
                                {
                                    name: 'UrlFileExtension',
                                    parameters: {
                                        operator: 'Equal',
                                        matchValues: ['.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.woff', '.woff2']
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
                        },
                        {
                            name: 'SecurityHeaders',
                            order: 3,
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
                                        value: 'max-age=31536000; includeSubDomains; preload'
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
                                },
                                {
                                    name: 'ModifyResponseHeader',
                                    parameters: {
                                        headerAction: 'Append',
                                        headerName: 'X-XSS-Protection',
                                        value: '1; mode=block'
                                    }
                                },
                                {
                                    name: 'ModifyResponseHeader',
                                    parameters: {
                                        headerAction: 'Append',
                                        headerName: 'Referrer-Policy',
                                        value: 'strict-origin-when-cross-origin'
                                    }
                                }
                            ]
                        }
                    ]
                },
                healthProbeSettings: {
                    probePath: '/health',
                    probeRequestType: 'GET',
                    probeIntervalInSeconds: 30,
                    probeProtocol: 'Https',
                    probeEnabled: true
                },
                enabled: true,
                enabledState: 'Enabled'
            }
        );

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
                domain.name,
                {
                    certificateSource: 'Cdn',
                    protocolType: 'ServerNameIndication',
                    minimumTlsVersion: 'TLS12'
                }
            );
        }

        console.log(chalk.green('✅ CDN endpoint configuration completed successfully!'));
        console.log(chalk.blue('📝 Applied configurations:'));
        console.log(chalk.blue('   - Health monitoring enabled'));
        console.log(chalk.blue('   - Compression optimized'));
        console.log(chalk.blue('   - Caching rules configured'));
        console.log(chalk.blue('   - Security headers implemented'));
        console.log(chalk.blue('   - Custom domain HTTPS enabled'));

    } catch (error) {
        console.error(chalk.red('❌ CDN endpoint configuration failed:'), error.message);
        if (error.code === 'InvalidAuthenticationTokenTenant') {
            console.error(chalk.yellow('\nAuthentication error. Please ensure you are logged in to Azure CLI:'));
            console.error(chalk.blue('   Run: az login'));
        }
        process.exit(1);
    }
};

configureCDNEndpoint(); 