// Advanced Data Visualization for Quality of Life Map - Phase 4
// Implements service density heatmaps, interactive charts, and enhanced visualizations

// Service Density Heatmap Manager
class ServiceDensityHeatmap {
    constructor(map) {
        this.map = map;
        this.canvas = null;
        this.context = null;
        this.heatmapData = {};
        this.currentCategory = null;
        this.isVisible = false;
        this.gridSize = 50; // Grid cell size in pixels
        this.maxDensity = 0;
        this.colorSchemes = {
            hot: ['rgba(0,0,255,0)', 'rgba(0,255,0,0.3)', 'rgba(255,255,0,0.5)', 'rgba(255,0,0,0.7)'],
            cool: ['rgba(0,0,255,0)', 'rgba(0,255,255,0.3)', 'rgba(0,255,0,0.5)', 'rgba(0,0,255,0.7)'],
            viridis: ['rgba(68,1,84,0)', 'rgba(59,82,139,0.3)', 'rgba(33,145,140,0.5)', 'rgba(94,201,98,0.7)'],
            plasma: ['rgba(13,8,135,0)', 'rgba(126,3,168,0.3)', 'rgba(203,70,121,0.5)', 'rgba(240,249,33,0.7)']
        };
        this.currentColorScheme = 'hot';
        
        this.initializeCanvas();
        this.setupEventListeners();
    }

    // Initialize canvas overlay
    initializeCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1';
        this.canvas.id = 'heatmap-canvas';
        
        this.context = this.canvas.getContext('2d');
        
        // Add canvas to map container
        const mapContainer = this.map.getDiv();
        mapContainer.appendChild(this.canvas);
        
        this.resizeCanvas();
    }

    // Setup map event listeners
    setupEventListeners() {
        // Redraw heatmap on map changes
        this.map.addListener('bounds_changed', () => {
            if (this.isVisible) {
                this.debounceRedraw();
            }
        });

        this.map.addListener('zoom_changed', () => {
            if (this.isVisible) {
                this.resizeCanvas();
                this.debounceRedraw();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            if (this.isVisible) {
                this.redraw();
            }
        });
    }

    // Resize canvas to match map
    resizeCanvas() {
        const mapDiv = this.map.getDiv();
        this.canvas.width = mapDiv.offsetWidth;
        this.canvas.height = mapDiv.offsetHeight;
        this.canvas.style.width = mapDiv.offsetWidth + 'px';
        this.canvas.style.height = mapDiv.offsetHeight + 'px';
    }

    // Generate heatmap for service category
    generateHeatmap(services, category) {
        if (!services || services.length === 0) {
            this.heatmapData[category] = [];
            return;
        }

        const bounds = this.map.getBounds();
        if (!bounds) return;

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        // Create grid
        const gridWidth = Math.ceil(this.canvas.width / this.gridSize);
        const gridHeight = Math.ceil(this.canvas.height / this.gridSize);
        const grid = Array(gridHeight).fill().map(() => Array(gridWidth).fill(0));
        
        // Calculate density for each grid cell
        services.forEach(service => {
            const location = service.geometry.location;
            const point = this.latLngToCanvasPoint(location);
            
            if (point && point.x >= 0 && point.x < this.canvas.width && 
                point.y >= 0 && point.y < this.canvas.height) {
                
                const gridX = Math.floor(point.x / this.gridSize);
                const gridY = Math.floor(point.y / this.gridSize);
                
                if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
                    // Weight by service quality
                    const weight = service.rating ? (service.rating / 5) : 0.5;
                    grid[gridY][gridX] += weight;
                }
            }
        });

        // Apply Gaussian blur for smoother heatmap
        const blurredGrid = this.applyGaussianBlur(grid);
        
        // Find max density for normalization
        this.maxDensity = 0;
        blurredGrid.forEach(row => {
            row.forEach(cell => {
                if (cell > this.maxDensity) {
                    this.maxDensity = cell;
                }
            });
        });

        this.heatmapData[category] = blurredGrid;
    }

    // Apply Gaussian blur to grid
    applyGaussianBlur(grid) {
        const kernel = [
            [1, 2, 1],
            [2, 4, 2],
            [1, 2, 1]
        ];
        const kernelSum = 16;
        
        const blurred = grid.map(row => [...row]);
        
        for (let y = 1; y < grid.length - 1; y++) {
            for (let x = 1; x < grid[0].length - 1; x++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        sum += grid[y + ky][x + kx] * kernel[ky + 1][kx + 1];
                    }
                }
                blurred[y][x] = sum / kernelSum;
            }
        }
        
        return blurred;
    }

    // Convert LatLng to canvas coordinates
    latLngToCanvasPoint(latLng) {
        const projection = this.map.getProjection();
        if (!projection) return null;

        const topRight = new google.maps.LatLng(
            this.map.getBounds().getNorthEast().lat(),
            this.map.getBounds().getNorthEast().lng()
        );
        
        const bottomLeft = new google.maps.LatLng(
            this.map.getBounds().getSouthWest().lat(),
            this.map.getBounds().getSouthWest().lng()
        );

        const scale = Math.pow(2, this.map.getZoom());
        const worldCoordinate = projection.fromLatLngToPoint(latLng);
        const topRightWorldCoordinate = projection.fromLatLngToPoint(topRight);
        const bottomLeftWorldCoordinate = projection.fromLatLngToPoint(bottomLeft);

        const x = (worldCoordinate.x - bottomLeftWorldCoordinate.x) * scale;
        const y = (topRightWorldCoordinate.y - worldCoordinate.y) * scale;

        return { x, y };
    }

    // Render heatmap on canvas
    renderHeatmap(category) {
        if (!this.heatmapData[category] || !this.isVisible) return;
        
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const grid = this.heatmapData[category];
        const colors = this.colorSchemes[this.currentColorScheme];
        
        grid.forEach((row, y) => {
            row.forEach((density, x) => {
                if (density > 0) {
                    const intensity = Math.min(1, density / this.maxDensity);
                    const color = this.interpolateColor(colors, intensity);
                    
                    this.context.fillStyle = color;
                    this.context.fillRect(
                        x * this.gridSize,
                        y * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );
                }
            });
        });
    }

    // Interpolate color based on intensity
    interpolateColor(colors, intensity) {
        if (intensity === 0) return colors[0];
        if (intensity === 1) return colors[colors.length - 1];

        const segment = intensity * (colors.length - 1);
        const index = Math.floor(segment);
        const fraction = segment - index;

        if (index >= colors.length - 1) return colors[colors.length - 1];

        const color1 = this.parseRgba(colors[index]);
        const color2 = this.parseRgba(colors[index + 1]);

        const r = Math.round(color1.r + (color2.r - color1.r) * fraction);
        const g = Math.round(color1.g + (color2.g - color1.g) * fraction);
        const b = Math.round(color1.b + (color2.b - color1.b) * fraction);
        const a = color1.a + (color2.a - color1.a) * fraction;

        return `rgba(${r},${g},${b},${a})`;
    }

    // Parse RGBA color string
    parseRgba(color) {
        const match = color.match(/rgba?\((\d+),(\d+),(\d+),?([\d.]*)\)/);
        return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
            a: parseFloat(match[4] || 1)
        };
    }

    // Debounced redraw
    debounceRedraw() {
        clearTimeout(this.redrawTimeout);
        this.redrawTimeout = setTimeout(() => {
            this.redraw();
        }, 100);
    }

    // Redraw current heatmap
    redraw() {
        if (this.currentCategory && this.isVisible) {
            this.renderHeatmap(this.currentCategory);
        }
    }

    // Show heatmap for category
    showHeatmap(category, services) {
        this.currentCategory = category;
        this.generateHeatmap(services, category);
        this.isVisible = true;
        this.canvas.style.display = 'block';
        this.renderHeatmap(category);
    }

    // Hide heatmap
    hideHeatmap() {
        this.isVisible = false;
        this.canvas.style.display = 'none';
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Toggle heatmap visibility
    toggleHeatmap(category, services) {
        if (this.isVisible && this.currentCategory === category) {
            this.hideHeatmap();
        } else {
            this.showHeatmap(category, services);
        }
    }

    // Set color scheme
    setColorScheme(scheme) {
        if (this.colorSchemes[scheme]) {
            this.currentColorScheme = scheme;
            this.redraw();
        }
    }

    // Get available color schemes
    getColorSchemes() {
        return Object.keys(this.colorSchemes);
    }

    // Set opacity
    setOpacity(opacity) {
        this.canvas.style.opacity = opacity;
    }
}

// Interactive Chart Manager
class InteractiveChartManager {
    constructor() {
        this.charts = new Map();
        this.chartConfigs = {
            categoryBreakdown: {
                type: 'doughnut',
                container: 'category-breakdown-chart',
                title: 'Service Category Breakdown'
            },
            scoreComparison: {
                type: 'radar',
                container: 'score-comparison-chart',
                title: 'Score Comparison'
            },
            historicalTrend: {
                type: 'line',
                container: 'historical-trend-chart',
                title: 'Historical Score Trends'
            },
            serviceDistribution: {
                type: 'bar',
                container: 'service-distribution-chart',
                title: 'Service Distribution'
            }
        };
    }

    // Create category breakdown chart
    createCategoryBreakdownChart(scoreData) {
        const canvas = this.getOrCreateCanvas('category-breakdown-chart');
        const ctx = canvas.getContext('2d');

        const categories = Object.entries(scoreData.categories);
        const data = {
            labels: categories.map(([key, _]) => CONFIG.SERVICE_CATEGORIES[key]?.name || key),
            datasets: [{
                data: categories.map(([_, data]) => Math.round(data.score * 100)),
                backgroundColor: categories.map(([key, _]) => CONFIG.SERVICE_CATEGORIES[key]?.color || '#666'),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label;
                            const value = context.parsed;
                            const category = categories[context.dataIndex];
                            const serviceCount = category[1].serviceCount;
                            return `${label}: ${value}% (${serviceCount} services)`;
                        }
                    }
                }
            }
        };

        // Use a simple canvas-based chart implementation
        this.drawDoughnutChart(ctx, data, options);
        this.charts.set('category-breakdown-chart', { canvas, data, options });
    }

    // Create score comparison radar chart
    createScoreComparisonChart(comparisonData) {
        const canvas = this.getOrCreateCanvas('score-comparison-chart');
        const ctx = canvas.getContext('2d');

        const categories = Object.keys(CONFIG.SERVICE_CATEGORIES);
        const datasets = comparisonData.map((area, index) => ({
            label: area.name,
            data: categories.map(cat => Math.round((area.score.categories[cat]?.score || 0) * 100)),
            borderColor: this.getChartColor(index),
            backgroundColor: this.getChartColor(index, 0.2),
            pointBackgroundColor: this.getChartColor(index),
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: this.getChartColor(index)
        }));

        const data = {
            labels: categories.map(cat => CONFIG.SERVICE_CATEGORIES[cat]?.name || cat),
            datasets: datasets
        };

        this.drawRadarChart(ctx, data);
        this.charts.set('score-comparison-chart', { canvas, data });
    }

    // Create historical trend chart
    createHistoricalTrendChart(historicalData) {
        const canvas = this.getOrCreateCanvas('historical-trend-chart');
        const ctx = canvas.getContext('2d');

        // Group data by date
        const groupedData = this.groupDataByDate(historicalData);
        
        const data = {
            labels: Object.keys(groupedData),
            datasets: [{
                label: 'Average Score',
                data: Object.values(groupedData).map(scores => {
                    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                    return Math.round(avg * 100);
                }),
                borderColor: '#4285f4',
                backgroundColor: 'rgba(66, 133, 244, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };

        this.drawLineChart(ctx, data);
        this.charts.set('historical-trend-chart', { canvas, data });
    }

    // Create service distribution chart
    createServiceDistributionChart(servicesData) {
        const canvas = this.getOrCreateCanvas('service-distribution-chart');
        const ctx = canvas.getContext('2d');

        const categories = Object.entries(servicesData);
        const data = {
            labels: categories.map(([key, _]) => CONFIG.SERVICE_CATEGORIES[key]?.name || key),
            datasets: [{
                label: 'Service Count',
                data: categories.map(([_, services]) => services.length),
                backgroundColor: categories.map(([key, _]) => CONFIG.SERVICE_CATEGORIES[key]?.color || '#666'),
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.8)'
            }]
        };

        this.drawBarChart(ctx, data);
        this.charts.set('service-distribution-chart', { canvas, data });
    }

    // Get or create canvas element
    getOrCreateCanvas(id) {
        let canvas = document.getElementById(id);
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = id;
            canvas.width = 400;
            canvas.height = 300;
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
        }
        return canvas;
    }

    // Simple doughnut chart implementation
    drawDoughnutChart(ctx, data, options) {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        const innerRadius = radius * 0.6;

        let startAngle = -Math.PI / 2;
        const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        data.datasets[0].data.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            
            ctx.fillStyle = data.datasets[0].backgroundColor[index];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw label
            const labelAngle = startAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 15);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 15);
            
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${value}%`, labelX, labelY);

            startAngle += sliceAngle;
        });
    }

    // Simple radar chart implementation
    drawRadarChart(ctx, data) {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        const angles = data.labels.map((_, i) => (i / data.labels.length) * 2 * Math.PI - Math.PI / 2);

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw grid
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 5; i++) {
            const gridRadius = (radius / 5) * i;
            ctx.beginPath();
            angles.forEach((angle, index) => {
                const x = centerX + Math.cos(angle) * gridRadius;
                const y = centerY + Math.sin(angle) * gridRadius;
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
        }

        // Draw axes
        angles.forEach(angle => {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
            ctx.stroke();
        });

        // Draw labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        angles.forEach((angle, index) => {
            const x = centerX + Math.cos(angle) * (radius + 20);
            const y = centerY + Math.sin(angle) * (radius + 20);
            ctx.textAlign = 'center';
            ctx.fillText(data.labels[index], x, y);
        });

        // Draw datasets
        data.datasets.forEach(dataset => {
            const points = dataset.data.map((value, index) => {
                const normalizedValue = value / 100;
                const x = centerX + Math.cos(angles[index]) * radius * normalizedValue;
                const y = centerY + Math.sin(angles[index]) * radius * normalizedValue;
                return { x, y };
            });

            // Fill area
            ctx.beginPath();
            points.forEach((point, index) => {
                if (index === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.closePath();
            ctx.fillStyle = dataset.backgroundColor;
            ctx.fill();

            // Draw line
            ctx.beginPath();
            points.forEach((point, index) => {
                if (index === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.closePath();
            ctx.strokeStyle = dataset.borderColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw points
            points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
                ctx.fillStyle = dataset.pointBackgroundColor;
                ctx.fill();
                ctx.strokeStyle = dataset.pointBorderColor;
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        });
    }

    // Simple line chart implementation
    drawLineChart(ctx, data) {
        const padding = 40;
        const chartWidth = ctx.canvas.width - 2 * padding;
        const chartHeight = ctx.canvas.height - 2 * padding;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const maxValue = Math.max(...data.datasets[0].data);
        const minValue = Math.min(...data.datasets[0].data);
        const valueRange = maxValue - minValue || 1;

        // Draw axes
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.stroke();

        // Draw data
        const dataset = data.datasets[0];
        const points = dataset.data.map((value, index) => {
            const x = padding + (index / (data.labels.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
            return { x, y };
        });

        // Fill area
        if (dataset.fill) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, padding + chartHeight);
            points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.lineTo(points[points.length - 1].x, padding + chartHeight);
            ctx.closePath();
            ctx.fillStyle = dataset.backgroundColor;
            ctx.fill();
        }

        // Draw line
        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.strokeStyle = dataset.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw points
        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = dataset.borderColor;
            ctx.fill();
        });

        // Draw labels
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        data.labels.forEach((label, index) => {
            const x = padding + (index / (data.labels.length - 1)) * chartWidth;
            ctx.fillText(label, x, padding + chartHeight + 15);
        });
    }

    // Simple bar chart implementation
    drawBarChart(ctx, data) {
        const padding = 40;
        const chartWidth = ctx.canvas.width - 2 * padding;
        const chartHeight = ctx.canvas.height - 2 * padding;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const maxValue = Math.max(...data.datasets[0].data);
        const barWidth = chartWidth / data.labels.length * 0.8;
        const barSpacing = chartWidth / data.labels.length * 0.2;

        // Draw axes
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.stroke();

        // Draw bars
        data.datasets[0].data.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            const y = padding + chartHeight - barHeight;

            ctx.fillStyle = data.datasets[0].backgroundColor[index];
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.strokeStyle = data.datasets[0].borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // Draw value label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth / 2, y - 5);

            // Draw category label
            ctx.save();
            ctx.translate(x + barWidth / 2, padding + chartHeight + 15);
            ctx.rotate(-Math.PI / 4);
            ctx.textAlign = 'right';
            ctx.fillText(data.labels[index], 0, 0);
            ctx.restore();
        });
    }

    // Utility functions
    getChartColor(index, alpha = 1) {
        const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#9c27b0'];
        const color = colors[index % colors.length];
        if (alpha === 1) return color;
        
        const rgb = this.hexToRgb(color);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    groupDataByDate(historicalData) {
        const grouped = {};
        historicalData.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(entry.score);
        });
        return grouped;
    }

    // Clear all charts
    clearCharts() {
        this.charts.forEach((chart, id) => {
            const ctx = chart.canvas.getContext('2d');
            ctx.clearRect(0, 0, chart.canvas.width, chart.canvas.height);
        });
        this.charts.clear();
    }

    // Get chart canvas by id
    getChart(id) {
        return this.charts.get(id);
    }
}

// Enhanced Dashboard Visualizer
class EnhancedDashboardVisualizer {
    constructor() {
        this.animationFrameId = null;
        this.currentAnimations = new Map();
    }

    // Animate score circle with advanced effects
    animateScoreCircle(element, targetScore, duration = 1000) {
        if (!element) return;

        const startScore = parseFloat(element.dataset.currentScore || 0);
        const scoreRange = targetScore - startScore;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out-cubic)
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentScore = startScore + (scoreRange * easeOutCubic);
            
            // Update circle
            this.updateScoreCircle(element, currentScore);
            
            if (progress < 1) {
                this.animationFrameId = requestAnimationFrame(animate);
            } else {
                element.dataset.currentScore = targetScore;
            }
        };

        cancelAnimationFrame(this.animationFrameId);
        requestAnimationFrame(animate);
    }

    // Update score circle visual
    updateScoreCircle(element, score) {
        const percentage = score;
        const color = this.getScoreColor(score / 100);
        const hue = this.scoreToHue(score / 100);
        
        // Create advanced gradient
        const gradient = `conic-gradient(
            hsl(${hue}, 70%, 50%) ${percentage * 3.6}deg,
            hsl(${hue}, 30%, 90%) ${percentage * 3.6}deg,
            #f0f0f0 ${percentage * 3.6}deg
        )`;
        
        element.style.background = gradient;
        element.style.boxShadow = `0 0 20px hsla(${hue}, 70%, 50%, 0.3)`;
        
        // Update text if present
        const valueElement = element.querySelector('.score-value');
        if (valueElement) {
            valueElement.textContent = Math.round(score);
            valueElement.style.color = color;
        }
    }

    // Animate category bars with staggered effect
    animateCategoryBars(categoryData, delay = 100) {
        Object.entries(categoryData).forEach(([category, data], index) => {
            setTimeout(() => {
                this.animateCategoryBar(category, data.score, index);
            }, index * delay);
        });
    }

    // Animate individual category bar
    animateCategoryBar(category, targetScore, index = 0) {
        const barElement = document.querySelector(`[data-category="${category}"] .score-fill`);
        const numberElement = document.querySelector(`[data-category="${category}"] .score-number`);
        
        if (!barElement) return;

        const duration = 800 + (index * 100); // Staggered duration
        const startTime = performance.now();
        const targetWidth = targetScore * 100;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Bounce easing
            const bounce = this.easeOutBounce(progress);
            const currentWidth = targetWidth * bounce;
            
            barElement.style.transform = `scaleX(${currentWidth / 100})`;
            
            if (numberElement) {
                numberElement.textContent = Math.round(currentWidth);
            }
            
            // Color transition
            const color = this.getScoreColor(currentWidth / 100);
            barElement.style.backgroundColor = color;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Create pulsing indicator
    createPulsingIndicator(element, color = '#4285f4') {
        element.style.position = 'relative';
        element.style.overflow = 'visible';
        
        const pulse = document.createElement('div');
        pulse.className = 'pulse-indicator';
        pulse.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            width: 10px;
            height: 10px;
            background: ${color};
            border-radius: 50%;
            animation: pulse 2s infinite;
        `;
        
        element.appendChild(pulse);
        
        // Add CSS animation if not exists
        if (!document.getElementById('pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'pulse-animation';
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Utility functions
    getScoreColor(normalizedScore) {
        if (normalizedScore >= 0.8) return '#4CAF50';
        if (normalizedScore >= 0.6) return '#8BC34A';
        if (normalizedScore >= 0.4) return '#FFC107';
        if (normalizedScore >= 0.2) return '#FF9800';
        return '#F44336';
    }

    scoreToHue(normalizedScore) {
        // Red (0) to Green (120) based on score
        return normalizedScore * 120;
    }

    easeOutBounce(t) {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }
}

// Export classes for browser environment
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        ServiceDensityHeatmap,
        InteractiveChartManager,
        EnhancedDashboardVisualizer
    };
} else {
    // Browser environment - make available globally
    window.ServiceDensityHeatmap = ServiceDensityHeatmap;
    window.InteractiveChartManager = InteractiveChartManager;
    window.EnhancedDashboardVisualizer = EnhancedDashboardVisualizer;
}
