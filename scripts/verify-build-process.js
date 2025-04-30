const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { DefaultAzureCredential } = require('@azure/identity');
const { WebSiteManagementClient } = require('@azure/arm-appservice');

async function verifyBuildOutputs() {
    console.log(chalk.blue('Verifying Build Outputs...'));

    const distPath = path.join(process.cwd(), 'dist');

    try {
        // Check if dist directory exists
        if (!fs.existsSync(distPath)) {
            throw new Error('Build output directory (dist) not found');
        }

        // Define expected build artifacts
        const expectedFiles = [
            'index.html',
            'assets',
            'vite.svg'
        ];

        // Check for critical build artifacts
        const missingFiles = expectedFiles.filter(file =>
            !fs.existsSync(path.join(distPath, file))
        );

        if (missingFiles.length > 0) {
            console.log(chalk.red('\nMissing build artifacts:'));
            missingFiles.forEach(file => {
                console.log(chalk.red(`- ${file}`));
            });
        } else {
            console.log(chalk.green('\n✓ All required build artifacts present'));
        }

        // Check bundle sizes
        console.log(chalk.gray('\nBundle Sizes:'));
        const assets = fs.readdirSync(path.join(distPath, 'assets'));
        assets.forEach(asset => {
            const stats = fs.statSync(path.join(distPath, 'assets', asset));
            const size = (stats.size / 1024 / 1024).toFixed(2);
            const sizeColor = size > 2 ? 'yellow' : 'green';
            console.log(chalk.white(`- ${asset}: ${chalk[sizeColor](size + ' MB')}`));
        });

    } catch (error) {
        console.error(chalk.red('\nError verifying build outputs:'), error.message);
        throw error;
    }
}

async function checkEnvironmentConfigs() {
    console.log(chalk.blue('\nChecking Environment Configurations...'));

    try {
        // Check environment files
        const envFiles = [
            '.env',
            '.env.development',
            '.env.production',
            '.env.staging'
        ];

        console.log(chalk.gray('\nEnvironment Files:'));
        envFiles.forEach(file => {
            const exists = fs.existsSync(path.join(process.cwd(), file));
            console.log(chalk.white(`- ${file}: ${exists ? chalk.green('Present') : chalk.red('Missing')}`));
        });

        // Check required environment variables
        const requiredVars = [
            'VITE_API_URL',
            'VITE_AZURE_AD_CLIENT_ID',
            'VITE_AZURE_STORAGE_URL'
        ];

        console.log(chalk.gray('\nRequired Environment Variables:'));
        requiredVars.forEach(variable => {
            const exists = process.env[variable] !== undefined;
            console.log(chalk.white(`- ${variable}: ${exists ? chalk.green('Set') : chalk.red('Not Set')}`));
        });

        // Verify vite.config.ts
        const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
        if (fs.existsSync(viteConfigPath)) {
            console.log(chalk.green('\n✓ vite.config.ts present'));
        } else {
            console.log(chalk.red('\n✗ vite.config.ts missing'));
        }

    } catch (error) {
        console.error(chalk.red('\nError checking environment configs:'), error.message);
        throw error;
    }
}

async function testDeploymentSlots() {
    console.log(chalk.blue('\nTesting Deployment Slots...'));

    try {
        const credential = new DefaultAzureCredential();
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
        const resourceGroup = 'proptii-rg-eastus2';

        const webClient = new WebSiteManagementClient(credential, subscriptionId);

        // Get Static Web App
        const staticApps = await webClient.staticSites.list();

        if (staticApps.length === 0) {
            throw new Error('No Static Web Apps found');
        }

        console.log(chalk.gray('\nDeployment Slots:'));

        for (const app of staticApps) {
            // Get deployment environments
            const environments = await webClient.staticSites.listStaticSiteBuilds(
                resourceGroup,
                app.name
            );

            environments.forEach(env => {
                const status = env.status === 'Ready' ? chalk.green(env.status) : chalk.yellow(env.status);
                console.log(chalk.white(`- ${env.name}: ${status}`));
                console.log(chalk.gray(`  Branch: ${env.sourceBranch}`));
                console.log(chalk.gray(`  Last Updated: ${new Date(env.lastUpdatedOn).toLocaleString()}`));
            });
        }

    } catch (error) {
        console.error(chalk.red('\nError testing deployment slots:'), error.message);
        throw error;
    }
}

async function main() {
    console.log(chalk.yellow('Starting Build Process Verification...\n'));

    try {
        await verifyBuildOutputs();
        await checkEnvironmentConfigs();
        await testDeploymentSlots();

        console.log(chalk.green('\n✅ Build process verification completed'));
    } catch (error) {
        console.error(chalk.red('\n❌ Build process verification failed'));
        process.exit(1);
    }
}

main(); 