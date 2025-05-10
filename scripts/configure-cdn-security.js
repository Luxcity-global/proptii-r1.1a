import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const configureCDNSecurity = async () => {
    try {
        console.log(chalk.blue('🔧 Configuring CDN security settings...'));

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
        console.log(chalk.blue('\nAttempting to configure CDN security with:'));
        console.log(chalk.blue(`Resource Group: ${resourceGroupName}`));
        console.log(chalk.blue(`Profile Name: ${profileName}`));
        console.log(chalk.blue(`Endpoint Name: ${endpointName}\n`));

        // Update endpoint properties with security settings
        await cdnClient.endpoints.beginUpdateAndWait(
            resourceGroupName,
            profileName,
            endpointName,
            {
                isHttpAllowed: false,
                isHttpsAllowed: true,
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
                                        operator: 'Equal',
                                        transforms: []
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
                                },
                                {
                                    name: 'ModifyResponseHeader',
                                    parameters: {
                                        headerAction: 'Append',
                                        headerName: 'Content-Security-Policy',
                                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.azure.com https://*.microsoftonline.com"
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
                }
            }
        );

        console.log(chalk.green('✅ CDN security configuration completed successfully!'));
        console.log(chalk.blue('📝 Applied security configurations:'));
        console.log(chalk.blue('   - HTTPS enforced'));
        console.log(chalk.blue('   - HSTS enabled'));
        console.log(chalk.blue('   - X-Content-Type-Options: nosniff'));
        console.log(chalk.blue('   - X-Frame-Options: DENY'));
        console.log(chalk.blue('   - Content-Security-Policy configured'));
        console.log(chalk.blue('   - Referrer-Policy: strict-origin-when-cross-origin'));

    } catch (error) {
        console.error(chalk.red('❌ CDN security configuration failed:'), error.message);
        if (error.response) {
            console.error(chalk.red('Response data:'), error.response.data);
            console.error(chalk.red('Response status:'), error.response.status);
        }
        process.exit(1);
    }
};

// Run the configuration
configureCDNSecurity(); 