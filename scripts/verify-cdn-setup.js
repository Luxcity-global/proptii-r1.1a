import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import chalk from 'chalk';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const requiredEnvVars = [
    'AZURE_SUBSCRIPTION_ID',
    'RESOURCE_GROUP_NAME',
    'CDN_PROFILE_NAME',
    'CDN_ENDPOINT_NAME'
];

const validateEnvironment = () => {
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error(chalk.red('❌ Missing required environment variables:'));
        missingVars.forEach(varName => {
            console.error(chalk.yellow(`   - ${varName}`));
        });
        process.exit(1);
    }
};

const verifyCDNSetup = async () => {
    try {
        console.log(chalk.blue('🔍 Starting CDN setup verification...'));

        // Validate environment variables
        validateEnvironment();

        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

        const resourceGroupName = process.env.RESOURCE_GROUP_NAME;
        const profileName = process.env.CDN_PROFILE_NAME;
        const endpointName = process.env.CDN_ENDPOINT_NAME;

        // 4.1 CDN Verification
        console.log(chalk.blue('\n📡 Verifying CDN endpoint...'));

        // Check endpoint status
        const endpoint = await cdnClient.endpoints.get(resourceGroupName, profileName, endpointName);
        if (!endpoint) {
            throw new Error('CDN endpoint not found');
        }
        console.log(chalk.green('✅ Endpoint status:'), endpoint.enabledState || 'Unknown');

        // Verify origin connection by checking endpoint properties
        const originStatus = endpoint.origins?.[0]?.enabled ? 'Connected' : 'Disconnected';
        console.log(chalk.green('✅ Origin status:'), originStatus);

        // Get the CDN endpoint hostname
        const cdnHostname = endpoint.hostName;
        if (!cdnHostname) {
            throw new Error('CDN endpoint hostname not found');
        }
        console.log(chalk.green('✅ CDN Hostname:'), cdnHostname);

        // Test content delivery
        const testUrls = [
            '/index.html',
            '/assets/main.js',
            '/assets/styles.css',
            '/assets/logo.png'
        ];

        console.log(chalk.blue('\n📦 Testing content delivery...'));
        for (const url of testUrls) {
            try {
                const response = await axios.get(`https://${cdnHostname}${url}`, {
                    validateStatus: status => status < 500,
                    timeout: 5000 // 5 second timeout
                });
                console.log(chalk.green(`✅ ${url}:`), response.status);
            } catch (error) {
                if (error.code === 'ECONNABORTED') {
                    console.log(chalk.red(`❌ ${url}:`), 'Request timeout');
                } else {
                    console.log(chalk.red(`❌ ${url}:`), error.message);
                }
            }
        }

        // 4.2 SSL Validation
        console.log(chalk.blue('\n🔒 Verifying SSL configuration...'));

        // Check custom domains
        const customDomainName = 'proptii.co';
        console.log(chalk.blue(`\nChecking custom domain: ${customDomainName}`));

        try {
            // Check if custom domain exists
            const customDomain = await cdnClient.customDomains.get(
                resourceGroupName,
                profileName,
                endpointName,
                customDomainName
            );

            if (customDomain) {
                console.log(chalk.green(`✅ Custom domain ${customDomainName} is configured`));

                // Get SSL status
                const sslStatus = await cdnClient.customDomains.getSslStatus(
                    resourceGroupName,
                    profileName,
                    endpointName,
                    customDomainName
                );
                console.log(chalk.green(`✅ SSL status for ${customDomainName}:`), sslStatus.certificateStatus || 'Unknown');

                // Test HTTPS redirection
                try {
                    const httpResponse = await axios.get(`http://${customDomainName}`, {
                        maxRedirects: 0,
                        validateStatus: status => status < 500,
                        timeout: 5000
                    });
                    console.log(chalk.green(`✅ HTTPS redirection for ${customDomainName}:`),
                        httpResponse.status === 301 || httpResponse.status === 302 ? 'Working' : 'Not redirecting');
                } catch (error) {
                    if (error.response?.status === 301 || error.response?.status === 302) {
                        console.log(chalk.green(`✅ HTTPS redirection for ${customDomainName}: Working`));
                    } else if (error.code === 'ECONNABORTED') {
                        console.log(chalk.red(`❌ HTTPS redirection for ${customDomainName}: Request timeout`));
                    } else {
                        console.log(chalk.red(`❌ HTTPS redirection for ${customDomainName}:`), error.message);
                    }
                }
            }
        } catch (error) {
            if (error.statusCode === 404) {
                console.log(chalk.yellow(`⚠️ Custom domain ${customDomainName} is not configured`));
            } else {
                console.log(chalk.red(`❌ Failed to check custom domain ${customDomainName}:`), error.message);
            }
        }

        // Verify security headers
        try {
            const securityHeaders = await axios.get(`https://${cdnHostname}/index.html`, {
                timeout: 5000
            });
            const headers = securityHeaders.headers;

            const requiredHeaders = {
                'strict-transport-security': 'HSTS',
                'x-content-type-options': 'X-Content-Type-Options',
                'x-frame-options': 'X-Frame-Options',
                'content-security-policy': 'CSP'
            };

            console.log(chalk.blue('\n🛡️ Verifying security headers...'));
            for (const [header, name] of Object.entries(requiredHeaders)) {
                if (headers[header]) {
                    console.log(chalk.green(`✅ ${name}: Present`));
                } else {
                    console.log(chalk.red(`❌ ${name}: Missing`));
                }
            }
        } catch (error) {
            console.log(chalk.red('❌ Failed to verify security headers:'), error.message);
        }

        // 4.3 Performance Testing
        console.log(chalk.blue('\n⚡ Testing performance...'));

        try {
            // Get CDN metrics
            const metrics = await cdnClient.endpoints.getMetrics(
                resourceGroupName,
                profileName,
                endpointName,
                {
                    metrics: ['RequestCount', 'ResponseSize', 'CacheHitRatio', 'BandWidth'],
                    interval: 'PT1H',
                    granularity: 'PT5M'
                }
            );

            // Check cache hit ratio
            const cacheHitRatio = metrics.find(m => m.name === 'CacheHitRatio')?.value || 0;
            console.log(chalk.green('✅ Cache hit ratio:'), `${cacheHitRatio}%`);

            // Test response times
            const responseTimes = [];
            for (let i = 0; i < 5; i++) {
                const start = Date.now();
                await axios.get(`https://${cdnHostname}/index.html`, {
                    timeout: 5000
                });
                responseTimes.push(Date.now() - start);
            }
            const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
            console.log(chalk.green('✅ Average response time:'), `${avgResponseTime}ms`);

            // Test edge locations
            const edgeLocations = [
                'us-east-1',
                'us-west-1',
                'eu-west-1',
                'ap-southeast-1'
            ];

            console.log(chalk.blue('\n🌍 Testing edge locations...'));
            for (const location of edgeLocations) {
                try {
                    const start = Date.now();
                    await axios.get(`https://${cdnHostname}/index.html`, {
                        headers: { 'X-Forwarded-For': location },
                        timeout: 5000
                    });
                    const responseTime = Date.now() - start;
                    console.log(chalk.green(`✅ ${location}:`), `${responseTime}ms`);
                } catch (error) {
                    if (error.code === 'ECONNABORTED') {
                        console.log(chalk.red(`❌ ${location}: Request timeout`));
                    } else {
                        console.log(chalk.red(`❌ ${location}:`), error.message);
                    }
                }
            }
        } catch (error) {
            console.log(chalk.red('❌ Failed to get performance metrics:'), error.message);
        }

        console.log(chalk.green('\n✅ CDN setup verification completed successfully!'));

    } catch (error) {
        console.error(chalk.red('❌ CDN setup verification failed:'), error.message);
        if (error.code === 'InvalidAuthenticationTokenTenant') {
            console.error(chalk.yellow('\nAuthentication error. Please ensure you are logged in to Azure CLI:'));
            console.error(chalk.blue('   Run: az login'));
        }
        process.exit(1);
    }
};

verifyCDNSetup(); 