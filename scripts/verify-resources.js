const axios = require('axios');
const { DefaultAzureCredential } = require('@azure/identity');
const { WebSiteManagementClient } = require('@azure/arm-appservice');
const { ResourceManagementClient } = require('@azure/arm-resources');

async function verifyStaticWebApp() {
    console.log('Verifying Static Web App...');

    try {
        const credential = new DefaultAzureCredential();
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
        const resourceGroup = 'proptii-rg-eastus2';

        // Create Azure clients
        const webClient = new WebSiteManagementClient(credential, subscriptionId);

        // Get Static Web App
        const staticApp = await webClient.staticSites.list();
        console.log('Static Web App Status:', staticApp.length > 0 ? 'Found' : 'Not Found');

        if (staticApp.length > 0) {
            // Check if the app is accessible
            const appUrl = staticApp[0].defaultHostname;
            const response = await axios.get(`https://${appUrl}`);
            console.log('Static Web App Accessibility:', response.status === 200 ? 'Accessible' : 'Not Accessible');
        }
    } catch (error) {
        console.error('Error verifying Static Web App:', error.message);
    }
}

async function verifyNetworkAccess() {
    console.log('\nVerifying Network Access...');

    try {
        const credential = new DefaultAzureCredential();
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

        // Create Azure clients
        const resourceClient = new ResourceManagementClient(credential, subscriptionId);

        // List network security groups
        const nsgList = await resourceClient.resources.list({
            filter: "resourceType eq 'Microsoft.Network/networkSecurityGroups'"
        });

        console.log('Network Security Groups:', nsgList.length > 0 ? 'Found' : 'Not Found');

        // Basic connectivity test to key endpoints
        const endpoints = [
            process.env.VITE_API_URL,
            process.env.VITE_AZURE_STORAGE_URL
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint);
                console.log(`Endpoint ${endpoint}: Accessible`);
            } catch (error) {
                console.log(`Endpoint ${endpoint}: Not Accessible - ${error.message}`);
            }
        }
    } catch (error) {
        console.error('Error verifying network access:', error.message);
    }
}

async function testBasicFunctionality() {
    console.log('\nTesting Basic Functionality...');

    try {
        // Test static content delivery
        const staticContent = await axios.get(`${process.env.VITE_AZURE_STORAGE_URL}/index.html`);
        console.log('Static Content Delivery:', staticContent.status === 200 ? 'Working' : 'Failed');

        // Test API endpoint
        const apiHealth = await axios.get(`${process.env.VITE_API_URL}/health`);
        console.log('API Health Check:', apiHealth.status === 200 ? 'Healthy' : 'Unhealthy');

        // Test authentication endpoint
        const authEndpoint = `${process.env.VITE_API_URL}/auth/status`;
        const authCheck = await axios.get(authEndpoint);
        console.log('Authentication Service:', authCheck.status === 200 ? 'Working' : 'Failed');

    } catch (error) {
        console.error('Error testing basic functionality:', error.message);
    }
}

async function main() {
    console.log('Starting Resource Verification...\n');

    try {
        await verifyStaticWebApp();
        await verifyNetworkAccess();
        await testBasicFunctionality();

        console.log('\n✅ Resource verification completed');
    } catch (error) {
        console.error('\n❌ Resource verification failed:', error.message);
        process.exit(1);
    }
}

main(); 