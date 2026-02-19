// Quality of Life Scoring Algorithm for Map Web App
// Phase 1: Basic scoring structure and algorithms

// Enhanced Quality of Life Scorer class - Phase 3
class QualityOfLifeScorer {
    constructor() {
        this.weights = CONFIG.SERVICE_CATEGORIES;
        this.distanceDecay = CONFIG.DISTANCE_DECAY_FACTORS;
        this.scoreRanges = CONFIG.QUALITY_SCORE_RANGES;
        
        // Enhanced scoring parameters for Phase 3
        this.advancedWeights = {
            distance: 0.35,        // How close services are
            quality: 0.30,         // Service ratings and reviews
            density: 0.20,         // Number of options available
            accessibility: 0.15    // Operating hours, price level, etc.
        };
        
        // Population and demographic adjustments
        this.demographicFactors = {
            families: { education: 1.3, healthcare: 1.2, social: 1.1 },
            professionals: { transport: 1.3, essential: 1.2, social: 1.1 },
            seniors: { healthcare: 1.4, transport: 1.3, essential: 1.2 },
            students: { education: 1.4, transport: 1.2, social: 1.3 }
        };
        
        // Time-based scoring factors
        this.timeFactors = {
            peak_hours: { transport: 1.2, essential: 0.9 },
            off_peak: { transport: 0.9, essential: 1.1 },
            weekend: { social: 1.3, education: 0.7 }
        };
    }

    // Enhanced main function to calculate area quality score - Phase 3
    calculateAreaScore(services, centerLocation, options = {}) {
        try {
            const {
                demographic = 'general',
                timeContext = 'general',
                includeAdvancedFactors = true,
                customWeights = null
            } = options;

            const categoryScores = {};
            let overallScore = 0;
            let totalWeight = 0;

            // Use custom weights if provided, otherwise use default
            const weights = customWeights || this.weights;

            // Calculate score for each category with enhanced algorithms
            Object.keys(weights).forEach(category => {
                const categoryData = this.calculateEnhancedCategoryScore(
                    services[category] || [], 
                    centerLocation,
                    category,
                    { demographic, timeContext, includeAdvancedFactors }
                );
                
                // Apply demographic and time-based adjustments
                let adjustedWeight = weights[category].weight;
                if (includeAdvancedFactors) {
                    adjustedWeight = this.applyDemographicAdjustment(
                        adjustedWeight, category, demographic
                    );
                    adjustedWeight = this.applyTimeAdjustment(
                        adjustedWeight, category, timeContext
                    );
                }
                
                categoryScores[category] = {
                    ...categoryData,
                    weight: adjustedWeight,
                    weightedScore: categoryData.score * adjustedWeight,
                    rawScore: categoryData.score,
                    adjustments: {
                        demographic: this.getDemographicAdjustment(category, demographic),
                        time: this.getTimeAdjustment(category, timeContext)
                    }
                };

                overallScore += categoryScores[category].weightedScore;
                totalWeight += adjustedWeight;
            });

            // Normalize the overall score
            overallScore = totalWeight > 0 ? overallScore / totalWeight : 0;

            // Calculate additional metrics for Phase 3
            const additionalMetrics = this.calculateAdditionalMetrics(
                services, centerLocation, categoryScores
            );

            // Calculate percentile ranking
            const percentileRanking = this.calculatePercentileRanking(overallScore);

            return {
                overall: Math.round(overallScore * 100) / 100,
                categories: categoryScores,
                grade: this.getScoreGrade(overallScore),
                percentile: percentileRanking,
                insights: this.generateAdvancedInsights(categoryScores, overallScore, options),
                metrics: additionalMetrics,
                metadata: {
                    calculatedAt: new Date().toISOString(),
                    location: {
                        lat: centerLocation.lat(),
                        lng: centerLocation.lng()
                    },
                    options: options,
                    version: '3.0'
                }
            };
        } catch (error) {
            console.error('Error calculating area score:', error);
            return this.getEmptyScore();
        }
    }

    // Calculate score for a specific service category
    calculateCategoryScore(services, centerLocation) {
        if (!services || services.length === 0) {
            return 0;
        }

        let totalScore = 0;
        let maxPossibleScore = 0;

        services.forEach(service => {
            const distance = this.calculateDistance(centerLocation, service.geometry.location);
            const distanceFactor = this.getDistanceDecayFactor(distance);
            const qualityFactor = this.getServiceQualityFactor(service);
            
            const serviceScore = distanceFactor * qualityFactor;
            totalScore += serviceScore;
            maxPossibleScore += 1.0; // Maximum possible score per service
        });

        // Normalize score based on service availability and quality
        const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
        
        // Apply service density bonus (more services = better coverage)
        const densityBonus = this.calculateDensityBonus(services.length);
        
        return Math.min(1.0, normalizedScore + densityBonus);
    }

    // Get distance decay factor based on distance
    getDistanceDecayFactor(distance) {
        const distances = Object.keys(this.distanceDecay)
            .map(d => parseInt(d))
            .sort((a, b) => a - b);

        for (let i = 0; i < distances.length; i++) {
            if (distance <= distances[i]) {
                return this.distanceDecay[distances[i]];
            }
        }

        // Beyond maximum distance
        return 0.1;
    }

    // Get service quality factor based on rating and popularity
    getServiceQualityFactor(service) {
        let qualityFactor = 0.5; // Base quality

        // Rating factor (0-1 based on 1-5 star rating)
        if (service.rating) {
            qualityFactor += (service.rating - 1) / 4 * 0.4; // Max 0.4 bonus
        }

        // Popularity factor (based on user ratings total)
        if (service.user_ratings_total) {
            const popularityFactor = Math.min(1, service.user_ratings_total / 100) * 0.1;
            qualityFactor += popularityFactor; // Max 0.1 bonus
        }

        return Math.min(1.0, qualityFactor);
    }

    // Enhanced category scoring with multi-factor analysis - Phase 3
    calculateEnhancedCategoryScore(services, centerLocation, category, options = {}) {
        if (!services || services.length === 0) {
            return {
                score: 0,
                serviceCount: 0,
                topServices: [],
                averageDistance: null,
                qualityDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
                accessibilityScore: 0,
                densityScore: 0,
                diversityScore: 0
            };
        }

        // Calculate component scores using advanced weights
        const distanceScore = this.calculateDistanceScore(services, centerLocation);
        const qualityScore = this.calculateQualityScore(services);
        const densityScore = this.calculateDensityScore(services, centerLocation);
        const accessibilityScore = this.calculateAccessibilityScore(services);
        const diversityScore = this.calculateDiversityScore(services, category);

        // Combine scores using advanced weighting
        const combinedScore = (
            distanceScore * this.advancedWeights.distance +
            qualityScore * this.advancedWeights.quality +
            densityScore * this.advancedWeights.density +
            accessibilityScore * this.advancedWeights.accessibility
        );

        // Calculate quality distribution
        const qualityDistribution = this.calculateQualityDistribution(services);

        // Calculate average distance
        const averageDistance = this.calculateAverageDistance(services, centerLocation);

        return {
            score: Math.min(1.0, combinedScore),
            serviceCount: services.length,
            topServices: this.getTopServices(services, 3),
            averageDistance: averageDistance,
            qualityDistribution: qualityDistribution,
            accessibilityScore: accessibilityScore,
            densityScore: densityScore,
            diversityScore: diversityScore,
            componentScores: {
                distance: distanceScore,
                quality: qualityScore,
                density: densityScore,
                accessibility: accessibilityScore,
                diversity: diversityScore
            }
        };
    }

    // Calculate distance-based score with enhanced decay function
    calculateDistanceScore(services, centerLocation) {
        if (services.length === 0) return 0;

        let totalScore = 0;
        let maxPossibleScore = 0;

        services.forEach(service => {
            const distance = this.calculateDistance(centerLocation, service.geometry.location);
            const distanceFactor = this.getEnhancedDistanceDecayFactor(distance);
            
            totalScore += distanceFactor;
            maxPossibleScore += 1.0;
        });

        return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
    }

    // Enhanced distance decay with smooth transitions
    getEnhancedDistanceDecayFactor(distance) {
        // Smooth exponential decay function
        const baseDecay = Math.exp(-distance / 1500); // Smooth decay over 1.5km
        
        // Apply step function adjustments for better UX
        if (distance <= 300) return 1.0;           // Excellent (walking distance)
        if (distance <= 800) return 0.9 * baseDecay;   // Very good (short walk)
        if (distance <= 1500) return 0.7 * baseDecay;  // Good (manageable walk)
        if (distance <= 3000) return 0.5 * baseDecay;  // Fair (bike/short drive)
        if (distance <= 5000) return 0.3 * baseDecay;  // Poor (drive required)
        return 0.1 * baseDecay;                         // Very poor (long drive)
    }

    // Calculate overall quality score from service ratings
    calculateQualityScore(services) {
        if (services.length === 0) return 0;

        let totalQuality = 0;
        let ratedServices = 0;

        services.forEach(service => {
            if (service.rating && service.rating > 0) {
                // Normalize rating to 0-1 scale and apply popularity weighting
                const normalizedRating = (service.rating - 1) / 4; // 1-5 scale to 0-1
                const popularityFactor = this.getPopularityFactor(service);
                const weightedRating = normalizedRating * popularityFactor;
                
                totalQuality += weightedRating;
                ratedServices++;
            }
        });

        // If no rated services, return neutral score
        if (ratedServices === 0) return 0.5;

        return totalQuality / ratedServices;
    }

    // Calculate density score based on service availability and distribution
    calculateDensityScore(services, centerLocation) {
        if (services.length === 0) return 0;

        // Base density score
        const serviceCount = services.length;
        let densityScore = Math.min(1.0, serviceCount / 15); // Normalize to 15 services max

        // Bonus for geographic distribution (avoid clustering)
        const distributionBonus = this.calculateDistributionBonus(services, centerLocation);
        
        // Bonus for 24/7 availability
        const availabilityBonus = this.calculateAvailabilityBonus(services);

        return Math.min(1.0, densityScore + distributionBonus + availabilityBonus);
    }

    // Calculate accessibility score (hours, price, etc.)
    calculateAccessibilityScore(services) {
        if (services.length === 0) return 0;

        let totalAccessibility = 0;
        let scoredServices = 0;

        services.forEach(service => {
            let serviceAccessibility = 0.5; // Base score

            // Check business status first - skip permanently closed businesses
            if (service.business_status === 'CLOSED_PERMANENTLY') {
                return; // Skip this service entirely
            }
            
            // Bonus for operational businesses
            if (service.business_status === 'OPERATIONAL') {
                serviceAccessibility += 0.1;
            }

            // Operating hours factor
            if (service.opening_hours) {
                // Use isOpen() method if available, fall back to open_now for compatibility
                const isCurrentlyOpen = typeof service.opening_hours.isOpen === 'function' 
                    ? service.opening_hours.isOpen() 
                    : service.opening_hours.open_now;
                if (isCurrentlyOpen) {
                    serviceAccessibility += 0.2;
                }
                // Bonus for extended hours or 24/7 service
                if (this.hasExtendedHours(service)) {
                    serviceAccessibility += 0.1;
                }
            }

            // Price accessibility factor
            if (service.price_level !== undefined) {
                // Lower price levels get higher accessibility scores
                const priceAccessibility = (4 - service.price_level) / 4 * 0.2;
                serviceAccessibility += priceAccessibility;
            } else {
                // No price info usually means free or very accessible
                serviceAccessibility += 0.15;
            }

            totalAccessibility += Math.min(1.0, serviceAccessibility);
            scoredServices++;
        });

        return scoredServices > 0 ? totalAccessibility / scoredServices : 0.5;
    }

    // Calculate service diversity score
    calculateDiversityScore(services, category) {
        if (services.length === 0) return 0;

        const serviceTypes = new Set();
        services.forEach(service => {
            if (service.types) {
                service.types.forEach(type => {
                    if (PLACE_TYPES[category] && PLACE_TYPES[category].includes(type)) {
                        serviceTypes.add(type);
                    }
                });
            }
        });

        const expectedTypes = PLACE_TYPES[category] ? PLACE_TYPES[category].length : 1;
        return Math.min(1.0, serviceTypes.size / expectedTypes);
    }

    // Calculate density bonus based on number of services
    calculateDensityBonus(serviceCount) {
        if (serviceCount === 0) return 0;
        if (serviceCount >= 10) return 0.2; // Max bonus for 10+ services
        return (serviceCount / 10) * 0.2;
    }

    // Calculate distance between two points (reused from services.js)
    calculateDistance(location1, location2) {
        const lat1 = location1.lat();
        const lng1 = location1.lng();
        const lat2 = location2.lat();
        const lng2 = location2.lng();

        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    // Get score grade based on overall score
    getScoreGrade(score) {
        const percentage = score * 100;
        
        for (const [grade, range] of Object.entries(this.scoreRanges)) {
            if (percentage >= range.min && percentage <= range.max) {
                return {
                    grade: grade,
                    label: range.label,
                    color: range.color,
                    percentage: percentage
                };
            }
        }
        
        return {
            grade: 'unknown',
            label: 'Unknown',
            color: '#666666',
            percentage: percentage
        };
    }

    // Get top services from a category
    getTopServices(services, limit = 3) {
        return services
            .filter(service => service.rating && service.rating >= 4.0)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, limit)
            .map(service => ({
                name: service.name,
                rating: service.rating,
                vicinity: service.vicinity
            }));
    }

    // Generate basic insights from scoring results
    generateBasicInsights(categoryScores, overallScore) {
        const insights = {
            strengths: [],
            weaknesses: [],
            recommendations: [],
            summary: ''
        };

        // Identify strengths and weaknesses
        Object.entries(categoryScores).forEach(([category, data]) => {
            const categoryConfig = this.weights[category];
            const scorePercentage = data.score * 100;

            if (scorePercentage >= 70) {
                insights.strengths.push({
                    category: categoryConfig.name,
                    score: scorePercentage,
                    serviceCount: data.serviceCount
                });
            } else if (scorePercentage < 40) {
                insights.weaknesses.push({
                    category: categoryConfig.name,
                    score: scorePercentage,
                    serviceCount: data.serviceCount
                });
            }
        });

        // Generate recommendations based on weaknesses
        insights.weaknesses.forEach(weakness => {
            if (weakness.serviceCount === 0) {
                insights.recommendations.push(
                    `Consider proximity to ${weakness.category.toLowerCase()} when choosing this location`
                );
            } else {
                insights.recommendations.push(
                    `Limited ${weakness.category.toLowerCase()} options in the area`
                );
            }
        });

        // Generate summary
        const grade = this.getScoreGrade(overallScore);
        insights.summary = this.generateScoreSummary(grade, insights.strengths, insights.weaknesses);

        return insights;
    }

    // Generate a text summary of the score
    generateScoreSummary(grade, strengths, weaknesses) {
        const strengthNames = strengths.map(s => s.category).join(' and ');
        const weaknessNames = weaknesses.map(w => w.category).join(' and ');

        if (grade.percentage >= 85) {
            return `Excellent quality of life with outstanding ${strengthNames || 'amenities'}.`;
        } else if (grade.percentage >= 70) {
            return `Good living conditions, particularly strong in ${strengthNames || 'several areas'}${weaknesses.length > 0 ? `, though ${weaknessNames} could be improved` : ''}.`;
        } else if (grade.percentage >= 55) {
            return `Average area with adequate amenities${strengths.length > 0 ? `, notable strengths in ${strengthNames}` : ''}${weaknesses.length > 0 ? `, areas for improvement: ${weaknessNames}` : ''}.`;
        } else if (grade.percentage >= 40) {
            return `Below average quality of life${strengths.length > 0 ? ` with some strengths in ${strengthNames}` : ''}. Consider improving access to ${weaknessNames || 'essential services'}.`;
        } else {
            return `Limited amenities available. Significant improvements needed in ${weaknessNames || 'most service categories'}.`;
        }
    }

    // Return empty score structure for error cases
    getEmptyScore() {
        const emptyCategories = {};
        Object.keys(this.weights).forEach(category => {
            emptyCategories[category] = {
                score: 0,
                weight: this.weights[category].weight,
                weightedScore: 0,
                serviceCount: 0,
                topServices: []
            };
        });

        return {
            overall: 0,
            categories: emptyCategories,
            grade: this.getScoreGrade(0),
            insights: {
                strengths: [],
                weaknesses: [],
                recommendations: ['No service data available for this location'],
                summary: 'Unable to assess quality of life - no service data available.'
            }
        };
    }

    // Supporting utility functions for Phase 3 enhancements
    getPopularityFactor(service) {
        if (!service.user_ratings_total) return 1.0;
        const popularity = Math.log(service.user_ratings_total + 1) / Math.log(101);
        return 0.8 + (popularity * 0.4);
    }

    hasExtendedHours(service) {
        if (!service.opening_hours || !service.opening_hours.weekday_text) return false;
        const hoursText = service.opening_hours.weekday_text.join(' ').toLowerCase();
        return hoursText.includes('24') || hoursText.includes('midnight') || 
               hoursText.includes('late') || hoursText.includes('early');
    }

    calculateDistributionBonus(services, centerLocation) {
        if (services.length < 3) return 0;
        let totalDistance = 0;
        let comparisons = 0;
        for (let i = 0; i < services.length; i++) {
            for (let j = i + 1; j < services.length; j++) {
                totalDistance += this.calculateDistance(services[i].geometry.location, services[j].geometry.location);
                comparisons++;
            }
        }
        const averageSpread = totalDistance / comparisons;
        const idealSpread = 1000;
        const spreadFactor = Math.exp(-Math.abs(averageSpread - idealSpread) / idealSpread);
        return Math.min(0.1, spreadFactor * 0.1);
    }

    calculateAvailabilityBonus(services) {
        const availableServices = services.filter(service => {
            // Skip permanently closed businesses
            if (service.business_status === 'CLOSED_PERMANENTLY') {
                return false;
            }
            
            if (this.hasExtendedHours(service)) return true;
            if (service.opening_hours) {
                // Use isOpen() method if available, fall back to open_now for compatibility
                const isCurrentlyOpen = typeof service.opening_hours.isOpen === 'function' 
                    ? service.opening_hours.isOpen() 
                    : service.opening_hours.open_now;
                return isCurrentlyOpen;
            }
            return false;
        });
        return Math.min(0.1, (availableServices.length / services.length) * 0.1);
    }

    calculateQualityDistribution(services) {
        const distribution = { excellent: 0, good: 0, average: 0, poor: 0 };
        services.forEach(service => {
            if (service.rating) {
                if (service.rating >= 4.5) distribution.excellent++;
                else if (service.rating >= 3.5) distribution.good++;
                else if (service.rating >= 2.5) distribution.average++;
                else distribution.poor++;
            }
        });
        return distribution;
    }

    calculateAverageDistance(services, centerLocation) {
        if (services.length === 0) return null;
        const totalDistance = services.reduce((sum, service) => {
            return sum + this.calculateDistance(centerLocation, service.geometry.location);
        }, 0);
        return Math.round(totalDistance / services.length);
    }

    // Apply demographic and time adjustments
    applyDemographicAdjustment(weight, category, demographic) {
        if (!this.demographicFactors[demographic] || !this.demographicFactors[demographic][category]) {
            return weight;
        }
        return weight * this.demographicFactors[demographic][category];
    }

    applyTimeAdjustment(weight, category, timeContext) {
        if (!this.timeFactors[timeContext] || !this.timeFactors[timeContext][category]) {
            return weight;
        }
        return weight * this.timeFactors[timeContext][category];
    }

    getDemographicAdjustment(category, demographic) {
        return this.demographicFactors[demographic]?.[category] || 1.0;
    }

    getTimeAdjustment(category, timeContext) {
        return this.timeFactors[timeContext]?.[category] || 1.0;
    }

    // Calculate additional metrics for Phase 3
    calculateAdditionalMetrics(services, centerLocation, categoryScores) {
        const totalServices = Object.values(services).reduce((sum, cat) => sum + cat.length, 0);
        return {
            totalServices: totalServices,
            walkabilityScore: this.calculateWalkabilityScore(services, centerLocation),
            coverageScore: this.calculateCoverageScore(categoryScores),
            accessibilityIndex: this.calculateAccessibilityIndex(categoryScores),
            serviceBalance: this.calculateServiceBalance(categoryScores),
            qualityConsistency: this.calculateQualityConsistency(categoryScores)
        };
    }

    calculateWalkabilityScore(services, centerLocation) {
        let walkableServices = 0;
        let totalServices = 0;
        Object.values(services).forEach(categoryServices => {
            categoryServices.forEach(service => {
                const distance = this.calculateDistance(centerLocation, service.geometry.location);
                if (distance <= 800) walkableServices++;
                totalServices++;
            });
        });
        return totalServices > 0 ? walkableServices / totalServices : 0;
    }

    calculateCoverageScore(categoryScores) {
        const categories = Object.values(categoryScores);
        const nonZeroCategories = categories.filter(cat => cat.score > 0).length;
        return nonZeroCategories / categories.length;
    }

    calculateAccessibilityIndex(categoryScores) {
        const accessibilityScores = Object.values(categoryScores).map(cat => cat.accessibilityScore || 0);
        return accessibilityScores.reduce((sum, score) => sum + score, 0) / accessibilityScores.length;
    }

    calculateServiceBalance(categoryScores) {
        const scores = Object.values(categoryScores).map(cat => cat.score);
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        return 1 - Math.min(1, variance);
    }

    calculateQualityConsistency(categoryScores) {
        let totalRatedServices = 0;
        let qualitySum = 0;
        Object.values(categoryScores).forEach(category => {
            if (category.topServices) {
                category.topServices.forEach(service => {
                    if (service.rating) {
                        qualitySum += service.rating;
                        totalRatedServices++;
                    }
                });
            }
        });
        if (totalRatedServices === 0) return 0.5;
        return Math.min(1, qualitySum / totalRatedServices / 5);
    }

    // Generate advanced insights
    generateAdvancedInsights(categoryScores, overallScore, options = {}) {
        const basicInsights = this.generateBasicInsights(categoryScores, overallScore);
        return {
            ...basicInsights,
            demographic: this.generateDemographicInsights(categoryScores, options.demographic),
            accessibility: this.generateAccessibilityInsights(categoryScores),
            walkability: this.generateWalkabilityInsights(categoryScores)
        };
    }

    generateDemographicInsights(categoryScores, demographic = 'general') {
        const insights = [];
        const education = categoryScores.education?.score || 0;
        const healthcare = categoryScores.healthcare?.score || 0;
        const transport = categoryScores.transport?.score || 0;
        const social = categoryScores.social?.score || 0;

        switch (demographic) {
            case 'families':
                if (education > 0.7 && healthcare > 0.6 && social > 0.6) {
                    insights.push('Excellent for families: Great schools, healthcare, and family activities nearby.');
                } else if (education < 0.4) {
                    insights.push('Limited educational options may not be ideal for families with school-age children.');
                }
                break;
            case 'professionals':
                if (transport > 0.7) {
                    insights.push('Great for professionals: Excellent transport links for commuting.');
                } else if (transport < 0.4) {
                    insights.push('Limited transport options may impact commuting convenience.');
                }
                break;
            case 'seniors':
                if (healthcare > 0.8 && transport > 0.6) {
                    insights.push('Excellent for seniors: Superior healthcare and accessible transport.');
                } else if (healthcare < 0.5) {
                    insights.push('Healthcare access may be challenging for seniors.');
                }
                break;
            case 'students':
                if (education > 0.8 && social > 0.7) {
                    insights.push('Perfect for students: Great educational facilities and social options.');
                }
                break;
        }
        return insights;
    }

    generateAccessibilityInsights(categoryScores) {
        const avgAccessibility = Object.values(categoryScores)
            .reduce((sum, cat) => sum + (cat.accessibilityScore || 0), 0) / Object.keys(categoryScores).length;
        
        if (avgAccessibility > 0.7) return ['High accessibility across all service categories'];
        if (avgAccessibility < 0.4) return ['Accessibility challenges identified'];
        return ['Moderate accessibility levels'];
    }

    generateWalkabilityInsights(categoryScores) {
        const walkableCategories = Object.entries(categoryScores)
            .filter(([_, cat]) => (cat.averageDistance || 999999) < 800)
            .map(([name, _]) => CONFIG.SERVICE_CATEGORIES[name]?.name || name);

        if (walkableCategories.length >= 3) {
            return [`Highly walkable: ${walkableCategories.join(', ')} within walking distance`];
        }
        return ['Limited walkability - consider transport options'];
    }

    // Calculate percentile ranking for a score
    calculatePercentileRanking(score) {
        // Use historical data if available
        if (typeof window !== 'undefined' && window.historicalTracker) {
            const percentile = window.historicalTracker.calculatePercentile(score);
            return {
                value: percentile,
                description: this.getPercentileDescription(percentile),
                context: 'historical'
            };
        }
        
        // Fallback to statistical estimation based on score distribution
        return this.estimatePercentileFromScore(score);
    }

    // Estimate percentile from score using statistical models
    estimatePercentileFromScore(score) {
        // Based on normal distribution assumptions
        // Most areas score between 0.3-0.8, with mean around 0.55
        const mean = 0.55;
        const stdDev = 0.15;
        
        // Convert to z-score
        const zScore = (score - mean) / stdDev;
        
        // Convert z-score to percentile (approximate)
        let percentile;
        if (zScore <= -2.5) percentile = 1;
        else if (zScore <= -2.0) percentile = 2;
        else if (zScore <= -1.5) percentile = 7;
        else if (zScore <= -1.0) percentile = 16;
        else if (zScore <= -0.5) percentile = 31;
        else if (zScore <= 0.0) percentile = 50;
        else if (zScore <= 0.5) percentile = 69;
        else if (zScore <= 1.0) percentile = 84;
        else if (zScore <= 1.5) percentile = 93;
        else if (zScore <= 2.0) percentile = 98;
        else percentile = 99;
        
        return {
            value: percentile,
            description: this.getPercentileDescription(percentile),
            context: 'estimated'
        };
    }

    // Get description for percentile ranking
    getPercentileDescription(percentile) {
        if (percentile >= 90) return 'Exceptional - Top 10% of areas';
        if (percentile >= 75) return 'Excellent - Top 25% of areas';
        if (percentile >= 60) return 'Above Average - Better than most areas';
        if (percentile >= 40) return 'Average - Typical for most areas';
        if (percentile >= 25) return 'Below Average - Lower than most areas';
        if (percentile >= 10) return 'Poor - Bottom 25% of areas';
        return 'Very Poor - Bottom 10% of areas';
    }

    // Enhanced area comparison with advanced metrics
    compareAreas(score1, score2, area1Name = 'Area 1', area2Name = 'Area 2') {
        const comparison = {
            overall: {
                winner: score1.overall > score2.overall ? area1Name : area2Name,
                difference: Math.abs(score1.overall - score2.overall),
                scores: {
                    [area1Name]: score1.overall,
                    [area2Name]: score2.overall
                }
            },
            categories: {},
            metrics: {},
            recommendations: []
        };

        // Compare each category
        Object.keys(this.weights).forEach(category => {
            const score1Cat = score1.categories[category] || { score: 0 };
            const score2Cat = score2.categories[category] || { score: 0 };
            
            comparison.categories[category] = {
                winner: score1Cat.score > score2Cat.score ? area1Name : area2Name,
                difference: Math.abs(score1Cat.score - score2Cat.score),
                scores: {
                    [area1Name]: score1Cat.score,
                    [area2Name]: score2Cat.score
                }
            };
        });

        // Generate comparison recommendations
        if (comparison.overall.difference > 0.1) {
            const winner = comparison.overall.winner;
            const loser = winner === area1Name ? area2Name : area1Name;
            comparison.recommendations.push(
                `${winner} offers significantly better overall quality of life than ${loser}`
            );
        } else {
            comparison.recommendations.push(
                'Both areas offer similar overall quality of life'
            );
        }

        return comparison;
    }
}

// Utility functions for scoring system
const ScoringUtils = {
    // Format score for display
    formatScore(score) {
        return Math.round(score * 100);
    },

    // Get score color based on value
    getScoreColor(score) {
        const percentage = score * 100;
        if (percentage >= 85) return '#4CAF50';
        if (percentage >= 70) return '#8BC34A';
        if (percentage >= 55) return '#FF9800';
        if (percentage >= 40) return '#FF5722';
        return '#F44336';
    },

    // Create score visualization data
    createScoreVisualization(categoryScores) {
        return Object.entries(categoryScores).map(([category, data]) => ({
            category: category,
            name: CONFIG.SERVICE_CATEGORIES[category].name,
            score: data.score,
            percentage: Math.round(data.score * 100),
            color: CONFIG.SERVICE_CATEGORIES[category].color,
            serviceCount: data.serviceCount,
            icon: CONFIG.SERVICE_CATEGORIES[category].icon
        }));
    },

    // Calculate percentile ranking (placeholder for future implementation)
    calculatePercentile(score, historicalData = []) {
        if (historicalData.length === 0) return 50; // Default to 50th percentile
        
        const sortedScores = historicalData.sort((a, b) => a - b);
        const index = sortedScores.findIndex(s => s >= score);
        
        if (index === -1) return 100;
        return Math.round((index / sortedScores.length) * 100);
    }
};

// Export classes and utilities
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        QualityOfLifeScorer,
        ScoringUtils
    };
} else {
    // Browser environment - make available globally
    window.QualityOfLifeScorer = QualityOfLifeScorer;
    window.ScoringUtils = ScoringUtils;
}
