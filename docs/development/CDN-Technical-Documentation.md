# CDN Technical Documentation

## Table of Contents
1. [CDN Configuration](#cdn-configuration)
2. [Asset Management](#asset-management)
3. [Security Documentation](#security-documentation)

## CDN Configuration

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

### SSL/TLS Setup
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

## Asset Management

### Organization Structure
```
assets/
├── images/
│   ├── logos/
│   ├── icons/
│   └── backgrounds/
├── fonts/
│   ├── primary/
│   └── secondary/
├── media/
│   ├── videos/
│   └── audio/
└── static/
    ├── css/
    ├── js/
    └── json/
```

### Naming Conventions
1. **Images**
   - Format: `[type]-[name]-[size].[ext]`
   - Example: `logo-primary-200x200.png`

2. **Fonts**
   - Format: `[family]-[weight]-[style].[ext]`
   - Example: `roboto-regular-normal.woff2`

3. **Media Files**
   - Format: `[type]-[name]-[quality].[ext]`
   - Example: `video-intro-720p.mp4`

### Version Control
1. **Asset Versioning**
   - Use semantic versioning for assets
   - Format: `[name]-v[major].[minor].[patch].[ext]`
   - Example: `main-v1.2.3.js`

2. **Cache Busting**
   - Use query parameters for cache busting
   - Format: `?v=[version]`
   - Example: `main.js?v=1.2.3`

### Optimization Guidelines
1. **Image Optimization**
   - Use WebP format with fallback
   - Implement responsive images
   - Lazy load non-critical images
   - Use appropriate compression

2. **Font Optimization**
   - Use WOFF2 format
   - Implement font subsetting
   - Use font-display: swap
   - Preload critical fonts

3. **Code Optimization**
   - Minify all code files
   - Use code splitting
   - Implement tree shaking
   - Enable compression

## Security Documentation

### WAF Configuration
1. **OWASP Core Rule Set**
   - Enabled rules: All
   - Blocking mode: Enabled
   - Logging: Enabled

2. **Custom Rules**
   - SQL Injection protection
   - XSS protection
   - Path traversal protection
   - File upload restrictions

### Access Control
1. **Geo-filtering**
   - Allowed countries: US, CA, GB, AU, NZ
   - Blocked countries: None
   - Regional restrictions: Configured

2. **IP Restrictions**
   - Allowed IP ranges: [See Security Configuration]
   - Blocked IP ranges: [See Security Configuration]
   - Custom rules: Configured

3. **Token Authentication**
   - Required for: API endpoints
   - Token expiration: 1 hour
   - Custom headers: X-Custom-Auth, X-API-Key

### Security Policies
1. **Content Security Policy**
   ```http
   Content-Security-Policy: 
     default-src 'self';
     script-src 'self' 'unsafe-inline' 'unsafe-eval';
     style-src 'self' 'unsafe-inline';
     img-src 'self' data: https:;
     font-src 'self' https:;
     connect-src 'self' https:;
     frame-ancestors 'none';
     form-action 'self';
   ```

2. **Security Headers**
   ```http
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   Referrer-Policy: strict-origin-when-cross-origin
   Permissions-Policy: camera=(), microphone=(), geolocation=()
   ```

3. **Rate Limiting**
   - Requests per minute: 1000
   - Burst limit: 100
   - Block duration: 1 hour

### Emergency Procedures
1. **Security Breach**
   - Immediate cache purge
   - Enable maintenance mode
   - Contact security team
   - Review access logs

2. **Performance Issues**
   - Check cache hit ratio
   - Verify origin health
   - Review error rates
   - Adjust cache rules

3. **Configuration Issues**
   - Rollback to last known good configuration
   - Verify rule changes
   - Check endpoint status
   - Review monitoring metrics 