// SVG Icons for Quality of Life Map Web App
// Phase 2: Enhanced Marker System with custom SVG icons

// SVG icon definitions for each service category
const SERVICE_ICONS = {
    transport: {
        default: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            <circle cx="12" cy="9" r="1"/>
            <path d="M8 15h8l-1 2H9l-1-2z"/>
        </svg>`,
        bus: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>`,
        train: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2H18v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2.5-7H5V6h14v4z"/>
        </svg>`,
        subway: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8 2 5 4.57 5 8v8c0 2.21 1.79 4 4 4v1c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1c2.21 0 4-1.79 4-4V8c0-3.43-3-6-8-6zm-3.5 15c-.83 0-1.5-.67-1.5-1.5S7.67 14 8.5 14s1.5.67 1.5 1.5S9.33 17 8.5 17zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2.5-7H6V6c0-1.66 1.34-3 3-3h6c1.66 0 3 1.34 3 3v4z"/>
        </svg>`
    },
    
    education: {
        default: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
        </svg>`,
        school: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
        </svg>`,
        university: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            <circle cx="12" cy="10" r="1"/>
        </svg>`,
        library: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
        </svg>`
    },
    
    social: {
        default: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>`,
        park: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.87c.03-.1.06-.21.1-.31C8.18 14.26 11.22 9 16 9c-3.19-1.22-4.76-3.53-4.76-3.53S13.24 7.69 16 9z"/>
            <path d="M12.76 7.47S11.19 5.16 8 6.38c4.78 0 7.82 5.26 10.24 9.82.04.1.07.21.1.31l.95 2.87 1.89-.66C18.1 16.17 16 10 16 10s-1.57-2.53-3.24-2.53z"/>
        </svg>`,
        gym: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
        </svg>`,
        museum: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 11V9L12 2 2 9v2h2v9H2v2h20v-2h-2v-9h2zm-4 9H6V9h12v11z"/>
            <path d="M10 14h2v-3h-2v3zm-2 0h1v-3H8v3zm5 0h1v-3h-1v3zm2 0h2v-3h-2v3z"/>
        </svg>`
    },
    
    healthcare: {
        default: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3z"/>
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>
            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5h-1.5V16H9v-1.5H7.5V13H9v-1.5h1.5V13H12v1.5h-1.5V16z"/>
        </svg>`,
        hospital: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3z"/>
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>
            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 8h-3v3h-2v-3h-3V8h3V5h2v3h3v2z"/>
        </svg>`,
        pharmacy: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 5h-2.64l1.14-3.14L17.15 1l-1.46 4H3v2l2 6-2 6v2h18v-2l-2-6 2-6V5zm-5 9h-3v3h-2v-3H8v-2h3V9h2v3h3v2z"/>
        </svg>`,
        dentist: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1C10.34 1 9 2.34 9 4v1c0 .55.45 1 1 1s1-.45 1-1V4c0-.55.45-1 1-1s1 .45 1 1v1c0 .55.45 1 1 1s1-.45 1-1V4c0-1.66-1.34-3-3-3z"/>
            <path d="M21 10c0-1.1-.9-2-2-2h-1V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v2H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8zm-3 0v8H6v-8h12z"/>
        </svg>`
    },
    
    essential: {
        default: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7h-3V6c0-1.1-.9-2-2-2H10c-1.1 0-2 .9-2 2v1H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 6h4v1h-4V6zm9 13H5V9h14v10z"/>
            <path d="M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>`,
        police: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5H16.3V16.3H7.7V11.5H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V11.5H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z"/>
        </svg>`,
        fire_station: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C13.75,2 16,3 16,5.5C16,6.38 15.75,7.13 15.36,7.75L15.91,8.3C16.57,8.96 17,9.84 17,10.73C17,11.5 16.75,12.25 16.25,12.83L12,17.08L7.75,12.83C7.25,12.25 7,11.5 7,10.73C7,9.84 7.43,8.96 8.09,8.3L8.64,7.75C8.25,7.13 8,6.38 8,5.5C8,3 10.25,2 12,2M12,6A1.5,1.5 0 0,0 10.5,7.5A1.5,1.5 0 0,0 12,9A1.5,1.5 0 0,0 13.5,7.5A1.5,1.5 0 0,0 12,6M8.5,18H15.5V19.5C15.5,20.33 14.83,21 14,21H10C9.17,21 8.5,20.33 8.5,19.5V18Z"/>
        </svg>`,
        bank: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.5 1L2 6v2h20V6m-8 3v7h3v-7m-7 0v7h3v-7m-7 0v7h3v-7M2 17v4h20v-4H2Z"/>
        </svg>`,
        grocery: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
        </svg>`
    }
};

// Utility class for generating SVG icons with dynamic properties
class ServiceIconGenerator {
    constructor() {
        this.baseSize = 24;
        this.cache = new Map();
    }

    // Generate SVG icon URL for a service marker
    generateIconURL(category, serviceType = 'default', options = {}) {
        const {
            size = this.baseSize,
            color = CONFIG.SERVICE_CATEGORIES[category]?.color || '#666666',
            quality = 1.0, // 0-1 quality factor
            selected = false
        } = options;

        const cacheKey = `${category}-${serviceType}-${size}-${color}-${quality}-${selected}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const iconSVG = this.getIconSVG(category, serviceType);
        const finalSize = this.calculateSize(size, quality);
        const finalColor = selected ? this.lightenColor(color, 20) : color;
        const opacity = Math.max(0.6, quality);

        const svgString = this.createSVGString(iconSVG, finalSize, finalColor, opacity, selected);
        const dataURL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;
        
        this.cache.set(cacheKey, dataURL);
        return dataURL;
    }

    // Get the appropriate SVG icon for category and type
    getIconSVG(category, serviceType) {
        const categoryIcons = SERVICE_ICONS[category];
        if (!categoryIcons) return SERVICE_ICONS.essential.default;
        
        return categoryIcons[serviceType] || categoryIcons.default;
    }

    // Calculate icon size based on quality rating
    calculateSize(baseSize, quality) {
        const minSize = baseSize * 0.7;
        const maxSize = baseSize * 1.3;
        return Math.round(minSize + (maxSize - minSize) * quality);
    }

    // Create complete SVG string with styling
    createSVGString(iconPath, size, color, opacity, selected) {
        const strokeWidth = selected ? 3 : 2;
        const strokeColor = selected ? '#ffffff' : color;
        
        return `
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <dropShadow dx="1" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
                    </filter>
                </defs>
                <circle cx="12" cy="12" r="11" fill="${color}" opacity="${opacity}" 
                        stroke="${strokeColor}" stroke-width="${strokeWidth}" filter="url(#shadow)"/>
                <g transform="scale(0.7) translate(3.6, 3.6)" fill="white">
                    ${iconPath}
                </g>
            </svg>
        `.trim();
    }

    // Utility function to lighten a color
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    // Get icon for clustering based on services in cluster
    getClusterIcon(services, size = 40) {
        // Count services by category
        const categoryCounts = {};
        services.forEach(service => {
            const category = service.category || 'essential';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        // Find dominant category
        const dominantCategory = Object.entries(categoryCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'essential';

        const color = CONFIG.SERVICE_CATEGORIES[dominantCategory]?.color || '#666666';
        const serviceCount = services.length;
        
        return this.createClusterSVG(serviceCount, color, size);
    }

    // Create cluster marker SVG
    createClusterSVG(count, color, size) {
        const fontSize = Math.max(10, size / 3);
        const text = count > 99 ? '99+' : count.toString();
        
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <dropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.4)"/>
                    </filter>
                </defs>
                <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" 
                        stroke="white" stroke-width="3" filter="url(#shadow)"/>
                <text x="${size/2}" y="${size/2 + fontSize/3}" text-anchor="middle" 
                      font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white">
                    ${text}
                </text>
            </svg>
        `)}`;
    }

    // Clear icon cache
    clearCache() {
        this.cache.clear();
    }

    // Get cache statistics
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export for browser environment
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        SERVICE_ICONS,
        ServiceIconGenerator
    };
} else {
    // Browser environment - make available globally
    window.SERVICE_ICONS = SERVICE_ICONS;
    window.ServiceIconGenerator = ServiceIconGenerator;
}
