import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const REQUIRED_VARS = [
    'VITE_API_URL',
    'VITE_AZURE_AD_CLIENT_ID',
    'VITE_AZURE_STORAGE_URL'
];

const validateStagingEnv = () => {
    try {
        console.log(chalk.blue('🔍 Validating staging environment configuration...'));

        // Check if .env.staging exists
        const envPath = join(process.cwd(), '.env.staging');
        let envContent;
        try {
            envContent = readFileSync(envPath, 'utf8');
        } catch (error) {
            console.error(chalk.red('❌ .env.staging file not found!'));
            process.exit(1);
        }

        // Parse environment variables
        const envVars = envContent
            .split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .reduce((acc, line) => {
                const [key, value] = line.split('=');
                acc[key.trim()] = value?.trim();
                return acc;
            }, {});

        // Validate required variables
        const missingVars = REQUIRED_VARS.filter(varName => !envVars[varName]);
        if (missingVars.length > 0) {
            console.error(chalk.red('❌ Missing required environment variables:'));
            missingVars.forEach(varName => {
                console.error(chalk.red(`   - ${varName}`));
            });
            process.exit(1);
        }

        // Validate URL formats
        const urlVars = ['VITE_API_URL', 'VITE_AZURE_STORAGE_URL'];
        urlVars.forEach(varName => {
            try {
                new URL(envVars[varName]);
            } catch (error) {
                console.error(chalk.red(`❌ Invalid URL format for ${varName}: ${envVars[varName]}`));
                process.exit(1);
            }
        });

        // Validate Azure AD Client ID format
        const clientIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!clientIdRegex.test(envVars.VITE_AZURE_AD_CLIENT_ID)) {
            console.error(chalk.red('❌ Invalid Azure AD Client ID format'));
            process.exit(1);
        }

        console.log(chalk.green('✅ Staging environment configuration is valid!'));
        console.log(chalk.blue('📝 Validated variables:'));
        REQUIRED_VARS.forEach(varName => {
            console.log(chalk.blue(`   - ${varName}: ${envVars[varName].substring(0, 3)}...${envVars[varName].slice(-3)}`));
        });

    } catch (error) {
        console.error(chalk.red('❌ Validation failed:'), error.message);
        process.exit(1);
    }
};

validateStagingEnv(); 