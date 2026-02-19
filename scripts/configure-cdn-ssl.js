import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

const CUSTOM_DOMAIN = 'proptii.co';

async function configureCDNSSL() {
    console.log(chalk.blue('🔧 Configuring CDN SSL settings...'));

    try {
        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

        console.log(chalk.yellow('\nEnvironment Variables:'));
        console.log(`Subscription ID: ${process.env.AZURE_SUBSCRIPTION_ID}`);
        console.log(`Resource Group: ${process.env.RESOURCE_GROUP_NAME}`);
        console.log(`CDN Profile: ${process.env.CDN_PROFILE_NAME}`);
        console.log(`CDN Endpoint: ${process.env.CDN_ENDPOINT_NAME}\n`);

        // Get the CDN endpoint details
        const endpoint = await cdnClient.endpoints.get(
            process.env.RESOURCE_GROUP_NAME,
            process.env.CDN_PROFILE_NAME,
            process.env.CDN_ENDPOINT_NAME
        );

        console.log(chalk.yellow('CDN Endpoint Details:'));
        console.log(`Hostname: ${endpoint.hostName}`);
        console.log(`Origin: ${endpoint.originHostHeader}`);
        console.log(`HTTPS Enabled: ${endpoint.isHttpsAllowed}\n`);

        console.log(chalk.yellow('Next Steps for Domain Configuration:'));
        console.log('1. Add the following CNAME record to your DNS settings:');
        console.log(`   Name: ${CUSTOM_DOMAIN}`);
        console.log(`   Value: ${endpoint.hostName}`);
        console.log('\n2. Wait for DNS propagation (can take up to 48 hours)');
        console.log('3. Verify domain ownership in Azure Portal');
        console.log('4. Run the verification script after DNS propagation');

        // Update endpoint to enforce HTTPS
        console.log(chalk.yellow('\nUpdating endpoint to enforce HTTPS...'));
        await cdnClient.endpoints.beginUpdateAndWait(
            process.env.RESOURCE_GROUP_NAME,
            process.env.CDN_PROFILE_NAME,
            process.env.CDN_ENDPOINT_NAME,
            {
                isHttpAllowed: false,
                isHttpsAllowed: true,
                optimizationType: 'GeneralWebDelivery'
            }
        );
        console.log(chalk.green('✓ HTTPS enforcement configured successfully'));

        console.log(chalk.green('\n✅ CDN SSL configuration completed successfully!'));
        console.log(chalk.yellow('\nAfter DNS propagation, run:'));
        console.log('npm run configure:cdn-ssl-verify');

    } catch (error) {
        console.error(chalk.red('\n❌ CDN SSL configuration failed:'));
        console.error(error.message);
        process.exit(1);
    }
}

// Run the configuration
configureCDNSSL(); 