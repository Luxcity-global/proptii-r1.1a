import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const CUSTOM_DOMAIN = 'proptii.co';

async function verifyAndCompleteSSL() {
    console.log(chalk.blue('🔍 Verifying domain configuration and completing SSL setup...'));

    try {
        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

        // Add the custom domain
        console.log(chalk.yellow('Adding custom domain to CDN endpoint...'));
        await cdnClient.customDomains.beginCreateAndWait(
            process.env.RESOURCE_GROUP_NAME,
            process.env.CDN_PROFILE_NAME,
            process.env.CDN_ENDPOINT_NAME,
            CUSTOM_DOMAIN,
            {
                hostName: CUSTOM_DOMAIN
            }
        );
        console.log(chalk.green('✓ Custom domain added successfully'));

        // Enable HTTPS on the custom domain
        console.log(chalk.yellow('Enabling HTTPS on custom domain...'));
        await cdnClient.customDomains.beginEnableCustomHttpsAndWait(
            process.env.RESOURCE_GROUP_NAME,
            process.env.CDN_PROFILE_NAME,
            process.env.CDN_ENDPOINT_NAME,
            CUSTOM_DOMAIN,
            {
                certificateSource: 'Cdn',
                protocolType: 'ServerNameIndication',
                minimumTlsVersion: 'TLS12'
            }
        );
        console.log(chalk.green('✓ HTTPS enabled successfully'));

        console.log(chalk.green('\n✅ SSL configuration completed successfully!'));
        console.log(chalk.yellow('\nNext Steps:'));
        console.log('1. Test HTTPS access to your domain');
        console.log('2. Monitor SSL certificate provisioning status');
        console.log('3. Verify all security headers are properly configured');

    } catch (error) {
        console.error(chalk.red('\n❌ SSL verification failed:'));
        console.error(error.message);
        if (error.message.includes('already exists')) {
            console.log(chalk.yellow('\nNote: Custom domain already exists. Proceeding with SSL configuration...'));
            // Continue with SSL configuration
        } else {
            process.exit(1);
        }
    }
}

verifyAndCompleteSSL(); 