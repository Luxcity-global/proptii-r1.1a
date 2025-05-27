import axios from 'axios';
import chalk from 'chalk';
import { ApplicationInsightsCoreClient } from '@azure/applicationinsights-core-js';

const ALERT_THRESHOLDS = {
    responseTime: 1000, // 1 second
    errorRate: 1, // 1%
    memoryUsage: 80, // 80%
    cpuUsage: 70 // 70%
};

async function monitorStagingEnvironment() {
    try {
        const env = process.env;
        console.log(chalk.blue('🔍 Starting staging environment monitoring...'));

        // Initialize Application Insights
        const appInsights = new ApplicationInsightsCoreClient({
            instrumentationKey: env.VITE_AZURE_APP_INSIGHTS_KEY
        });

        // Health check endpoints
        const endpoints = [
            { url: `${env.VITE_API_URL}/health`, name: 'API Health' },
            { url: `${env.VITE_AZURE_STORAGE_URL}/health`, name: 'Storage Health' },
            { url: `${env.VITE_AZURE_CDN_ENDPOINT}/health`, name: 'CDN Health' }
        ];

        // Monitor endpoints
        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                const response = await axios.get(endpoint.url);
                const responseTime = Date.now() - startTime;

                // Check response time
                if (responseTime > ALERT_THRESHOLDS.responseTime) {
                    console.log(chalk.yellow(`⚠️ High response time for ${endpoint.name}: ${responseTime}ms`));
                    await sendAlert('response_time', endpoint.name, responseTime);
                }

                console.log(chalk.green(`✅ ${endpoint.name}: Healthy (${responseTime}ms)`));
            } catch (error) {
                console.error(chalk.red(`❌ ${endpoint.name}: Unhealthy - ${error.message}`));
                await sendAlert('endpoint_failure', endpoint.name, error.message);
            }
        }

        // Monitor error rates
        const errorMetrics = await appInsights.getMetric('exceptions/count');
        const requestMetrics = await appInsights.getMetric('requests/count');
        const errorRate = (errorMetrics / requestMetrics) * 100;

        if (errorRate > ALERT_THRESHOLDS.errorRate) {
            console.log(chalk.yellow(`⚠️ High error rate: ${errorRate.toFixed(2)}%`));
            await sendAlert('error_rate', 'Application', errorRate);
        }

        // Monitor resource usage
        const memoryMetrics = await appInsights.getMetric('performanceCounters/memoryUsedPercentage');
        const cpuMetrics = await appInsights.getMetric('performanceCounters/processCpuPercentage');

        if (memoryMetrics > ALERT_THRESHOLDS.memoryUsage) {
            console.log(chalk.yellow(`⚠️ High memory usage: ${memoryMetrics.toFixed(2)}%`));
            await sendAlert('memory_usage', 'Application', memoryMetrics);
        }

        if (cpuMetrics > ALERT_THRESHOLDS.cpuUsage) {
            console.log(chalk.yellow(`⚠️ High CPU usage: ${cpuMetrics.toFixed(2)}%`));
            await sendAlert('cpu_usage', 'Application', cpuMetrics);
        }

        console.log(chalk.blue('✨ Monitoring check completed'));

    } catch (error) {
        console.error(chalk.red('❌ Monitoring failed:'), error.message);
        process.exit(1);
    }
}

async function sendAlert(type, source, value) {
    // Initialize alert client (you can customize this based on your alert system)
    const alertPayload = {
        type,
        source,
        value,
        environment: 'staging',
        timestamp: new Date().toISOString()
    };

    try {
        // Send to your alert system (e.g., Azure Monitor, custom webhook, etc.)
        await axios.post(process.env.ALERT_WEBHOOK_URL, alertPayload);
        console.log(chalk.yellow(`🔔 Alert sent for ${type} in ${source}`));
    } catch (error) {
        console.error(chalk.red('Failed to send alert:'), error.message);
    }
}

// Run monitoring
monitorStagingEnvironment(); 