require('dotenv').config();
import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import { BlobServiceClient } from '@azure/storage-blob';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';

const ASSET_TYPES = {
    images: {
        path: 'public/images',
        extensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
        cacheDuration: '7.00:00:00'
    },
    fonts: {
        path: 'public/fonts',
        extensions: ['.woff', '.woff2'],
        cacheDuration: '30.00:00:00'
    },
    videos: {
        path: 'public/videos',
        extensions: ['.mp4', '.webm'],
        cacheDuration: '1.00:00:00'
    },
    audio: {
        path: 'public/audio',
        extensions: ['.mp3', '.aac', '.ogg'],
        cacheDuration: '1.00:00:00'
    }
};

const EDGE_LOCATIONS = [
    { name: 'US East', location: 'eastus' },
    { name: 'US West', location: 'westus' },
    { name: 'Europe', location: 'westeurope' },
    { name: 'Asia Pacific', location: 'southeastasia' }
];

const configureCDNAssets = async () => {
    try {
        console.log(chalk.blue('🔧 Configuring CDN asset distribution...'));

        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);
        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

        const resourceGroupName = process.env.RESOURCE_GROUP_NAME;
        const profileName = process.env.CDN_PROFILE_NAME;
        const endpointName = process.env.CDN_ENDPOINT_NAME;
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

        // 1. Configure asset distribution
        console.log(chalk.blue('\n📦 Configuring asset distribution...'));

        // Create container if it doesn't exist
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists();

        // Upload and configure assets
        for (const [type, config] of Object.entries(ASSET_TYPES)) {
            console.log(chalk.blue(`\n📁 Processing ${type}...`));

            // Find all files of this type
            const files = await glob(`${config.path}/**/*{${config.extensions.join(',')}}`);

            // Upload files to blob storage
            for (const file of files) {
                const blobName = path.relative(config.path, file);
                const blobClient = containerClient.getBlockBlobClient(blobName);

                const fileContent = await fs.readFile(file);
                await blobClient.upload(fileContent, fileContent.length, {
                    blobHTTPHeaders: {
                        blobContentType: getContentType(path.extname(file)),
                        blobCacheControl: `public, max-age=${config.cacheDuration}`
                    }
                });

                console.log(chalk.green(`✅ Uploaded: ${blobName}`));
            }

            // Configure CDN rules for this asset type
            await cdnClient.endpoints.beginUpdate(
                resourceGroupName,
                profileName,
                endpointName,
                {
                    deliveryPolicy: {
                        rules: [
                            {
                                name: `${type}Cache`,
                                order: 1,
                                conditions: [
                                    {
                                        name: 'UrlFileExtension',
                                        parameters: {
                                            operator: 'Equal',
                                            matchValues: config.extensions
                                        }
                                    }
                                ],
                                actions: [
                                    {
                                        name: 'CacheExpiration',
                                        parameters: {
                                            cacheBehavior: 'Override',
                                            cacheType: 'All',
                                            cacheDuration: config.cacheDuration
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }
            );
        }

        // 2. Configure performance optimization
        console.log(chalk.blue('\n⚡ Configuring performance optimization...'));

        // Configure edge locations
        for (const location of EDGE_LOCATIONS) {
            await cdnClient.endpoints.beginUpdate(
                resourceGroupName,
                profileName,
                endpointName,
                {
                    location: location.location,
                    optimizationType: 'GeneralWebDelivery',
                    queryStringCachingBehavior: 'IgnoreQueryString',
                    contentTypesToCompress: [
                        'application/javascript',
                        'text/javascript',
                        'text/css',
                        'text/html',
                        'application/json',
                        'image/svg+xml',
                        'application/xml',
                        'text/plain'
                    ],
                    isCompressionEnabled: true
                }
            );
            console.log(chalk.green(`✅ Configured edge location: ${location.name}`));
        }

        // Configure route optimization
        await cdnClient.endpoints.beginUpdate(
            resourceGroupName,
            profileName,
            endpointName,
            {
                deliveryPolicy: {
                    rules: [
                        {
                            name: 'RouteOptimization',
                            order: 1,
                            conditions: [
                                {
                                    name: 'RequestScheme',
                                    parameters: {
                                        matchValues: ['HTTP', 'HTTPS'],
                                        operator: 'Equal'
                                    }
                                }
                            ],
                            actions: [
                                {
                                    name: 'UrlRewrite',
                                    parameters: {
                                        sourcePattern: '/(.*)',
                                        destination: '/$1',
                                        preserveUnmatchedPath: true
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        );
        console.log(chalk.green('✅ Configured route optimization'));

        console.log(chalk.green('\n✅ CDN asset distribution and performance optimization completed successfully!'));
    } catch (error) {
        console.error(chalk.red('❌ CDN asset configuration failed:'), error.message);
        process.exit(1);
    }
};

const getContentType = (extension) => {
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mp3': 'audio/mpeg',
        '.aac': 'audio/aac',
        '.ogg': 'audio/ogg'
    };
    return mimeTypes[extension] || 'application/octet-stream';
};

configureCDNAssets(); 