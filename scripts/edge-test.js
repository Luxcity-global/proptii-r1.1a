import axios from 'axios';
import chalk from 'chalk';
import { performance } from 'perf_hooks';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

class EdgeTester {
    constructor() {
        this.metrics = {
            edgeLocations: {},
            cacheBehavior: {
                static: {},
                dynamic: {},
                api: {}
            },
            cacheRules: {},
            securityTests: {},
            failoverResults: {}
        };

        this.thresholds = {
            staticHitRate: 0.8, // 80%
            dynamicHitRate: 0.4, // 40%
            apiHitRate: 0.3, // 30%
            responseTime: 1000, // 1 second
            errorRate: 0.01 // 1%
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

    async runEdgeTests(config) {
        const {
            baseUrl,
            endpoints,
            edgeLocations,
            cacheTestPaths,
            securityRules
        } = config;

        console.log(chalk.blue('\n🌍 Starting Edge Tests...'));
        console.log(`Base URL: ${baseUrl}`);
        console.log(`Edge Locations: ${edgeLocations.join(', ')}`);

        // Run all test suites
        await this.testEdgeLocations(baseUrl, endpoints, edgeLocations);
        await this.testCacheBehavior(baseUrl, cacheTestPaths);
        await this.testCacheRules(baseUrl, endpoints);
        await this.testSecurityRules(baseUrl, securityRules);
        await this.testFailover(baseUrl, endpoints);
        await this.collectMetrics();

        // Generate report
        this.generateReport();
    }

    async testEdgeLocations(baseUrl, endpoints, edgeLocations) {
        console.log(chalk.blue('\n📍 Testing Edge Locations...'));

        for (const location of edgeLocations) {
            console.log(chalk.yellow(`\nTesting ${location}...`));
            this.metrics.edgeLocations[location] = {
                responseTimes: [],
                errors: []
            };

            for (const endpoint of endpoints) {
                const path = typeof endpoint === 'string' ? endpoint : endpoint.path;
                try {
                    const startTime = performance.now();
                    const response = await axios.get(`${baseUrl}${path}`, {
                        headers: {
                            'X-Forwarded-For': location,
                            'Accept-Encoding': 'gzip, deflate, br'
                        },
                        timeout: 5000
                    });

                    const duration = performance.now() - startTime;
                    this.metrics.edgeLocations[location].responseTimes.push({
                        endpoint: path,
                        duration,
                        status: response.status
                    });

                    this.trackMetric('EdgeLocationResponseTime', duration, {
                        location,
                        endpoint: path,
                        status: response.status
                    });

                    console.log(chalk.green(`  ✓ ${path}: ${duration.toFixed(2)}ms`));
                } catch (error) {
                    this.metrics.edgeLocations[location].errors.push({
                        endpoint: path,
                        error: error.message
                    });

                    this.trackMetric('EdgeLocationError', 1, {
                        location,
                        endpoint: path,
                        error: error.message
                    });

                    console.log(chalk.red(`  ✗ ${path}: ${error.message}`));
                }
            }
        }
    }

    async testCacheBehavior(baseUrl, cacheTestPaths) {
        console.log(chalk.blue('\n💾 Testing Cache Behavior...'));

        for (const [contentType, paths] of Object.entries(cacheTestPaths)) {
            console.log(chalk.yellow(`\nTesting ${contentType} content...`));

            for (const path of paths) {
                console.log(chalk.yellow(`\nTesting ${path}...`));
                this.metrics.cacheBehavior[contentType][path] = {
                    firstRequest: null,
                    secondRequest: null,
                    cacheHit: false,
                    headers: {},
                    invalidationTest: null
                };

                try {
                    // First request (should be cache miss)
                    const startTime1 = performance.now();
                    const response1 = await axios.get(`${baseUrl}${path}`, {
                        headers: {
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Cache-Control': 'no-cache'
                        }
                    });
                    const duration1 = performance.now() - startTime1;

                    this.metrics.cacheBehavior[contentType][path].firstRequest = {
                        duration: duration1,
                        status: response1.status,
                        headers: response1.headers
                    };

                    // Second request (should be cache hit)
                    const startTime2 = performance.now();
                    const response2 = await axios.get(`${baseUrl}${path}`, {
                        headers: {
                            'Accept-Encoding': 'gzip, deflate, br'
                        }
                    });
                    const duration2 = performance.now() - startTime2;

                    this.metrics.cacheBehavior[contentType][path].secondRequest = {
                        duration: duration2,
                        status: response2.status,
                        headers: response2.headers
                    };

                    // Verify cache hit
                    const cacheHit = this.verifyCacheHit(response2.headers, duration2 < duration1);
                    this.metrics.cacheBehavior[contentType][path].cacheHit = cacheHit;
                    this.metrics.cacheBehavior[contentType][path].headers = response2.headers;

                    // Test cache invalidation
                    await this.testCacheInvalidation(baseUrl, path, contentType);

                    this.trackMetric('CacheBehavior', cacheHit ? 1 : 0, {
                        contentType,
                        path,
                        firstRequestDuration: duration1,
                        secondRequestDuration: duration2
                    });

                    console.log(chalk.green(`  ✓ First Request: ${duration1.toFixed(2)}ms`));
                    console.log(chalk.green(`  ✓ Second Request: ${duration2.toFixed(2)}ms`));
                    console.log(chalk.green(`  ✓ Cache Hit: ${cacheHit ? 'Yes' : 'No'}`));
                    console.log(chalk.green(`  ✓ Cache Headers: ${JSON.stringify(response2.headers, null, 2)}`));
                } catch (error) {
                    console.log(chalk.red(`  ✗ Error: ${error.message}`));
                }
            }
        }
    }

    verifyCacheHit(headers, timeComparison) {
        const cacheControl = headers['cache-control'];
        const age = headers['age'];
        const etag = headers['etag'];
        const xCache = headers['x-cache'];

        // Check various cache indicators
        const hasCacheHeaders = !!(cacheControl && etag);
        const hasAgeHeader = !!age;
        const hasXCacheHeader = xCache?.toLowerCase().includes('hit');

        return hasCacheHeaders && (hasAgeHeader || hasXCacheHeader || timeComparison);
    }

    async testCacheInvalidation(baseUrl, path, contentType) {
        console.log(chalk.yellow(`\nTesting cache invalidation for ${path}...`));

        try {
            // Make initial request to ensure content is cached
            await axios.get(`${baseUrl}${path}`);

            // Test manual purge
            const purgeResponse = await axios.post(`${baseUrl}/api/cdn/purge`, {
                path,
                contentType
            });

            // Verify cache is invalidated
            const startTime = performance.now();
            const response = await axios.get(`${baseUrl}${path}`, {
                headers: {
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache'
                }
            });
            const duration = performance.now() - startTime;

            this.metrics.cacheBehavior[contentType][path].invalidationTest = {
                purgeStatus: purgeResponse.status,
                responseTime: duration,
                headers: response.headers
            };

            console.log(chalk.green(`  ✓ Purge Status: ${purgeResponse.status}`));
            console.log(chalk.green(`  ✓ Post-Purge Response Time: ${duration.toFixed(2)}ms`));
        } catch (error) {
            console.log(chalk.red(`  ✗ Invalidation Error: ${error.message}`));
        }
    }

    async testCacheRules(baseUrl, endpoints) {
        console.log(chalk.blue('\n📋 Testing Cache Rules...'));

        for (const endpoint of endpoints) {
            console.log(chalk.yellow(`\nTesting rules for ${endpoint.path}...`));
            this.metrics.cacheRules[endpoint.path] = {
                pathBased: null,
                queryString: null,
                headerBased: null
            };

            try {
                // Test path-based rules
                await this.testPathBasedRules(baseUrl, endpoint.path);

                // Test query string handling
                await this.testQueryStringHandling(baseUrl, endpoint.path);

                // Test header-based rules
                await this.testHeaderBasedRules(baseUrl, endpoint.path);

            } catch (error) {
                console.log(chalk.red(`  ✗ Rule Test Error: ${error.message}`));
            }
        }
    }

    async testPathBasedRules(baseUrl, path) {
        const variations = [
            path,
            `${path}/`,
            `${path}/index.html`,
            `${path}?v=1`
        ];

        for (const variation of variations) {
            const response = await axios.get(`${baseUrl}${variation}`);
            this.metrics.cacheRules[path].pathBased = {
                variations: variations.map(v => ({
                    path: v,
                    status: response.status,
                    headers: response.headers
                }))
            };
        }
    }

    async testQueryStringHandling(baseUrl, path) {
        const queryStrings = [
            '?v=1',
            '?timestamp=' + Date.now(),
            '?cache=false',
            '?nocache=true'
        ];

        for (const query of queryStrings) {
            const response = await axios.get(`${baseUrl}${path}${query}`);
            this.metrics.cacheRules[path].queryString = {
                variations: queryStrings.map(q => ({
                    query: q,
                    status: response.status,
                    headers: response.headers
                }))
            };
        }
    }

    async testHeaderBasedRules(baseUrl, path) {
        const headers = [
            { 'Cache-Control': 'no-cache' },
            { 'Cache-Control': 'max-age=3600' },
            { 'If-None-Match': 'test-etag' },
            { 'If-Modified-Since': new Date().toUTCString() }
        ];

        for (const header of headers) {
            const response = await axios.get(`${baseUrl}${path}`, { headers });
            this.metrics.cacheRules[path].headerBased = {
                variations: headers.map(h => ({
                    header: h,
                    status: response.status,
                    headers: response.headers
                }))
            };
        }
    }

    async testSecurityRules(baseUrl, securityRules) {
        console.log(chalk.blue('\n🔒 Testing Security Rules...'));

        for (const rule of securityRules) {
            console.log(chalk.yellow(`\nTesting ${rule.type} rule...`));
            this.metrics.securityTests[rule.type] = {
                tests: [],
                results: {}
            };

            try {
                switch (rule.type) {
                    case 'token':
                        await this.testTokenValidation(baseUrl, rule);
                        break;
                    case 'ip':
                        await this.testIPRestrictions(baseUrl, rule);
                        break;
                    case 'geo':
                        await this.testGeoFiltering(baseUrl, rule);
                        break;
                    case 'cachePoisoning':
                        await this.testCachePoisoning(baseUrl, rule);
                        break;
                }
            } catch (error) {
                console.log(chalk.red(`  ✗ Security Test Error: ${error.message}`));
            }
        }
    }

    async testTokenValidation(baseUrl, rule) {
        const tests = [
            { token: 'valid-token', expected: 200 },
            { token: 'invalid-token', expected: 401 },
            { token: 'expired-token', expected: 401 },
            { token: '', expected: 401 }
        ];

        for (const test of tests) {
            const response = await axios.get(`${baseUrl}${rule.path}`, {
                headers: { 'Authorization': `Bearer ${test.token}` }
            });
            this.metrics.securityTests.token.tests.push({
                test,
                actual: response.status,
                headers: response.headers
            });
        }
    }

    async testIPRestrictions(baseUrl, rule) {
        const tests = [
            { ip: '192.168.1.1', expected: 200 },
            { ip: '10.0.0.1', expected: 403 },
            { ip: '172.16.0.1', expected: 403 }
        ];

        for (const test of tests) {
            const response = await axios.get(`${baseUrl}${rule.path}`, {
                headers: { 'X-Forwarded-For': test.ip }
            });
            this.metrics.securityTests.ip.tests.push({
                test,
                actual: response.status,
                headers: response.headers
            });
        }
    }

    async testGeoFiltering(baseUrl, rule) {
        const tests = [
            { country: 'US', expected: 200 },
            { country: 'CN', expected: 403 },
            { country: 'RU', expected: 403 }
        ];

        for (const test of tests) {
            const response = await axios.get(`${baseUrl}${rule.path}`, {
                headers: { 'CF-IPCountry': test.country }
            });
            this.metrics.securityTests.geo.tests.push({
                test,
                actual: response.status,
                headers: response.headers
            });
        }
    }

    async testCachePoisoning(baseUrl, rule) {
        const tests = [
            { header: 'X-Forwarded-Host', value: 'malicious.com' },
            { header: 'X-Original-URL', value: '/admin' },
            { header: 'X-Rewrite-URL', value: '/api' }
        ];

        for (const test of tests) {
            const response = await axios.get(`${baseUrl}${rule.path}`, {
                headers: { [test.header]: test.value }
            });
            this.metrics.securityTests.cachePoisoning.tests.push({
                test,
                actual: response.status,
                headers: response.headers
            });
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

        // Calculate edge location statistics
        Object.entries(this.metrics.edgeLocations).forEach(([location, data]) => {
            const avgResponseTime = data.responseTimes.reduce((acc, curr) => acc + curr.duration, 0) /
                data.responseTimes.length;
            const errorRate = data.errors.length / (data.responseTimes.length + data.errors.length);

            this.trackMetric('EdgeLocationStats', avgResponseTime, {
                location,
                avgResponseTime,
                errorRate
            });
        });

        // Calculate cache hit rates by content type
        Object.entries(this.metrics.cacheBehavior).forEach(([contentType, paths]) => {
            const hits = Object.values(paths).filter(p => p.cacheHit).length;
            const total = Object.keys(paths).length;
            const hitRate = hits / total;

            this.trackMetric('CacheHitRate', hitRate, {
                contentType,
                hits,
                total
            });

            // Check against thresholds
            const threshold = this.thresholds[`${contentType}HitRate`];
            if (hitRate < threshold) {
                console.log(chalk.yellow(`⚠️ Low cache hit rate for ${contentType}: ${(hitRate * 100).toFixed(2)}%`));
            }
        });

        // Calculate security test results
        Object.entries(this.metrics.securityTests).forEach(([type, data]) => {
            const passed = data.tests.filter(t => t.actual === t.test.expected).length;
            const total = data.tests.length;
            const passRate = passed / total;

            this.trackMetric('SecurityTestResults', passRate, {
                type,
                passed,
                total
            });
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
                name: `EdgeTest.${name}`,
                average: value,
                properties: {
                    ...properties,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    generateReport() {
        console.log(chalk.green('\n📋 Edge Test Report'));
        console.log('='.repeat(50));

        // Edge Location Statistics
        console.log(chalk.blue('\nEdge Location Statistics:'));
        Object.entries(this.metrics.edgeLocations).forEach(([location, data]) => {
            const responseTimes = data.responseTimes.map(r => r.duration);
            const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const errorRate = (data.errors.length / (data.responseTimes.length + data.errors.length)) * 100;

            console.log(`\n${location}:`);
            console.log(`  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
            console.log(`  Error Rate: ${errorRate.toFixed(2)}%`);
            console.log(`  Total Requests: ${data.responseTimes.length}`);
        });

        // Cache Behavior Statistics
        console.log(chalk.blue('\nCache Behavior Statistics:'));
        Object.entries(this.metrics.cacheBehavior).forEach(([contentType, paths]) => {
            console.log(`\n${contentType.toUpperCase()} Content:`);
            Object.entries(paths).forEach(([path, data]) => {
                if (data.firstRequest && data.secondRequest) {
                    console.log(`\n${path}:`);
                    console.log(`  First Request: ${data.firstRequest.duration.toFixed(2)}ms`);
                    console.log(`  Second Request: ${data.secondRequest.duration.toFixed(2)}ms`);
                    console.log(`  Cache Hit: ${data.cacheHit ? 'Yes' : 'No'}`);
                    console.log(`  Cache Headers: ${JSON.stringify(data.headers, null, 2)}`);

                    if (data.invalidationTest) {
                        console.log(`  Invalidation Test:`);
                        console.log(`    Purge Status: ${data.invalidationTest.purgeStatus}`);
                        console.log(`    Response Time: ${data.invalidationTest.responseTime.toFixed(2)}ms`);
                    }
                }
            });
        });

        // Cache Rules Statistics
        console.log(chalk.blue('\nCache Rules Statistics:'));
        Object.entries(this.metrics.cacheRules).forEach(([path, rules]) => {
            console.log(`\n${path}:`);
            if (rules.pathBased) {
                console.log('  Path-based Rules:');
                rules.pathBased.variations.forEach(v => {
                    console.log(`    ${v.path}: ${v.status}`);
                });
            }
            if (rules.queryString) {
                console.log('  Query String Rules:');
                rules.queryString.variations.forEach(v => {
                    console.log(`    ${v.query}: ${v.status}`);
                });
            }
            if (rules.headerBased) {
                console.log('  Header-based Rules:');
                rules.headerBased.variations.forEach(v => {
                    console.log(`    ${JSON.stringify(v.header)}: ${v.status}`);
                });
            }
        });

        // Security Test Results
        console.log(chalk.blue('\nSecurity Test Results:'));
        Object.entries(this.metrics.securityTests).forEach(([type, data]) => {
            console.log(`\n${type.toUpperCase()} Tests:`);
            data.tests.forEach(test => {
                console.log(`  Test: ${JSON.stringify(test.test)}`);
                console.log(`  Expected: ${test.test.expected}`);
                console.log(`  Actual: ${test.actual}`);
                console.log(`  Result: ${test.actual === test.test.expected ? 'PASS' : 'FAIL'}`);
            });
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
const tester = new EdgeTester();

const config = {
    baseUrl: process.env.VITE_APP_URL || 'https://proptii.azurewebsites.net',
    endpoints: [
        { path: '/', weight: 1 },
        { path: '/api/health', weight: 1 },
        { path: '/assets/js/main.js', weight: 1 },
        { path: '/assets/css/main.css', weight: 1 },
        { path: '/assets/images/logo.png', weight: 1 }
    ],
    edgeLocations: [
        'eastus',
        'westus',
        'northeurope',
        'southeastasia'
    ],
    cacheTestPaths: {
        static: [
            '/assets/js/main.js',
            '/assets/css/main.css',
            '/assets/images/logo.png'
        ],
        dynamic: [
            '/',
            '/about',
            '/contact'
        ],
        api: [
            '/api/health',
            '/api/metrics',
            '/api/status'
        ]
    },
    securityRules: [
        {
            type: 'token',
            path: '/api/secure'
        },
        {
            type: 'ip',
            path: '/admin'
        },
        {
            type: 'geo',
            path: '/restricted'
        },
        {
            type: 'cachePoisoning',
            path: '/'
        }
    ]
};

tester.runEdgeTests(config).catch(console.error); 