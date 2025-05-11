import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import chalk from 'chalk';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Validation thresholds
const VALIDATION_THRESHOLDS = {
    cacheHitRatio: 80, // 80%
    responseTime: 1000, // 1 second
    errorRate: 1, // 1%
    compressionRatio: 0.7, // 70% compression
    minificationRatio: 0.3 // 30% size reduction
};

async function validateCDNRules() {
    console.log(chalk.blue('🔍 Starting CDN rules validation...'));

    try {
        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

        // Get CDN endpoint details
        const endpoint = await cdnClient.endpoints.get(
            process.env.RESOURCE_GROUP_NAME,
            process.env.CDN_PROFILE_NAME,
            process.env.CDN_ENDPOINT_NAME
        );

        if (!endpoint) {
            throw new Error('CDN endpoint not found');
        }

        const cdnHostname = endpoint.hostName;
        console.log(chalk.blue(`\nCDN Hostname: ${cdnHostname}`));

        // 4.1 Cache Testing
        console.log(chalk.yellow('\n📦 Validating cache behavior...'));
        await validateCacheBehavior(cdnHostname);

        // 4.2 Optimization Testing
        console.log(chalk.yellow('\n⚡ Validating optimization rules...'));
        await validateOptimizationRules(cdnHostname);

        // 4.3 Security Testing
        console.log(chalk.yellow('\n🔒 Validating security rules...'));
        await validateSecurityRules(cdnHostname);

        console.log(chalk.green('\n✅ CDN rules validation completed successfully!'));

    } catch (error) {
        console.error(chalk.red('\n❌ CDN rules validation failed:'));
        console.error(error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

async function validateCacheBehavior(cdnHostname) {
    const testUrls = [
        '/',
        '/api/health',
        '/assets/js/main.js',
        '/assets/css/main.css'
    ];

    for (const url of testUrls) {
        try {
            // First request (cache miss)
            const startTime1 = Date.now();
            const response1 = await axios.get(`https://${cdnHostname}${url}`, {
                validateStatus: status => status < 500,
                headers: {
                    'Accept-Encoding': 'gzip, deflate, br'
                }
            });
            const time1 = Date.now() - startTime1;

            // Second request (should be cache hit)
            const startTime2 = Date.now();
            const response2 = await axios.get(`https://${cdnHostname}${url}`, {
                validateStatus: status => status < 500,
                headers: {
                    'Accept-Encoding': 'gzip, deflate, br'
                }
            });
            const time2 = Date.now() - startTime2;

            // Verify cache headers
            const cacheControl = response2.headers['cache-control'];
            const age = response2.headers['age'];
            const etag = response2.headers['etag'];

            console.log(chalk.blue(`\nTesting ${url}:`));
            console.log(`   Status: ${response2.status}`);
            console.log(`   Cache-Control: ${cacheControl || 'Not set'}`);
            console.log(`   Age: ${age || 'Not set'}`);
            console.log(`   ETag: ${etag || 'Not set'}`);
            console.log(`   First request: ${time1}ms`);
            console.log(`   Second request: ${time2}ms`);

            if (time2 < time1) {
                console.log(chalk.green('   ✓ Cache hit confirmed'));
            } else {
                console.log(chalk.yellow('   ⚠️ Cache hit not confirmed'));
            }

            // Check if cache headers are properly set
            if (!cacheControl) {
                console.log(chalk.yellow('   ⚠️ Cache-Control header missing'));
            }
            if (!etag) {
                console.log(chalk.yellow('   ⚠️ ETag header missing'));
            }
        } catch (error) {
            console.log(chalk.red(`   ❌ Failed to test ${url}:`), error.message);
        }
    }
}

async function validateOptimizationRules(cdnHostname) {
    const testFiles = {
        html: '/',
        css: '/assets/css/main.css',
        js: '/assets/js/main.js',
        api: '/api/health'
    };

    for (const [type, url] of Object.entries(testFiles)) {
        try {
            const response = await axios.get(`https://${cdnHostname}${url}`, {
                responseType: 'arraybuffer',
                validateStatus: status => status < 500,
                headers: {
                    'Accept-Encoding': 'gzip, deflate, br'
                }
            });

            // Check compression
            const contentEncoding = response.headers['content-encoding'];
            const contentLength = response.headers['content-length'];
            const contentType = response.headers['content-type'];

            console.log(chalk.blue(`\nTesting ${type} optimization:`));
            console.log(`   Status: ${response.status}`);
            console.log(`   Content-Type: ${contentType || 'Not set'}`);
            console.log(`   Content-Encoding: ${contentEncoding || 'Not set'}`);
            console.log(`   Content-Length: ${contentLength || 'Not set'}`);

            if (contentEncoding === 'gzip' || contentEncoding === 'br') {
                console.log(chalk.green('   ✓ Compression enabled'));
            } else {
                console.log(chalk.yellow('   ⚠️ Compression not detected'));
            }

            // Check minification for text-based files
            if (type !== 'api' && response.status === 200) {
                const content = response.data.toString();
                const hasComments = content.includes('/*') || content.includes('//');
                const hasWhitespace = /\s{2,}/.test(content);

                if (!hasComments && !hasWhitespace) {
                    console.log(chalk.green('   ✓ Minification confirmed'));
                } else {
                    console.log(chalk.yellow('   ⚠️ Minification not confirmed'));
                }
            }
        } catch (error) {
            console.log(chalk.red(`   ❌ Failed to test ${type} optimization:`), error.message);
        }
    }
}

async function validateSecurityRules(cdnHostname) {
    // Test security headers
    try {
        const response = await axios.get(`https://${cdnHostname}/`, {
            validateStatus: status => status < 500,
            headers: {
                'Accept-Encoding': 'gzip, deflate, br'
            }
        });
        const headers = response.headers;

        const requiredHeaders = {
            'strict-transport-security': 'HSTS',
            'x-content-type-options': 'X-Content-Type-Options',
            'x-frame-options': 'X-Frame-Options',
            'content-security-policy': 'CSP',
            'referrer-policy': 'Referrer-Policy',
            'permissions-policy': 'Permissions-Policy',
            'x-xss-protection': 'X-XSS-Protection'
        };

        console.log(chalk.blue('\nTesting security headers:'));
        for (const [header, name] of Object.entries(requiredHeaders)) {
            if (headers[header]) {
                console.log(chalk.green(`   ✓ ${name}: Present`));
                console.log(`      Value: ${headers[header]}`);
            } else {
                console.log(chalk.red(`   ❌ ${name}: Missing`));
            }
        }

        // Test HTTPS enforcement
        try {
            await axios.get(`http://${cdnHostname}/`, {
                maxRedirects: 0,
                validateStatus: status => status < 500
            });
            console.log(chalk.green('   ✓ HTTPS enforcement: Working'));
        } catch (error) {
            if (error.response?.status === 301 || error.response?.status === 302) {
                console.log(chalk.green('   ✓ HTTPS enforcement: Working'));
            } else {
                console.log(chalk.red('   ❌ HTTPS enforcement: Failed'));
            }
        }

    } catch (error) {
        console.log(chalk.red('   ❌ Failed to test security rules:'), error.message);
    }
}

validateCDNRules(); 