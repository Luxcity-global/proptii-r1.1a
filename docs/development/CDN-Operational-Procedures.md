# CDN Operational Procedures

## Table of Contents
1. [Cache Management](#cache-management)
2. [Monitoring Guide](#monitoring-guide)
3. [Troubleshooting](#troubleshooting)

## Cache Management

### Purge Procedures

#### Manual Purge
1. **Azure Portal Method**
   ```bash
   # Navigate to CDN profile
   az cdn endpoint purge \
     --content-paths '/*' \
     --profile-name proptii-cdn-profile \
     --name proptii-cdn-endpoint \
     --resource-group proptii-rg-eastus2
   ```

2. **Selective Purge**
   ```bash
   # Purge specific paths
   az cdn endpoint purge \
     --content-paths '/images/*' '/css/*' \
     --profile-name proptii-cdn-profile \
     --name proptii-cdn-endpoint \
     --resource-group proptii-rg-eastus2
   ```

#### Automated Purge
1. **CI/CD Integration**
   ```yaml
   # GitHub Actions workflow
   name: CDN Purge
   on:
     push:
       branches: [ main ]
   jobs:
     purge:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: azure/login@v1
           with:
             creds: ${{ secrets.AZURE_CREDENTIALS }}
         - run: |
             az cdn endpoint purge \
               --content-paths '/*' \
               --profile-name proptii-cdn-profile \
               --name proptii-cdn-endpoint \
               --resource-group proptii-rg-eastus2
   ```

2. **Scheduled Purge**
   ```yaml
   # Azure Function Timer Trigger
   {
     "bindings": [
       {
         "name": "myTimer",
         "type": "timerTrigger",
         "direction": "in",
         "schedule": "0 0 * * *"  # Daily at midnight
       }
     ]
   }
   ```

#### Emergency Purge
1. **Full Cache Purge**
   ```bash
   # Emergency full purge
   az cdn endpoint purge \
     --content-paths '/*' \
     --profile-name proptii-cdn-profile \
     --name proptii-cdn-endpoint \
     --resource-group proptii-rg-eastus2 \
     --no-wait
   ```

2. **Emergency Response**
   - Execute full purge
   - Notify stakeholders
   - Monitor cache rebuild
   - Verify content delivery

### Update Workflows

#### Content Updates
1. **Static Content**
   - Deploy to origin
   - Trigger selective purge
   - Verify content delivery
   - Monitor cache hit ratio

2. **Dynamic Content**
   - Update origin
   - Purge affected paths
   - Verify cache behavior
   - Check performance metrics

#### Rule Updates
1. **Cache Rules**
   ```bash
   # Update cache rule
   az cdn endpoint rule add \
     --rule-name "CacheStaticAssets" \
     --order 1 \
     --profile-name proptii-cdn-profile \
     --name proptii-cdn-endpoint \
     --resource-group proptii-rg-eastus2 \
     --match-variable UrlFileExtension \
     --operator Contains \
     --match-values ".js" ".css" ".jpg" ".png" \
     --action-name CacheExpiration \
     --cache-behavior Override \
     --cache-duration "7.00:00:00"
   ```

2. **Security Rules**
   ```bash
   # Update WAF rule
   az cdn endpoint rule add \
     --rule-name "SecurityHeaders" \
     --order 1 \
     --profile-name proptii-cdn-profile \
     --name proptii-cdn-endpoint \
     --resource-group proptii-rg-eastus2 \
     --match-variable RequestHeader \
     --operator Contains \
     --match-values "X-Forwarded-For" \
     --action-name ModifyResponseHeader \
     --header-action Append \
     --header-name "X-Frame-Options" \
     --header-value "DENY"
   ```

#### Configuration Changes
1. **Endpoint Updates**
   ```bash
   # Update endpoint settings
   az cdn endpoint update \
     --profile-name proptii-cdn-profile \
     --name proptii-cdn-endpoint \
     --resource-group proptii-rg-eastus2 \
     --enable-compression true \
     --query-string-caching-behavior IgnoreQueryString
   ```

2. **Origin Updates**
   ```bash
   # Update origin settings
   az cdn endpoint update \
     --profile-name proptii-cdn-profile \
     --name proptii-cdn-endpoint \
     --resource-group proptii-rg-eastus2 \
     --origin-host-header "new-origin.example.com" \
     --origin-path "/new-path"
   ```

## Monitoring Guide

### Metric Analysis

#### Performance Metrics
1. **Core Web Vitals**
   - LCP (Largest Contentful Paint)
     - Target: < 2.5s
     - Alert threshold: > 4s
   - FID (First Input Delay)
     - Target: < 100ms
     - Alert threshold: > 300ms
   - CLS (Cumulative Layout Shift)
     - Target: < 0.1
     - Alert threshold: > 0.25

2. **Response Times**
   - Edge to User: < 100ms
   - Origin to Edge: < 500ms
   - Total Response: < 1s

#### Cache Statistics
1. **Hit Ratio**
   - Target: > 90%
   - Alert threshold: < 80%
   - Monitoring interval: 5 minutes

2. **Cache Performance**
   - Cache size utilization
   - Cache eviction rate
   - Cache miss patterns

#### Error Rates
1. **HTTP Status Codes**
   - 4xx errors: < 1%
   - 5xx errors: < 0.1%
   - Alert threshold: > 5%

2. **Error Types**
   - Origin errors
   - Cache errors
   - SSL/TLS errors

### Alert Handling

#### Alert Types
1. **Performance Alerts**
   - High latency
   - Low cache hit ratio
   - High error rate

2. **Security Alerts**
   - WAF triggers
   - DDoS attacks
   - SSL certificate expiry

3. **Operational Alerts**
   - Origin health
   - Cache capacity
   - Rule violations

#### Response Procedures
1. **Critical Alerts**
   - Immediate investigation
   - Team notification
   - Status page update
   - Customer communication

2. **Warning Alerts**
   - Scheduled investigation
   - Performance analysis
   - Trend monitoring
   - Documentation update

#### Escalation Path
1. **Level 1 (On-Call Engineer)**
   - Initial investigation
   - Basic troubleshooting
   - Alert acknowledgment

2. **Level 2 (Senior Engineer)**
   - Deep dive analysis
   - Configuration review
   - Performance optimization

3. **Level 3 (Architecture Team)**
   - Architecture review
   - Capacity planning
   - Long-term solutions

## Troubleshooting

### Common Issues

#### Cache Issues
1. **Cache Misses**
   - Check cache rules
   - Verify origin headers
   - Review cache configuration
   - Analyze request patterns

2. **Stale Content**
   - Verify cache duration
   - Check purge status
   - Review origin updates
   - Monitor cache headers

#### Performance Issues
1. **High Latency**
   - Check origin health
   - Review edge locations
   - Analyze network paths
   - Monitor resource usage

2. **Low Throughput**
   - Check bandwidth limits
   - Review concurrent connections
   - Analyze request patterns
   - Monitor resource utilization

#### Security Issues
1. **WAF Blocks**
   - Review WAF logs
   - Check rule configuration
   - Analyze request patterns
   - Update rule sets

2. **SSL/TLS Issues**
   - Check certificate status
   - Verify protocol versions
   - Review cipher suites
   - Monitor handshake failures

### Diagnostic Steps

#### Performance Diagnostics
1. **Response Time Analysis**
   ```bash
   # Test response time
   curl -w "\nTime: %{time_total}s\n" \
     -H "Host: proptii.co" \
     https://proptii-cdn-endpoint.azureedge.net/
   ```

2. **Cache Status Check**
   ```bash
   # Check cache headers
   curl -I -H "Host: proptii.co" \
     https://proptii-cdn-endpoint.azureedge.net/
   ```

#### Security Diagnostics
1. **SSL/TLS Check**
   ```bash
   # Test SSL configuration
   openssl s_client -connect proptii-cdn-endpoint.azureedge.net:443 \
     -servername proptii.co
   ```

2. **WAF Test**
   ```bash
   # Test WAF rules
   curl -H "Host: proptii.co" \
     "https://proptii-cdn-endpoint.azureedge.net/?exec=/bin/bash"
   ```

### Resolution Procedures

#### Cache Resolution
1. **Cache Rebuild**
   - Purge affected content
   - Monitor cache population
   - Verify content delivery
   - Check performance metrics

2. **Rule Adjustment**
   - Review current rules
   - Update rule configuration
   - Test rule changes
   - Monitor impact

#### Performance Resolution
1. **Optimization**
   - Review compression settings
   - Check caching rules
   - Optimize content delivery
   - Monitor improvements

2. **Scaling**
   - Review capacity limits
   - Adjust scaling rules
   - Monitor resource usage
   - Plan for growth

#### Security Resolution
1. **WAF Updates**
   - Review blocked requests
   - Update rule sets
   - Test rule changes
   - Monitor impact

2. **SSL/TLS Updates**
   - Renew certificates
   - Update protocols
   - Test configurations
   - Monitor security 