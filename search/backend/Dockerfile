# Use Node.js LTS with full system packages
FROM node:20-bullseye

# Install system dependencies required for Chromium/Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    libdrm2 \
    libxkbcommon0 \
    libgbm-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL Node dependencies (including devDependencies for build)
RUN npm ci

# Install Playwright browsers with system dependencies BEFORE copying source
# This is cached better and Playwright needs the dependencies
RUN npx playwright install --with-deps chromium

# Install Puppeteer Chrome browser
RUN npx puppeteer browsers install chrome || npx @puppeteer/browsers install chrome@stable || echo "Puppeteer install completed"

# Copy application source
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Set environment variables for browser paths
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
ENV PUPPETEER_CACHE_DIR=/root/.cache/puppeteer
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]

