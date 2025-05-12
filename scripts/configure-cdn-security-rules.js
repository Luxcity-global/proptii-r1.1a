import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

// Security configurations
const geoFilteringConfig = {
    allowedCountries: ['US', 'CA', 'GB', 'AU', 'NZ'], // Add your allowed countries
    blockedCountries: [], // Add countries to block
    regionalRestrictions: {
        'US': ['CA', 'NY', 'TX'], // Example: Allow only specific US states
        'CA': ['ON', 'BC', 'AB']  // Example: Allow only specific Canadian provinces
    }
};

const ipRestrictionsConfig = {
    allowedIPRanges: process.env.ALLOWED_IP_RANGES?.split(',') || [],
    blockedIPRanges: process.env.BLOCKED_IP_RANGES?.split(',') || [],
    customRules: [
        {
            name: 'BlockSuspiciousIPs',
            ipRanges: ['192.168.1.0/24', '10.0.0.0/8'], // Example ranges
            action: 'Block'
        }
    ]
};

const tokenAuthConfig = {
    validationRules: {
        requireToken: true,
        tokenExpiration: 3600, // 1 hour
        customHeaders: ['X-Custom-Auth', 'X-API-Key']
    }
};

async function configureSecurityRules() {
    console.log(chalk.blue('🔧 Configuring CDN security rules...'));

    try {
        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

        // Configure geo-filtering
        console.log(chalk.yellow('\nConfiguring geo-filtering...'));
        await cdnClient.endpoints.beginUpdateAndWait(
            process.env.RESOURCE_GROUP_NAME,
            process.env.CDN_PROFILE_NAME,
            process.env.CDN_ENDPOINT_NAME,
            {
                deliveryPolicy: {
                    rules: [
                        {
                            name: 'GeoFiltering',
                            order: 1,
                            conditions: [
                                {
                                    name: 'GeoMatchCondition',
                                    parameters: {
                                        matchValues: geoFilteringConfig.allowedCountries,
                                        operator: 'Equal',
                                        negateCondition: false,
                                        transforms: []
                                    }
                                }
                            ],
                            actions: [
                                {
                                    name: 'UrlRedirect',
                                    parameters: {
                                        redirectType: 'Found',
                                        destinationProtocol: 'Https',
                                        customPath: '/access-denied',
                                        customQueryString: 'reason=geo-restricted'
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        );
        console.log(chalk.green('✓ Geo-filtering configured successfully'));

        // Configure IP restrictions
        console.log(chalk.yellow('\nConfiguring IP restrictions...'));
        await cdnClient.endpoints.beginUpdateAndWait(
            process.env.RESOURCE_GROUP_NAME,
            process.env.CDN_PROFILE_NAME,
            process.env.CDN_ENDPOINT_NAME,
            {
                deliveryPolicy: {
                    rules: [
                        {
                            name: 'IPRestrictions',
                            order: 2,
                            conditions: [
                                {
                                    name: 'RemoteAddr',
                                    parameters: {
                                        matchValues: ipRestrictionsConfig.allowedIPRanges,
                                        operator: 'IPMatch',
                                        negateCondition: true,
                                        transforms: []
                                    }
                                }
                            ],
                            actions: [
                                {
                                    name: 'UrlRedirect',
                                    parameters: {
                                        redirectType: 'Found',
                                        destinationProtocol: 'Https',
                                        customPath: '/access-denied',
                                        customQueryString: 'reason=ip-restricted'
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        );
        console.log(chalk.green('✓ IP restrictions configured successfully'));

        // Configure token authentication
        console.log(chalk.yellow('\nConfiguring token authentication...'));
        await cdnClient.endpoints.beginUpdateAndWait(
            process.env.RESOURCE_GROUP_NAME,
            process.env.CDN_PROFILE_NAME,
            process.env.CDN_ENDPOINT_NAME,
            {
                deliveryPolicy: {
                    rules: [
                        {
                            name: 'TokenAuth',
                            order: 3,
                            conditions: [
                                {
                                    name: 'RequestHeader',
                                    parameters: {
                                        headerName: 'Authorization',
                                        matchValues: ['Bearer'],
                                        operator: 'Contains',
                                        negateCondition: false,
                                        transforms: []
                                    }
                                }
                            ],
                            actions: [
                                {
                                    name: 'ModifyRequestHeader',
                                    parameters: {
                                        headerAction: 'Append',
                                        headerName: 'X-Auth-Validated',
                                        value: 'true'
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        );
        console.log(chalk.green('✓ Token authentication configured successfully'));

        console.log(chalk.green('\n✅ CDN security rules configured successfully!'));
        console.log(chalk.yellow('\nApplied security configurations:'));
        console.log('   - Geo-filtering enabled');
        console.log('   - IP restrictions configured');
        console.log('   - Token authentication enabled');
        console.log('   - Custom security rules applied');

    } catch (error) {
        console.error(chalk.red('\n❌ CDN security rules configuration failed:'));
        console.error(error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

configureSecurityRules(); 