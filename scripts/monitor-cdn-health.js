import { DefaultAzureCredential } from '@azure/identity';
import { CdnManagementClient } from '@azure/arm-cdn';
import { ApplicationInsightsClient } from '@azure/applicationinsights';
import chalk from 'chalk';
import axios from 'axios';

const ALERT_THRESHOLDS = {
    responseTime: 1000, // 1 second
    errorRate: 1, // 1%
    cacheHitRatio: 80, // 80%
    bandwidth: 1000000 // 1 Mbps
};

const monitorCDNHealth = async () => {
    try {
        console.log(chalk.blue('🔍 Starting CDN health monitoring...'));

        const credential = new DefaultAzureCredential();
        const cdnClient = new CdnManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);
        const appInsightsClient = new ApplicationInsightsClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

        const resourceGroupName = process.env.RESOURCE_GROUP_NAME;
        const profileName = process.env.CDN_PROFILE_NAME;
        const endpointName = process.env.CDN_ENDPOINT_NAME;

        // Get CDN endpoint metrics
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
        if (cacheHitRatio < ALERT_THRESHOLDS.cacheHitRatio) {
            console.log(chalk.yellow(`⚠️ Low cache hit ratio: ${cacheHitRatio}%`));
            await sendAlert('cache_hit_ratio', cacheHitRatio);
        }

        // Check bandwidth usage
        const bandwidth = metrics.find(m => m.name === 'BandWidth')?.value || 0;
        if (bandwidth > ALERT_THRESHOLDS.bandwidth) {
            console.log(chalk.yellow(`⚠️ High bandwidth usage: ${bandwidth} bps`));
            await sendAlert('bandwidth_usage', bandwidth);
        }

        // Check endpoint health
        const healthStatus = await cdnClient.endpoints.getHealth(
            resourceGroupName,
            profileName,
            endpointName
        );

        if (healthStatus.status !== 'Healthy') {
            console.log(chalk.red(`❌ Endpoint health check failed: ${healthStatus.status}`));
            await sendAlert('endpoint_health', healthStatus.status);
        }

        // Monitor custom domains
        const customDomains = await cdnClient.customDomains.listByEndpoint(
            resourceGroupName,
            profileName,
            endpointName
        );

        for (const domain of customDomains) {
            const domainHealth = await cdnClient.customDomains.getHealth(
                resourceGroupName,
                profileName,
                endpointName,
                domain.name
            );

            if (domainHealth.status !== 'Healthy') {
                console.log(chalk.red(`❌ Custom domain health check failed for ${domain.name}: ${domainHealth.status}`));
                await sendAlert('custom_domain_health', { domain: domain.name, status: domainHealth.status });
            }
        }

        // Check SSL certificate expiration
        for (const domain of customDomains) {
            const sslStatus = await cdnClient.customDomains.getSslStatus(
                resourceGroupName,
                profileName,
                endpointName,
                domain.name
            );

            if (sslStatus.certificateExpirationDate) {
                const daysUntilExpiration = Math.ceil((new Date(sslStatus.certificateExpirationDate) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysUntilExpiration < 30) {
                    console.log(chalk.yellow(`⚠️ SSL certificate for ${domain.name} expires in ${daysUntilExpiration} days`));
                    await sendAlert('ssl_expiration', { domain: domain.name, daysUntilExpiration });
                }
            }
        }

        // Log metrics to Application Insights
        await appInsightsClient.metrics.add({
            metrics: [
                {
                    name: 'CDN.CacheHitRatio',
                    value: cacheHitRatio,
                    timestamp: new Date()
                },
                {
                    name: 'CDN.Bandwidth',
                    value: bandwidth,
                    timestamp: new Date()
                }
            ]
        });

        console.log(chalk.green('✅ CDN health monitoring completed successfully!'));
        console.log(chalk.blue('📝 Monitoring results:'));
        console.log(chalk.blue(`   - Cache hit ratio: ${cacheHitRatio}%`));
        console.log(chalk.blue(`   - Bandwidth usage: ${bandwidth} bps`));
        console.log(chalk.blue(`   - Endpoint health: ${healthStatus.status}`));
        console.log(chalk.blue(`   - Custom domains: ${customDomains.length} checked`));

    } catch (error) {
        console.error(chalk.red('❌ CDN health monitoring failed:'), error.message);
        process.exit(1);
    }
};

const sendAlert = async (type, data) => {
    try {
        await axios.post(process.env.ALERT_WEBHOOK_URL, {
            type,
            data,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
        });
    } catch (error) {
        console.error(chalk.red('❌ Failed to send alert:'), error.message);
    }
};

monitorCDNHealth(); 