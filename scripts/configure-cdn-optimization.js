const { DefaultAzureCredential } = require('@azure/identity');
const { CdnManagementClient } = require('@azure/arm-cdn');
const dotenv = require('dotenv');
const chalk = require('chalk');

dotenv.config();

// Environment variables validation
const requiredEnvVars = [
    'AZURE_SUBSCRIPTION_ID',
    'RESOURCE_GROUP_NAME',
    'CDN_PROFILE_NAME',
    'CDN_ENDPOINT_NAME'
];

// Optimization configurations
const compressionConfig = {
    contentTypesToCompress: [
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'application/x-javascript',
        'application/javascript',
        'application/json',
        'application/xml',
        'image/svg+xml',
        'application/font-woff',
        'application/font-woff2'
    ],
    isCompressionEnabled: true,
    compressionType: 'Gzip'
};

const minificationConfig = {
    isMinificationEnabled: true,
    contentTypesToMinify: {
        html: true,
        css: true,
        javascript: true
    }
};

const imageOptimizationConfig = {
    isImageOptimizationEnabled: true,
    optimizationFormats: ['webp', 'jpeg'],
    qualityLevel: 85
};

async function configureOptimizationRules() {
    console.log(chalk.blue('Starting CDN optimization rules configuration...'));

    try {
        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

        // Configure compression
        console.log(chalk.yellow('Configuring compression rules...'));
        const endpoint = await cdnClient.endpoints.beginUpdateAndWait(
            process.env.RESOURCE_GROUP_NAME,
            process.env.CDN_PROFILE_NAME,
            process.env.CDN_ENDPOINT_NAME,
            {
                isCompressionEnabled: compressionConfig.isCompressionEnabled,
                contentTypesToCompress: compressionConfig.contentTypesToCompress,
                isHttpAllowed: true,
                isHttpsAllowed: true,
                optimizationType: 'GeneralWebDelivery'
            }
        );
        console.log(chalk.green('✓ Compression rules configured successfully'));

        // Configure minification
        console.log(chalk.yellow('Configuring minification rules...'));
        await cdnClient.endpoints.beginUpdateAndWait(
            process.env.RESOURCE_GROUP_NAME,
            process.env.CDN_PROFILE_NAME,
            process.env.CDN_ENDPOINT_NAME,
            {
                optimizationSettings: {
                    minifyHtml: minificationConfig.contentTypesToMinify.html,
                    minifyCss: minificationConfig.contentTypesToMinify.css,
                    minifyJs: minificationConfig.contentTypesToMinify.javascript
                }
            }
        );
        console.log(chalk.green('✓ Minification rules configured successfully'));

        // Configure image optimization
        console.log(chalk.yellow('Configuring image optimization rules...'));
        await cdnClient.endpoints.beginUpdateAndWait(
            process.env.RESOURCE_GROUP_NAME,
            process.env.CDN_PROFILE_NAME,
            process.env.CDN_ENDPOINT_NAME,
            {
                imageOptimizationSettings: {
                    isEnabled: imageOptimizationConfig.isImageOptimizationEnabled,
                    formats: imageOptimizationConfig.optimizationFormats,
                    quality: imageOptimizationConfig.qualityLevel
                }
            }
        );
        console.log(chalk.green('✓ Image optimization rules configured successfully'));

        console.log(chalk.green('\nCDN optimization rules configured successfully! ✨'));
    } catch (error) {
        console.error(chalk.red('Error configuring CDN optimization rules:'));
        console.error(error.message);
        process.exit(1);
    }
}

configureOptimizationRules(); 