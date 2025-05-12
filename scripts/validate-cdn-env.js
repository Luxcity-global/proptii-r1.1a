import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const REQUIRED_ENV_VARS = {
    'AZURE_SUBSCRIPTION_ID': 'Azure Subscription ID',
    'RESOURCE_GROUP_NAME': 'Azure Resource Group Name',
    'CDN_PROFILE_NAME': 'CDN Profile Name',
    'CDN_ENDPOINT_NAME': 'CDN Endpoint Name'
};

const validateEnvironment = () => {
    console.log(chalk.blue('🔍 Validating CDN configuration environment...'));

    const missingVars = [];
    for (const [varName, description] of Object.entries(REQUIRED_ENV_VARS)) {
        if (!process.env[varName]) {
            missingVars.push({ name: varName, description });
        }
    }

    if (missingVars.length > 0) {
        console.error(chalk.red('❌ Missing required environment variables:'));
        missingVars.forEach(({ name, description }) => {
            console.error(chalk.red(`   - ${name}: ${description}`));
        });
        console.error(chalk.yellow('\nPlease set these variables in your .env file:'));
        missingVars.forEach(({ name }) => {
            console.error(chalk.yellow(`   ${name}=your_value_here`));
        });
        process.exit(1);
    }

    console.log(chalk.green('✅ All required environment variables are set!'));
};

// Run validation
validateEnvironment(); 