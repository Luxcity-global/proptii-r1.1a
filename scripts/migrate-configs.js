import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { glob } from 'glob';
import crypto from 'crypto';

const CONFIG_DIR = 'src/config';
const STATIC_DATA_DIR = 'src/data';
const ASSET_REGISTRY_DIR = 'src/registry';

// Environment config structure
const envConfigStructure = {
    development: {
        api: {
            baseUrl: 'http://localhost:3002',
            version: 'v1'
        },
        azure: {
            ad: {
                clientId: '',
                tenantName: 'proptii.onmicrosoft.com',
                policyName: 'B2C_1_SignUpandSignInProptii'
            },
            storage: {
                url: 'http://localhost:5173'
            }
        },
        features: {
            debugLogging: true,
            detailedErrors: true,
            betaFeatures: true,
            performanceMonitoring: false,
            errorReporting: false,
            maintenanceMode: false,
            securityHeaders: false,
            caching: false
        }
    },
    staging: {
        api: {
            baseUrl: 'https://api-staging.proptii.com',
            version: 'v1'
        },
        azure: {
            ad: {
                clientId: '',
                tenantName: 'proptii.onmicrosoft.com',
                policyName: 'B2C_1_SignUpandSignInProptii'
            },
            storage: {
                url: 'https://proptii-staging.azurestaticapps.net'
            }
        },
        features: {
            debugLogging: true,
            detailedErrors: false,
            betaFeatures: true,
            performanceMonitoring: true,
            errorReporting: true,
            maintenanceMode: false,
            securityHeaders: true,
            caching: true
        }
    },
    production: {
        api: {
            baseUrl: 'https://api.proptii.com',
            version: 'v1'
        },
        azure: {
            ad: {
                clientId: '',
                tenantName: 'proptii.onmicrosoft.com',
                policyName: 'B2C_1_SignUpandSignInProptii'
            },
            storage: {
                url: 'https://proptii.azurestaticapps.net'
            }
        },
        features: {
            debugLogging: false,
            detailedErrors: false,
            betaFeatures: false,
            performanceMonitoring: true,
            errorReporting: true,
            maintenanceMode: false,
            securityHeaders: true,
            caching: true
        }
    }
};

// Static data structure
const staticDataStructure = {
    mimeTypes: {
        '.json': 'text/json',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mp3': 'audio/mpeg',
        '.aac': 'audio/aac',
        '.ogg': 'audio/ogg'
    },
    securityHeaders: {
        'Content-Security-Policy': "default-src 'self' https: 'unsafe-eval' 'unsafe-inline' blob: data:; object-src 'none'",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    },
    cacheRules: {
        static: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true
        },
        dynamic: {
            maxAge: 3600, // 1 hour
            includeSubDomains: false
        }
    }
};

// Asset registry structure
const assetRegistryStructure = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    assets: {
        images: [],
        fonts: [],
        videos: [],
        audio: []
    },
    metadata: {
        totalSize: 0,
        totalFiles: 0,
        lastOptimized: null
    }
};

const createDirectory = async (dir) => {
    try {
        await fs.mkdir(dir, { recursive: true });
        console.log(chalk.green(`✅ Created directory: ${dir}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error creating directory ${dir}:`), error.message);
    }
};

const generateEnvConfig = async (env) => {
    const config = envConfigStructure[env];
    const envFile = path.join(CONFIG_DIR, `${env}.config.ts`);

    const content = `/**
 * ${env.charAt(0).toUpperCase() + env.slice(1)} Environment Configuration
 * Generated on: ${new Date().toISOString()}
 */

export const ${env}Config = ${JSON.stringify(config, null, 2)} as const;

export type ${env.charAt(0).toUpperCase() + env.slice(1)}Config = typeof ${env}Config;
`;

    try {
        await fs.writeFile(envFile, content);
        console.log(chalk.green(`✅ Generated ${env} config`));
    } catch (error) {
        console.error(chalk.red(`❌ Error generating ${env} config:`), error.message);
    }
};

const generateStaticData = async () => {
    const staticDataFile = path.join(STATIC_DATA_DIR, 'static.config.ts');

    const content = `/**
 * Static Data Configuration
 * Generated on: ${new Date().toISOString()}
 */

export const staticConfig = ${JSON.stringify(staticDataStructure, null, 2)} as const;

export type StaticConfig = typeof staticConfig;
`;

    try {
        await fs.writeFile(staticDataFile, content);
        console.log(chalk.green('✅ Generated static data config'));
    } catch (error) {
        console.error(chalk.red('❌ Error generating static data config:'), error.message);
    }
};

const generateAssetRegistry = async () => {
    const registryFile = path.join(ASSET_REGISTRY_DIR, 'asset-registry.ts');

    const content = `/**
 * Asset Registry
 * Generated on: ${new Date().toISOString()}
 */

export const assetRegistry = ${JSON.stringify(assetRegistryStructure, null, 2)} as const;

export type AssetRegistry = typeof assetRegistry;

// Utility functions for asset management
export const getAssetInfo = (path: string) => {
    // Implementation to be added
};

export const updateAssetMetadata = (path: string, metadata: Partial<AssetRegistry['metadata']>) => {
    // Implementation to be added
};

export const validateAsset = (path: string) => {
    // Implementation to be added
};
`;

    try {
        await fs.writeFile(registryFile, content);
        console.log(chalk.green('✅ Generated asset registry'));
    } catch (error) {
        console.error(chalk.red('❌ Error generating asset registry:'), error.message);
    }
};

const encryptSensitiveData = async (data, key) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
        iv: iv.toString('hex'),
        encrypted,
        authTag: authTag.toString('hex')
    };
};

const main = async () => {
    try {
        console.log(chalk.blue('🔍 Starting configuration files migration...'));

        // Create necessary directories
        await createDirectory(CONFIG_DIR);
        await createDirectory(STATIC_DATA_DIR);
        await createDirectory(ASSET_REGISTRY_DIR);

        // Generate environment configs
        for (const env of ['development', 'staging', 'production']) {
            await generateEnvConfig(env);
        }

        // Generate static data config
        await generateStaticData();

        // Generate asset registry
        await generateAssetRegistry();

        console.log(chalk.green('\n✅ Configuration files migration completed successfully!'));
    } catch (error) {
        console.error(chalk.red('❌ Configuration files migration failed:'), error.message);
        process.exit(1);
    }
};

main(); 