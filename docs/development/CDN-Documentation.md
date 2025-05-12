# Azure CDN Documentation

## Table of Contents
1. [Configuration Documentation](#configuration-documentation)
2. [Operational Guide](#operational-guide)
3. [Monitoring Guide](#monitoring-guide)
4. [Troubleshooting](#troubleshooting)
5. [Rule Management](#rule-management)
6. [Emergency Procedures](#emergency-procedures)

## Configuration Documentation

### Profile Settings
- **Profile Name**: proptii-cdn-profile
- **Resource Group**: proptii-rg-eastus2
- **Pricing Tier**: Standard Microsoft
- **Region**: Global

### Endpoint Configuration
- **Endpoint Name**: proptii-cdn-endpoint
- **Origin Type**: Static Web App
- **Origin Hostname**: [Static Web App URL]
- **Origin Path**: /

### SSL Setup Details
- **Custom Domain**: proptii.co
- **SSL Certificate**: Managed by Azure CDN
- **Minimum TLS Version**: TLS 1.2
- **HTTPS Redirection**: Enabled
- **Security Headers**:
  - HSTS: max-age=31536000; includeSubDomains; preload
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Content-Security-Policy: [See Security Rules section]

## Rule Management

### Cache Rules
1. **Static Assets** (7 days cache)
   - File extensions: .js, .css, .jpg, .jpeg, .png, .gif, .svg, .woff, .woff2
   - Cache behavior: Override
   - Cache duration: 7 days

2. **Font Files** (30 days cache)
   - File extensions: .woff, .woff2, .ttf, .eot
   - Cache behavior: Override
   - Cache duration: 30 days

3. **Media Files** (1 day cache)
   - File extensions: .mp4, .webm, .mp3, .aac, .ogg
   - Cache behavior: Override
   - Cache duration: 1 day

4. **Dynamic Content** (5 minutes cache)
   - File extensions: .html, .json
   - Cache behavior: Override
   - Cache duration: 5 minutes

### Optimization Rules
1. **Compression**
   - Enabled for: text/html, text/css, text/javascript, application/javascript
   - Minimum size: 1KB
   - Maximum size: 10MB
   - Compression ratio target: 70%

2. **Minification**
   - HTML: Remove comments and whitespace
   - CSS: Remove comments and combine rules
   - JavaScript: Remove comments and whitespace

3. **Image Optimization**
   - WebP conversion enabled
   - JPEG optimization: quality 85%
   - PNG optimization: lossless compression
   - Strip metadata enabled

### Security Rules
1. **Access Control**
   - Geo-filtering: [See Security Configuration]
   - IP restrictions: [See Security Configuration]
   - Token authentication: [See Security Configuration]

2. **WAF Rules**
   - DDoS protection enabled
   - Rate limiting configured
   - Bot protection active
   - OWASP core rule set enabled

3. **Security Headers**
   - HSTS: max-age=31536000; includeSubDomains; preload
   - CSP: [See Security Configuration]
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: [See Security Configuration]

## Operational Guide

### Cache Management
The CDN is configured with the following caching rules:

1. **Static Assets** (7 days cache)
   - File extensions: .js, .css, .jpg, .jpeg, .png, .gif, .svg, .woff, .woff2
   - Cache behavior: Override
   - Cache duration: 7 days

2. **HTML Files** (5 minutes cache)
   - File extensions: .html
   - Cache behavior: Override
   - Cache duration: 5 minutes

### Purge Procedures
To purge the CDN cache, use one of the following methods:

1. **Using npm script**:
```bash
npm run cdn:purge
```

2. **Using Azure CLI**:
```bash
az cdn endpoint purge --content-paths "/*" --profile-name proptii-cdn-profile --name proptii-cdn-endpoint --resource-group proptii-rg-eastus2
```

3. **Selective Purge**:
```bash
# Purge specific paths
az cdn endpoint purge --content-paths "/assets/*" "/images/*" --profile-name proptii-cdn-profile --name proptii-cdn-endpoint --resource-group proptii-rg-eastus2
```

### Configuration Scripts
The following npm scripts are available for CDN management:

```bash
# Configure CDN
npm run configure:cdn

# Configure CDN security
npm run configure:cdn-security

# Configure CDN SSL
npm run configure:cdn-ssl

# Configure CDN endpoint
npm run configure:cdn-endpoint

# Monitor CDN health
npm run monitor:cdn

# Verify CDN setup
npm run verify:cdn

# Validate CDN rules
npm run validate:cdn-rules
```

## Emergency Procedures

### Critical Issues
1. **CDN Outage**
   - Contact: Azure CDN Support
   - Action: Enable fallback to origin
   - Command: `npm run cdn:fallback`

2. **Security Breach**
   - Contact: Security Team
   - Action: Purge cache and enable maintenance mode
   - Command: `npm run cdn:maintenance`

3. **Performance Degradation**
   - Contact: DevOps Lead
   - Action: Check metrics and adjust rules
   - Command: `npm run monitor:cdn`

### Rollback Procedures
1. **Configuration Rollback**
```bash
# Rollback to last known good configuration
npm run cdn:rollback
```

2. **Rule Rollback**
```bash
# Rollback specific rule changes
npm run cdn:rollback-rules
```

## Monitoring Guide

### Health Monitoring
The CDN health is monitored using the following metrics:

1. **Cache Hit Ratio**
   - Threshold: 80%
   - Alert: Triggered when below threshold
   - Monitoring: Every 5 minutes

2. **Response Time**
   - Threshold: 1000ms
   - Alert: Triggered when above threshold
   - Monitoring: Every 5 minutes

3. **Error Rate**
   - Threshold: 1%
   - Alert: Triggered when above threshold
   - Monitoring: Every 5 minutes

4. **Bandwidth Usage**
   - Threshold: 1 Mbps
   - Alert: Triggered when above threshold
   - Monitoring: Every 5 minutes

### SSL Certificate Monitoring
- Certificate expiration is monitored
- Alerts are triggered 30 days before expiration
- Automatic renewal is enabled

### Performance Metrics
The following metrics are collected and logged to Application Insights:

1. **CDN.CacheHitRatio**
   - Type: Percentage
   - Collection: Every 5 minutes

2. **CDN.Bandwidth**
   - Type: Bits per second
   - Collection: Every 5 minutes

3. **CDN.ResponseTime**
   - Type: Milliseconds
   - Collection: Every 5 minutes

## Troubleshooting

### Common Issues

1. **Endpoint Configuration**
   - **Issue**: Origin connectivity problems
   - **Solution**: Verify origin hostname and credentials
   - **Command**: `npm run verify:cdn`

2. **SSL Problems**
   - **Issue**: Certificate validation failures
   - **Solution**: Check SSL status and domain verification
   - **Command**: `npm run configure:cdn-ssl`

3. **Cache Issues**
   - **Issue**: Stale content
   - **Solution**: Purge cache
   - **Command**: `npm run cdn:purge`

4. **Performance Issues**
   - **Issue**: High response times
   - **Solution**: Check metrics and edge locations
   - **Command**: `npm run monitor:cdn`

### Emergency Contacts
- Azure CDN Support: [Contact Details]
- Security Team: [Contact Details]
- DevOps Lead: [Contact Details]

## Next Steps
1. Regular monitoring of CDN metrics
2. Performance review scheduling
3. Cache optimization based on usage patterns
4. Security policy updates as needed 