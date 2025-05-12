import axios from 'axios';
import chalk from 'chalk';
import { performance } from 'perf_hooks';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import os from 'os';
import v8 from 'v8';

class LoadTester {
    constructor() {
        this.metrics = {
            responseTimes: [],
            errorRates: {},
            throughput: 0,
            resourceUsage: {
                memory: [],
                cpu: [],
                network: []
            }
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

        // Initialize resource monitoring
        this.startResourceMonitoring();
    }

    startResourceMonitoring() {
        this.resourceInterval = setInterval(() => {
            const memoryUsage = process.memoryUsage();
            const cpuUsage = os.loadavg();
            const networkStats = os.networkInterfaces();

            this.metrics.resourceUsage.memory.push({
                timestamp: Date.now(),
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                rss: memoryUsage.rss,
                external: memoryUsage.external
            });

            this.metrics.resourceUsage.cpu.push({
                timestamp: Date.now(),
                load1: cpuUsage[0],
                load5: cpuUsage[1],
                load15: cpuUsage[2]
            });

            this.trackMetric('MemoryUsage', memoryUsage.heapUsed / 1024 / 1024, {
                type: 'heapUsed',
                unit: 'MB'
            });

            this.trackMetric('CPUUsage', cpuUsage[0], {
                type: 'load1'
            });
        }, 1000);
    }

    async runLoadTest(config) {
        const {
            baseUrl,
            endpoints,
            concurrentUsers,
            duration,
            rampUpTime
        } = config;

        console.log(chalk.blue('\n🚀 Starting Load Test...'));
        console.log(`Base URL: ${baseUrl}`);
        console.log(`Concurrent Users: ${concurrentUsers}`);
        console.log(`Duration: ${duration} seconds`);
        console.log(`Ramp-up Time: ${rampUpTime} seconds`);

        const startTime = Date.now();
        const endTime = startTime + (duration * 1000);
        const rampUpEndTime = startTime + (rampUpTime * 1000);

        // Initialize users gradually
        const users = Array(concurrentUsers).fill(null).map((_, index) => ({
            id: index + 1,
            startTime: startTime + (index * (rampUpTime * 1000) / concurrentUsers)
        }));

        // Run test scenarios
        await this.runStressTest(baseUrl, endpoints, users, endTime);
        await this.runPeakLoadTest(baseUrl, endpoints, concurrentUsers, endTime);
        await this.collectMetrics();

        // Stop resource monitoring
        clearInterval(this.resourceInterval);

        // Generate report
        this.generateReport();
    }

    async runStressTest(baseUrl, endpoints, users, endTime) {
        console.log(chalk.yellow('\n📊 Running Stress Test...'));

        const requests = users.map(user => {
            return new Promise(async (resolve) => {
                while (Date.now() < endTime) {
                    const endpoint = this.selectEndpoint(endpoints);
                    try {
                        await this.makeRequest(baseUrl, endpoint, user.id);
                        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between requests
                    } catch (error) {
                        console.error(chalk.red(`Error for user ${user.id}: ${error.message}`));
                    }
                }
                resolve();
            });
        });

        await Promise.all(requests);
    }

    async runPeakLoadTest(baseUrl, endpoints, concurrentUsers, endTime) {
        console.log(chalk.yellow('\n📈 Running Peak Load Test...'));

        const requests = Array(concurrentUsers).fill(null).map((_, index) => {
            return new Promise(async (resolve) => {
                while (Date.now() < endTime) {
                    const endpoint = this.selectEndpoint(endpoints);
                    try {
                        await this.makeRequest(baseUrl, endpoint, index + 1);
                    } catch (error) {
                        console.error(chalk.red(`Error in peak load test: ${error.message}`));
                    }
                }
                resolve();
            });
        });

        await Promise.all(requests);
    }

    selectEndpoint(endpoints) {
        const totalWeight = endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
        let random = Math.random() * totalWeight;

        for (const endpoint of endpoints) {
            random -= endpoint.weight;
            if (random <= 0) {
                return endpoint;
            }
        }

        return endpoints[0];
    }

    async makeRequest(baseUrl, endpoint, userId) {
        const startTime = performance.now();
        try {
            const response = await axios.get(`${baseUrl}${endpoint.path}`, {
                headers: {
                    'User-Agent': `LoadTest-User-${userId}`,
                    'Accept-Encoding': 'gzip, deflate, br'
                },
                timeout: 5000
            });

            const duration = performance.now() - startTime;
            this.metrics.responseTimes.push({
                endpoint: endpoint.path,
                duration,
                status: response.status
            });

            this.trackMetric('ResponseTime', duration, {
                endpoint: endpoint.path,
                status: response.status
            });

            return response;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.errorRates.push({
                endpoint: endpoint.path,
                error: error.message,
                duration
            });

            this.trackMetric('ErrorRate', 1, {
                endpoint: endpoint.path,
                error: error.message
            });

            throw error;
        }
    }

    async collectMetrics() {
        console.log(chalk.blue('\n📊 Collecting Metrics...'));

        // Calculate average response time
        const avgResponseTime = this.metrics.responseTimes.reduce((acc, curr) => acc + curr.duration, 0) /
            this.metrics.responseTimes.length;

        // Calculate error rate
        const errorRate = this.metrics.errorRates.length /
            (this.metrics.responseTimes.length + this.metrics.errorRates.length);

        // Calculate resource usage statistics
        const memoryStats = this.calculateResourceStats(this.metrics.resourceUsage.memory, 'heapUsed');
        const cpuStats = this.calculateResourceStats(this.metrics.resourceUsage.cpu, 'load1');

        // Track metrics in Application Insights
        this.trackMetric('AverageResponseTime', avgResponseTime);
        this.trackMetric('ErrorRate', errorRate);
        this.trackMetric('TotalRequests', this.metrics.responseTimes.length);
        this.trackMetric('FailedRequests', this.metrics.errorRates.length);
        this.trackMetric('MemoryUsage', memoryStats.average, { type: 'average' });
        this.trackMetric('CPUUsage', cpuStats.average, { type: 'average' });
    }

    calculateResourceStats(data, key) {
        const values = data.map(item => item[key]);
        return {
            average: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            p95: this.calculatePercentile(values, 95)
        };
    }

    calculatePercentile(values, percentile) {
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    trackMetric(name, value, properties = {}) {
        if (this.appInsights) {
            this.appInsights.trackMetric({
                name: `LoadTest.${name}`,
                average: value,
                properties: {
                    ...properties,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    generateReport() {
        console.log(chalk.green('\n📋 Load Test Report'));
        console.log('='.repeat(50));

        // Response Time Statistics
        if (this.metrics.responseTimes.length > 0) {
            const responseTimes = this.metrics.responseTimes.map(r => r.duration);
            console.log(chalk.blue('\nResponse Time Statistics:'));
            console.log(`Average: ${this.calculateAverage(responseTimes).toFixed(2)}ms`);
            console.log(`Min: ${Math.min(...responseTimes).toFixed(2)}ms`);
            console.log(`Max: ${Math.max(...responseTimes).toFixed(2)}ms`);
            console.log(`95th Percentile: ${this.calculatePercentile(responseTimes, 95).toFixed(2)}ms`);
        } else {
            console.log(chalk.yellow('\nNo response time data available'));
        }

        // Error Statistics
        console.log(chalk.blue('\nError Statistics:'));
        console.log(`Total Requests: ${this.metrics.responseTimes.length}`);
        console.log(`Failed Requests: ${this.metrics.errorRates.length}`);
        console.log(`Error Rate: ${((this.metrics.errorRates.length / this.metrics.responseTimes.length) * 100).toFixed(2)}%`);

        // Resource Usage Statistics
        console.log(chalk.blue('\nResource Usage Statistics:'));
        const memoryStats = this.calculateResourceStats(this.metrics.resourceUsage.memory, 'heapUsed');
        const cpuStats = this.calculateResourceStats(this.metrics.resourceUsage.cpu, 'load1');

        console.log('\nMemory Usage:');
        console.log(`Average: ${(memoryStats.average / 1024 / 1024).toFixed(2)}MB`);
        console.log(`Peak: ${(memoryStats.max / 1024 / 1024).toFixed(2)}MB`);

        console.log('\nCPU Usage:');
        console.log(`Average Load: ${cpuStats.average.toFixed(2)}`);
        console.log(`Peak Load: ${cpuStats.max.toFixed(2)}`);

        // Endpoint-specific Statistics
        console.log(chalk.blue('\nEndpoint-specific Statistics:'));
        const endpointStats = this.calculateEndpointStats();
        Object.entries(endpointStats).forEach(([endpoint, stats]) => {
            console.log(`\n${endpoint}:`);
            console.log(`Requests: ${stats.requests}`);
            console.log(`Average Response Time: ${stats.avgResponseTime.toFixed(2)}ms`);
            console.log(`Error Rate: ${(stats.errorRate * 100).toFixed(2)}%`);
        });
    }

    calculateAverage(values) {
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    calculateEndpointStats() {
        const stats = {};

        this.metrics.responseTimes.forEach(metric => {
            if (!stats[metric.endpoint]) {
                stats[metric.endpoint] = {
                    requests: 0,
                    totalResponseTime: 0,
                    errors: 0
                };
            }
            stats[metric.endpoint].requests++;
            stats[metric.endpoint].totalResponseTime += metric.duration;
        });

        this.metrics.errorRates.forEach(metric => {
            if (!stats[metric.endpoint]) {
                stats[metric.endpoint] = {
                    requests: 0,
                    totalResponseTime: 0,
                    errors: 0
                };
            }
            stats[metric.endpoint].errors++;
        });

        return Object.entries(stats).reduce((acc, [endpoint, data]) => {
            acc[endpoint] = {
                requests: data.requests,
                avgResponseTime: data.totalResponseTime / data.requests,
                errorRate: data.errors / (data.requests + data.errors)
            };
            return acc;
        }, {});
    }
}

// Example usage
const tester = new LoadTester();

const config = {
    baseUrl: process.env.VITE_APP_URL || 'https://proptii.azurewebsites.net',
    endpoints: [
        { path: '/', weight: 1 },
        { path: '/api/health', weight: 1 },
        { path: '/assets/js/main.js', weight: 1 },
        { path: '/assets/css/main.css', weight: 1 },
        { path: '/assets/images/logo.png', weight: 1 }
    ],
    loadConfig: {
        concurrentUsers: 10,
        duration: 60, // 1 minute
        rampUpTime: 10 // 10 seconds
    }
};

tester.runLoadTest(config).catch(console.error); 