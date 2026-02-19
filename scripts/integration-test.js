import axios from 'axios';
import chalk from 'chalk';
import { performance } from 'perf_hooks';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

class IntegrationTester {
    constructor() {
        this.metrics = {
            cdnIntegration: {
                originConnection: {},
                assetDelivery: {},
                errorHandling: {}
            },
            optimization: {},
            security: {},
            errorResults: {}
        };

        this.thresholds = {
            responseTime: 1000, // 1 second
            errorRate: 0.01, // 1%
            sslScore: 0.9, // 90%
            wafScore: 0.95, // 95%
            failoverTime: 5000 // 5 seconds
        };

        // Initialize Application Insights only if instrumentation key is available
        if (process.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY) {
            this.appInsights = new ApplicationInsights({
                config: {
                    instrumentationKey: process.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY,
                    enableAutoRouteTracking: true,
                    enableCorsCorrelation: true
                }
            });
            this.appInsights.loadAppInsights();
        } else {
            console.log(chalk.yellow('⚠️ Application Insights instrumentation key not found. Metrics will not be tracked.'));
            this.appInsights = null;
        }
    }

    async runIntegrationTests(config) {
        const {
            baseUrl,
            endpoints,
            securityRules,
            optimizationRules
        } = config;

        console.log(chalk.blue('\n🔍 Starting Integration Tests...'));
        console.log(`Base URL: ${baseUrl}`);

        // Run all test suites
        await this.testCDNIntegration(baseUrl, endpoints);
        await this.testSecurityRules(baseUrl, endpoints, securityRules);
        await this.testOptimization(baseUrl, endpoints, optimizationRules);
        await this.testFailover(baseUrl, endpoints);
        await this.collectMetrics();

        // Generate report
        this.generateReport();
    }

    async testCDNIntegration(baseUrl, endpoints) {
        console.log(chalk.blue('\n📡 Testing CDN Integration...'));

        // Test origin connection
        await this.testOriginConnection(baseUrl, endpoints);

        // Test asset delivery
        await this.testAssetDelivery(baseUrl, endpoints);

        // Test error handling
        await this.testErrorHandling(baseUrl, endpoints);
    }

    async testOriginConnection(baseUrl, endpoints) {
        console.log(chalk.yellow('\nTesting Origin Connection...'));

        for (const endpoint of endpoints) {
            const path = typeof endpoint === 'string' ? endpoint : endpoint.path;
            console.log(chalk.yellow(`\nTesting ${path}...`));
            this.metrics.cdnIntegration.originConnection[path] = {
                healthCheck: null,
                failover: null,
                loadBalancing: null
            };

            try {
                // Test health check
                const healthResponse = await axios.get(`${baseUrl}${path}/health`, {
                    timeout: 5000,
                    validateStatus: status => status < 500
                });

                this.metrics.cdnIntegration.originConnection[path].healthCheck = {
                    status: healthResponse.status,
                    responseTime: healthResponse.headers['x-response-time'],
                    headers: healthResponse.headers
                };

                // Test load balancing
                const loadBalancingResults = await this.testLoadBalancing(baseUrl, path);
                this.metrics.cdnIntegration.originConnection[path].loadBalancing = loadBalancingResults;

                this.trackMetric('OriginConnection', 1, {
                    endpoint: path,
                    healthStatus: healthResponse.status,
                    responseTime: healthResponse.headers['x-response-time']
                });

                console.log(chalk.green(`  ✓ Health Check: ${healthResponse.status}`));
                console.log(chalk.green(`  ✓ Response Time: ${healthResponse.headers['x-response-time']}ms`));
            } catch (error) {
                console.log(chalk.red(`  ✗ Error: ${error.message}`));
                this.trackMetric('OriginConnection', 0, {
                    endpoint: path,
                    error: error.message
                });
            }
        }
    }

    async testLoadBalancing(baseUrl, path) {
        const results = {
            requests: [],
            distribution: {}
        };

        // Make multiple requests to test load distribution
        for (let i = 0; i < 10; i++) {
            const response = await axios.get(`${baseUrl}${path}`, {
                headers: {
                    'Accept-Encoding': 'gzip, deflate, br'
                }
            });

            const server = response.headers['x-server'] || 'unknown';
            results.requests.push({
                server,
                responseTime: response.headers['x-response-time'],
                status: response.status
            });

            results.distribution[server] = (results.distribution[server] || 0) + 1;
        }

        return results;
    }

    async testAssetDelivery(baseUrl, endpoints) {
        console.log(chalk.yellow('\nTesting Asset Delivery...'));

        for (const endpoint of endpoints) {
            console.log(chalk.yellow(`\nTesting ${endpoint.path}...`));
            this.metrics.cdnIntegration.assetDelivery[endpoint.path] = {
                staticFiles: null,
                dynamicContent: null,
                apiResponses: null
            };

            try {
                // Test static file delivery
                if (endpoint.path.match(/\.(js|css|png|jpg|gif|svg)$/)) {
                    const staticResponse = await axios.get(`${baseUrl}${endpoint.path}`, {
                        headers: {
                            'Accept-Encoding': 'gzip, deflate, br'
                        }
                    });

                    this.metrics.cdnIntegration.assetDelivery[endpoint.path].staticFiles = {
                        status: staticResponse.status,
                        contentType: staticResponse.headers['content-type'],
                        contentLength: staticResponse.headers['content-length'],
                        cacheControl: staticResponse.headers['cache-control']
                    };
                }

                // Test dynamic content
                if (endpoint.path.match(/\.(html|json)$/)) {
                    const dynamicResponse = await axios.get(`${baseUrl}${endpoint.path}`, {
                        headers: {
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Cache-Control': 'no-cache'
                        }
                    });

                    this.metrics.cdnIntegration.assetDelivery[endpoint.path].dynamicContent = {
                        status: dynamicResponse.status,
                        contentType: dynamicResponse.headers['content-type'],
                        cacheControl: dynamicResponse.headers['cache-control']
                    };
                }

                // Test API responses
                if (endpoint.path.startsWith('/api/')) {
                    const apiResponse = await axios.get(`${baseUrl}${endpoint.path}`, {
                        headers: {
                            'Accept': 'application/json',
                            'Cache-Control': 'no-cache'
                        }
                    });

                    this.metrics.cdnIntegration.assetDelivery[endpoint.path].apiResponses = {
                        status: apiResponse.status,
                        contentType: apiResponse.headers['content-type'],
                        responseTime: apiResponse.headers['x-response-time']
                    };
                }

                this.trackMetric('AssetDelivery', 1, {
                    endpoint: endpoint.path,
                    type: this.getAssetType(endpoint.path)
                });

                console.log(chalk.green(`  ✓ Asset Delivery: ${endpoint.path}`));
            } catch (error) {
                console.log(chalk.red(`  ✗ Error: ${error.message}`));
                this.trackMetric('AssetDelivery', 0, {
                    endpoint: endpoint.path,
                    error: error.message
                });
            }
        }
    }

    getAssetType(path) {
        if (path.match(/\.(js|css|png|jpg|gif|svg)$/)) return 'static';
        if (path.match(/\.(html|json)$/)) return 'dynamic';
        if (path.startsWith('/api/')) return 'api';
        return 'unknown';
    }

    async testErrorHandling(baseUrl, endpoints) {
        console.log(chalk.yellow('\nTesting Error Handling...'));

        const errorScenarios = [
            { path: '/nonexistent', expected: 404 },
            { path: '/api/error', expected: 500 },
            { path: '/timeout', expected: 504 }
        ];

        for (const scenario of errorScenarios) {
            console.log(chalk.yellow(`\nTesting ${scenario.path}...`));
            this.metrics.cdnIntegration.errorHandling[scenario.path] = {
                expected: scenario.expected,
                actual: null,
                response: null
            };

            try {
                const response = await axios.get(`${baseUrl}${scenario.path}`, {
                    validateStatus: status => true,
                    timeout: 5000
                });

                this.metrics.cdnIntegration.errorHandling[scenario.path].actual = response.status;
                this.metrics.cdnIntegration.errorHandling[scenario.path].response = {
                    status: response.status,
                    headers: response.headers
                };

                const isExpected = response.status === scenario.expected;
                this.trackMetric('ErrorHandling', isExpected ? 1 : 0, {
                    path: scenario.path,
                    expected: scenario.expected,
                    actual: response.status
                });

                console.log(chalk.green(`  ✓ Status: ${response.status}`));
                console.log(chalk.green(`  ✓ Expected: ${scenario.expected}`));
            } catch (error) {
                console.log(chalk.red(`  ✗ Error: ${error.message}`));
                this.trackMetric('ErrorHandling', 0, {
                    path: scenario.path,
                    error: error.message
                });
            }
        }
    }

    async testSecurityRules(baseUrl, endpoints, securityRules) {
        console.log(chalk.blue('\n🔒 Testing Security Rules...'));

        for (const endpoint of endpoints) {
            console.log(chalk.yellow(`\nTesting ${endpoint.path}...`));
            this.metrics.securityTests[endpoint.path] = {
                waf: {},
                ssl: null,
                accessControl: null
            };

            try {
                // Test WAF rules
                await this.testWAFRules(baseUrl, endpoint.path, securityRules.wafRules);

                // Test SSL/TLS
                await this.testSSL(baseUrl, endpoint.path);

                // Test access control
                await this.testAccessControl(baseUrl, endpoint.path, securityRules.accessControl);

            } catch (error) {
                console.log(chalk.red(`  ✗ Security Test Error: ${error.message}`));
            }
        }
    }

    async testWAFRules(baseUrl, path, wafRules) {
        console.log(chalk.yellow('\nTesting WAF Rules...'));

        for (const rule of wafRules) {
            try {
                await axios.get(`${baseUrl}${path}`, {
                    headers: rule.testHeaders
                });
                this.metrics.securityTests[path].waf[rule.name] = {
                    passed: false,
                    error: 'Rule did not block request'
                };
            } catch (error) {
                this.metrics.securityTests[path].waf[rule.name] = {
                    passed: true,
                    error: error.message
                };
            }
        }
    }

    async testSSL(baseUrl, path) {
        console.log(chalk.yellow('\nTesting SSL/TLS...'));

        try {
            const response = await axios.get(`${baseUrl}${path}`, {
                maxRedirects: 0,
                validateStatus: status => status < 500
            });

            const sslScore = this.calculateSSLScore(response.headers);
            this.metrics.securityTests[path].ssl = {
                score: sslScore,
                headers: response.headers
            };

            this.trackMetric('SSLScore', sslScore, {
                path,
                headers: Object.keys(response.headers)
            });

            console.log(chalk.green(`  ✓ SSL Score: ${(sslScore * 100).toFixed(2)}%`));
        } catch (error) {
            console.log(chalk.red(`  ✗ SSL Test Error: ${error.message}`));
        }
    }

    calculateSSLScore(headers) {
        const requiredHeaders = [
            'strict-transport-security',
            'x-content-type-options',
            'x-frame-options',
            'content-security-policy'
        ];

        const presentHeaders = requiredHeaders.filter(header => headers[header]);
        return presentHeaders.length / requiredHeaders.length;
    }

    async testAccessControl(baseUrl, path, accessControl) {
        console.log(chalk.yellow('\nTesting Access Control...'));

        if (!accessControl) return;

        const tests = [
            { token: 'valid-token', expected: 200 },
            { token: 'invalid-token', expected: 401 },
            { token: 'expired-token', expected: 401 },
            { token: '', expected: 401 }
        ];

        for (const test of tests) {
            try {
                const response = await axios.get(`${baseUrl}${path}`, {
                    headers: {
                        'Authorization': `Bearer ${test.token}`
                    }
                });

                this.metrics.securityTests[path].accessControl = {
                    ...this.metrics.securityTests[path].accessControl,
                    [test.token]: {
                        expected: test.expected,
                        actual: response.status,
                        passed: response.status === test.expected
                    }
                };
            } catch (error) {
                this.metrics.securityTests[path].accessControl = {
                    ...this.metrics.securityTests[path].accessControl,
                    [test.token]: {
                        expected: test.expected,
                        actual: error.response?.status || 500,
                        passed: error.response?.status === test.expected
                    }
                };
            }
        }
    }

    async testFailover(baseUrl, endpoints) {
        console.log(chalk.blue('\n🔄 Testing Failover...'));

        for (const endpoint of endpoints) {
            console.log(chalk.yellow(`\nTesting failover for ${endpoint.path}...`));
            this.metrics.failoverResults[endpoint.path] = {
                primaryResponse: null,
                failoverResponse: null,
                failoverTime: null
            };

            try {
                // Simulate primary endpoint failure
                const startTime = performance.now();
                const response = await axios.get(`${baseUrl}${endpoint.path}`, {
                    headers: {
                        'Accept-Encoding': 'gzip, deflate, br',
                        'X-Force-Failover': 'true'
                    },
                    timeout: 5000
                });

                const duration = performance.now() - startTime;
                this.metrics.failoverResults[endpoint.path] = {
                    failoverResponse: {
                        duration,
                        status: response.status,
                        headers: response.headers
                    },
                    failoverTime: duration
                };

                this.trackMetric('FailoverTime', duration, {
                    endpoint: endpoint.path,
                    status: response.status
                });

                console.log(chalk.green(`  ✓ Failover Time: ${duration.toFixed(2)}ms`));
            } catch (error) {
                console.log(chalk.red(`  ✗ Failover Error: ${error.message}`));
            }
        }
    }

    async collectMetrics() {
        console.log(chalk.blue('\n📊 Collecting Metrics...'));

        // Calculate CDN integration metrics
        Object.entries(this.metrics.cdnIntegration.originConnection).forEach(([endpoint, data]) => {
            if (data.healthCheck) {
                this.trackMetric('HealthCheck', data.healthCheck.status === 200 ? 1 : 0, {
                    endpoint,
                    responseTime: data.healthCheck.responseTime
                });
            }
        });

        // Calculate security test results
        Object.entries(this.metrics.securityTests).forEach(([endpoint, data]) => {
            if (data.waf) {
                const wafScore = Object.values(data.waf).filter(r => r.passed).length / Object.keys(data.waf).length;
                this.trackMetric('WAFScore', wafScore, { endpoint });
            }

            if (data.ssl) {
                this.trackMetric('SSLScore', data.ssl.score, { endpoint });
            }

            if (data.accessControl) {
                const accessControlScore = Object.values(data.accessControl).filter(r => r.passed).length / Object.keys(data.accessControl).length;
                this.trackMetric('AccessControlScore', accessControlScore, { endpoint });
            }
        });

        // Calculate failover statistics
        Object.entries(this.metrics.failoverResults).forEach(([endpoint, data]) => {
            if (data.failoverTime) {
                this.trackMetric('FailoverStats', data.failoverTime, {
                    endpoint,
                    status: data.failoverResponse.status
                });
            }
        });
    }

    trackMetric(name, value, properties = {}) {
        if (this.appInsights) {
            this.appInsights.trackMetric({
                name: `IntegrationTest.${name}`,
                average: value,
                properties: {
                    ...properties,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    generateReport() {
        console.log(chalk.green('\n📋 Integration Test Report'));
        console.log('='.repeat(50));

        // CDN Integration Statistics
        console.log(chalk.blue('\nCDN Integration Statistics:'));
        Object.entries(this.metrics.cdnIntegration.originConnection).forEach(([endpoint, data]) => {
            console.log(`\n${endpoint}:`);
            if (data.healthCheck) {
                console.log(`  Health Check:`);
                console.log(`    Status: ${data.healthCheck.status}`);
                console.log(`    Response Time: ${data.healthCheck.responseTime}ms`);
            }
            if (data.loadBalancing) {
                console.log(`  Load Balancing:`);
                Object.entries(data.loadBalancing.distribution).forEach(([server, count]) => {
                    console.log(`    ${server}: ${count} requests`);
                });
            }
        });

        // Asset Delivery Statistics
        console.log(chalk.blue('\nAsset Delivery Statistics:'));
        Object.entries(this.metrics.cdnIntegration.assetDelivery).forEach(([endpoint, data]) => {
            console.log(`\n${endpoint}:`);
            if (data.staticFiles) {
                console.log(`  Static Files:`);
                console.log(`    Status: ${data.staticFiles.status}`);
                console.log(`    Content Type: ${data.staticFiles.contentType}`);
                console.log(`    Cache Control: ${data.staticFiles.cacheControl}`);
            }
            if (data.dynamicContent) {
                console.log(`  Dynamic Content:`);
                console.log(`    Status: ${data.dynamicContent.status}`);
                console.log(`    Cache Control: ${data.dynamicContent.cacheControl}`);
            }
            if (data.apiResponses) {
                console.log(`  API Responses:`);
                console.log(`    Status: ${data.apiResponses.status}`);
                console.log(`    Response Time: ${data.apiResponses.responseTime}ms`);
            }
        });

        // Error Handling Statistics
        console.log(chalk.blue('\nError Handling Statistics:'));
        Object.entries(this.metrics.cdnIntegration.errorHandling).forEach(([path, data]) => {
            console.log(`\n${path}:`);
            console.log(`  Expected: ${data.expected}`);
            console.log(`  Actual: ${data.actual}`);
            console.log(`  Result: ${data.expected === data.actual ? 'PASS' : 'FAIL'}`);
        });

        // Security Test Results
        console.log(chalk.blue('\nSecurity Test Results:'));
        Object.entries(this.metrics.securityTests).forEach(([endpoint, data]) => {
            console.log(`\n${endpoint}:`);
            if (data.waf) {
                console.log('  WAF Rules:');
                Object.entries(data.waf).forEach(([rule, result]) => {
                    console.log(`    ${rule}: ${result.passed ? 'PASS' : 'FAIL'}`);
                });
            }
            if (data.ssl) {
                console.log(`  SSL Score: ${(data.ssl.score * 100).toFixed(2)}%`);
            }
            if (data.accessControl) {
                console.log('  Access Control:');
                Object.entries(data.accessControl).forEach(([test, result]) => {
                    console.log(`    ${test}: ${result.passed ? 'PASS' : 'FAIL'}`);
                });
            }
        });

        // Failover Statistics
        console.log(chalk.blue('\nFailover Statistics:'));
        Object.entries(this.metrics.failoverResults).forEach(([endpoint, data]) => {
            if (data.failoverTime) {
                console.log(`\n${endpoint}:`);
                console.log(`  Failover Time: ${data.failoverTime.toFixed(2)}ms`);
                console.log(`  Status: ${data.failoverResponse.status}`);
            }
        });
    }
}

// Example usage
const tester = new IntegrationTester();

const config = {
    baseUrl: process.env.VITE_APP_URL || 'https://proptii.azurewebsites.net',
    endpoints: [
        '/',
        '/api/health',
        '/assets/js/main.js',
        '/assets/css/main.css',
        '/assets/images/logo.png'
    ],
    securityRules: {
        wafRules: [
            {
                name: 'SQL Injection',
                pattern: "' OR '1'='1",
                expectedStatus: 403
            },
            {
                name: 'XSS Attack',
                pattern: '<script>alert(1)</script>',
                expectedStatus: 403
            }
        ]
    },
    optimizationRules: {
        compression: true,
        minification: true,
        imageOptimization: true
    }
};

tester.runIntegrationTests(config).catch(console.error); 