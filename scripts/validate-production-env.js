import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import axios from 'axios';

const REQUIRED_VARS = [
    'VITE_API_URL',
    'VITE_AZURE_AD_CLIENT_ID',
    'VITE_AZURE_STORAGE_URL',
    'VITE_AZURE_CDN_ENDPOINT',
    'VITE_AZURE_APP_INSIGHTS_KEY',
    'VITE_ENABLE_CSP',
    'VITE_ENABLE_HSTS'
];

const SECURITY_VARS = [
    'VITE_ENABLE_CSP',
    'VITE_ENABLE_HSTS',
    'VITE_ENABLE_CORS'
];

const validateProductionEnv = async () => {
    try {
        console.log(chalk.blue('🔍 Validating production environment configuration...'));

        // Check if .env.production exists
        const envPath = join(process.cwd(), '.env.production');
        let envContent;
        try {
            envContent = readFileSync(envPath, 'utf8');
        } catch (error) {
            console.error(chalk.red('❌ .env.production file not found!'));
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
        const urlVars = ['VITE_API_URL', 'VITE_AZURE_STORAGE_URL', 'VITE_AZURE_CDN_ENDPOINT'];
        for (const varName of urlVars) {
            try {
                const url = new URL(envVars[varName]);
                if (varName === 'VITE_API_URL' && !url.protocol.startsWith('https')) {
                    console.error(chalk.red(`❌ Production API URL must use HTTPS: ${envVars[varName]}`));
                    process.exit(1);
                }
            } catch (error) {
                console.error(chalk.red(`❌ Invalid URL format for ${varName}: ${envVars[varName]}`));
                process.exit(1);
            }
        }

        // Validate Azure AD Client ID format
        const clientIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!clientIdRegex.test(envVars.VITE_AZURE_AD_CLIENT_ID)) {
            console.error(chalk.red('❌ Invalid Azure AD Client ID format'));
            process.exit(1);
        }

        // Validate security settings
        const securityIssues = SECURITY_VARS.filter(varName => envVars[varName] !== 'true');
        if (securityIssues.length > 0) {
            console.error(chalk.red('❌ Required security features are not enabled:'));
            securityIssues.forEach(varName => {
                console.error(chalk.red(`   - ${varName} must be set to true in production`));
            });
            process.exit(1);
        }

        // Validate environment identifier
        if (envVars.VITE_ENVIRONMENT !== 'production') {
            console.error(chalk.red('❌ VITE_ENVIRONMENT must be set to "production"'));
            process.exit(1);
        }

        // Validate feature flags
        if (envVars.VITE_ENABLE_DEBUG_LOGGING === 'true') {
            console.error(chalk.red('❌ Debug logging should be disabled in production'));
            process.exit(1);
        }

        // Validate Application Insights key format
        const appInsightsKeyRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!appInsightsKeyRegex.test(envVars.VITE_AZURE_APP_INSIGHTS_KEY)) {
            console.error(chalk.red('❌ Invalid Application Insights key format'));
            process.exit(1);
        }

        // Validate endpoints accessibility
        try {
            await Promise.all([
                axios.head(envVars.VITE_API_URL),
                axios.head(envVars.VITE_AZURE_STORAGE_URL),
                axios.head(envVars.VITE_AZURE_CDN_ENDPOINT)
            ]);
        } catch (error) {
            console.error(chalk.red('❌ One or more endpoints are not accessible'));
            process.exit(1);
        }

        console.log(chalk.green('✅ Production environment configuration is valid!'));
        console.log(chalk.blue('📝 Validated variables:'));
        REQUIRED_VARS.forEach(varName => {
            const value = envVars[varName];
            const maskedValue = value ? `${value.substring(0, 3)}...${value.slice(-3)}` : 'not set';
            console.log(chalk.blue(`   - ${varName}: ${maskedValue}`));
        });

    } catch (error) {
        console.error(chalk.red('❌ Validation failed:'), error.message);
        process.exit(1);
    }
};

validateProductionEnv(); 