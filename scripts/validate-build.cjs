const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Expected build output files
const expectedFiles = [
    'index.html',
    'assets/index-*.js',
    'assets/index-*.css'
];

// Required environment variables
const requiredEnvVars = [
    'VITE_API_URL',
    'VITE_AZURE_AD_CLIENT_ID',
    'VITE_AZURE_STORAGE_URL'
];

function validateBuildOutput() {
    console.log(chalk.blue('Validating build output...'));

    const distPath = path.join(process.cwd(), 'dist');

    // Check if dist directory exists
    if (!fs.existsSync(distPath)) {
        console.error(chalk.red('❌ Build directory (dist) not found!'));
        process.exit(1);
    }

    // Validate expected files
    const files = fs.readdirSync(distPath, { recursive: true });
    const filesFlat = files.map(file => file.toString());

    for (const pattern of expectedFiles) {
        const found = filesFlat.some(file =>
            pattern.includes('*')
                ? new RegExp(pattern.replace('*', '.*')).test(file)
                : file === pattern
        );

        if (!found) {
            console.error(chalk.red(`❌ Expected file not found: ${pattern}`));
            process.exit(1);
        }
    }

    const mainJsFile = fs.readdirSync(distPath).find(file => file.startsWith('index-') && file.endsWith('.js'));
    if (!mainJsFile) {
        console.error('❌ Expected file not found: index-*.js');
        process.exit(1);
    }

    console.log(chalk.green('✓ Build output validation successful'));
}

function validateEnvironmentVariables() {
    console.log(chalk.blue('Validating environment variables...'));

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error(chalk.red('❌ Missing required environment variables:'));
        missingVars.forEach(varName => {
            console.error(chalk.red(`   - ${varName}`));
        });
        process.exit(1);
    }

    console.log(chalk.green('✓ Environment variables validation successful'));
}

function main() {
    console.log(chalk.yellow('Starting build validation...\n'));

    try {
        validateBuildOutput();
        validateEnvironmentVariables();

        console.log(chalk.green('\n✨ All validations passed successfully!'));
        process.exit(0);
    } catch (error) {
        console.error(chalk.red('\n❌ Validation failed:'), error);
        process.exit(1);
    }
}

main(); 