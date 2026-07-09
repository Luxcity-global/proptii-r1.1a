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
    'VITE_API_URL'
];

// Optional environment variables
const optionalEnvVars = [
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

    // Check for index.html
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
        console.error(chalk.red('❌ Expected file not found: index.html'));
        process.exit(1);
    }

    // Check for assets directory
    const assetsPath = path.join(distPath, 'assets');
    if (!fs.existsSync(assetsPath)) {
        console.error(chalk.red('❌ Assets directory not found!'));
        process.exit(1);
    }

    // Check for JS and CSS files in assets
    const assetFiles = fs.readdirSync(assetsPath);
    const hasJsFile = assetFiles.some(file => file.endsWith('.js'));
    const hasCssFile = assetFiles.some(file => file.endsWith('.css'));

    if (!hasJsFile) {
        console.error(chalk.red('❌ No JavaScript file found in assets directory'));
        process.exit(1);
    }

    if (!hasCssFile) {
        console.error(chalk.red('❌ No CSS file found in assets directory'));
        process.exit(1);
    }

    console.log(chalk.green('✓ Build output validation successful'));
}

function validateLandlordBuildOutput() {
    console.log(chalk.blue('Validating landlord build output...'));

    const distPath = path.join(process.cwd(), 'dist');
    const landlordIndex = path.join(distPath, 'landlord', 'index.html');
    const landlordAssets = path.join(distPath, 'landlord', 'assets');

    if (!fs.existsSync(landlordIndex)) {
        console.error(chalk.red('❌ Landlord index not found: dist/landlord/index.html'));
        console.error(chalk.red('   Run: npm run build:landlord'));
        process.exit(1);
    }

    if (!fs.existsSync(landlordAssets)) {
        console.error(chalk.red('❌ Landlord assets directory not found: dist/landlord/assets/'));
        process.exit(1);
    }

    const assetFiles = fs.readdirSync(landlordAssets);
    const hasJsFile = assetFiles.some(file => file.endsWith('.js'));
    const hasCssFile = assetFiles.some(file => file.endsWith('.css'));

    if (!hasJsFile || !hasCssFile) {
        console.error(chalk.red('❌ Landlord build missing JS or CSS in dist/landlord/assets/'));
        process.exit(1);
    }

    const indexHtml = fs.readFileSync(landlordIndex, 'utf8');
    const referencedAssets = [...indexHtml.matchAll(/\/landlord\/assets\/([^"'\s>]+)/g)].map(m => m[1]);
    const missing = referencedAssets.filter(name => !fs.existsSync(path.join(landlordAssets, name)));

    if (missing.length > 0) {
        console.error(chalk.red('❌ Landlord index.html references missing assets:'));
        missing.forEach(name => console.error(chalk.red(`   - ${name}`)));
        process.exit(1);
    }

    const cssFile = assetFiles.find(file => file.endsWith('.css'));
    const cssContent = fs.readFileSync(path.join(landlordAssets, cssFile), 'utf8');
    if (cssContent.includes('@tailwind base') || cssContent.includes('@tailwind utilities')) {
        console.error(chalk.red('❌ Landlord CSS was not processed by PostCSS/Tailwind'));
        console.error(chalk.red('   Found unprocessed @tailwind directives in dist/landlord/assets/' + cssFile));
        process.exit(1);
    }
    if (!cssContent.includes('768px')) {
        console.error(chalk.red('❌ Landlord CSS is missing responsive (md:) utilities'));
        process.exit(1);
    }

    console.log(chalk.green('✓ Landlord build output validation successful'));
}

function validateEnvironmentVariables() {
    console.log(chalk.blue('Validating environment variables...'));

    // Check required variables
    const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingRequired.length > 0) {
        console.error(chalk.red('❌ Missing required environment variables:'));
        missingRequired.forEach(varName => {
            console.error(chalk.red(`   - ${varName}`));
        });
        process.exit(1);
    }

    // Check optional variables
    const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);
    if (missingOptional.length > 0) {
        console.log(chalk.yellow('⚠️  Missing optional environment variables:'));
        missingOptional.forEach(varName => {
            console.log(chalk.yellow(`   - ${varName}`));
        });
    }

    console.log(chalk.green('✓ Environment variables validation successful'));
}

function main() {
    console.log(chalk.yellow('Starting build validation...\n'));

    try {
        validateBuildOutput();
        validateLandlordBuildOutput();
        validateEnvironmentVariables();

        console.log(chalk.green('\n✨ All validations passed successfully!'));
        process.exit(0);
    } catch (error) {
        console.error(chalk.red('\n❌ Validation failed:'), error);
        process.exit(1);
    }
}

main(); 