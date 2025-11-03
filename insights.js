// Insights Generation Engine for Quality of Life Map Web App
// Phase 5: AI-like insights and recommendations system

/**
 * InsightsGenerator Class
 * Generates meaningful assessments, recommendations, and natural language summaries
 * based on quality of life scores and service data
 */
class InsightsGenerator {
    constructor() {
        this.insightTemplates = this.initializeInsightTemplates();
        this.recommendationRules = this.initializeRecommendationRules();
        this.demographicProfiles = this.initializeDemographicProfiles();
        this.contextualFactors = this.initializeContextualFactors();
        
        // Insight generation parameters
        this.strengthThreshold = 0.70;  // Score above which category is considered a strength
        this.weaknessThreshold = 0.40;  // Score below which category is considered a weakness
        this.excellentThreshold = 0.85; // Score for excellent rating
        this.poorThreshold = 0.25;      // Score for poor rating
        
        // Natural language generation settings
        this.verbosityLevel = 'balanced'; // 'concise', 'balanced', 'detailed'
        this.toneStyle = 'professional';  // 'casual', 'professional', 'technical'
    }

    /**
     * Main method to generate comprehensive area insights
     * @param {Object} scores - Quality of life scores from QualityOfLifeScorer
     * @param {Object} services - Service data by category
     * @param {Object} options - Generation options (demographic, context, etc.)
     * @returns {Object} Complete insights package
     */
    generateAreaInsights(scores, services, options = {}) {
        const {
            demographic = 'general',
            timeContext = 'general',
            includeComparison = false,
            comparisonData = null,
            verbosity = this.verbosityLevel,
            tone = this.toneStyle
        } = options;

        try {
            // Core insight components
            const overallAssessment = this.getOverallAssessment(scores.overall, scores.grade);
            const strengths = this.identifyStrengths(scores.categories, services);
            const weaknesses = this.identifyWeaknesses(scores.categories, services);
            const opportunities = this.identifyOpportunities(scores.categories, services);
            
            // Demographic-specific insights
            const demographicInsights = this.generateDemographicInsights(
                scores.categories, 
                demographic, 
                services
            );
            
            // Contextual recommendations
            const recommendations = this.getRecommendations(
                scores, 
                services, 
                demographic, 
                timeContext
            );
            
            // Regional comparison (if data available)
            const comparison = includeComparison && comparisonData ? 
                this.getRegionalComparison(scores, comparisonData) : null;
            
            // Accessibility and mobility insights
            const accessibilityInsights = this.generateAccessibilityInsights(scores.categories);
            
            // Walkability and transport insights
            const mobilityInsights = this.generateMobilityInsights(scores.categories, services);
            
            // Quality consistency analysis
            const qualityInsights = this.generateQualityConsistencyInsights(scores.categories);
            
            // Future potential assessment
            const futureOutlook = this.assessFuturePotential(scores, services);
            
            // Natural language summary
            const summary = this.generateNaturalLanguageSummary({
                overallAssessment,
                strengths,
                weaknesses,
                demographic,
                scores
            }, { verbosity, tone });
            
            // Actionable insights
            const actionableInsights = this.generateActionableInsights(
                weaknesses, 
                opportunities, 
                demographic
            );

            return this.formatInsights({
                summary,
                overallAssessment,
                strengths,
                weaknesses,
                opportunities,
                recommendations,
                demographicInsights,
                accessibilityInsights,
                mobilityInsights,
                qualityInsights,
                futureOutlook,
                actionableInsights,
                comparison,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    demographic,
                    timeContext,
                    verbosity,
                    tone,
                    version: '5.0'
                }
            });

        } catch (error) {
            console.error('Error generating area insights:', error);
            return this.getEmptyInsights();
        }
    }

    /**
     * Generate overall assessment of the area
     */
    getOverallAssessment(overallScore, grade) {
        const percentage = Math.round(overallScore * 100);
        const level = this.getAssessmentLevel(overallScore);
        
        const assessments = {
            excellent: {
                title: 'Exceptional Quality of Life',
                description: 'This area offers outstanding living conditions with excellent access to essential services and amenities.',
                highlights: ['Top-tier service availability', 'Excellent accessibility', 'High-quality amenities'],
                concerns: []
            },
            good: {
                title: 'Good Quality of Life',
                description: 'This location provides solid living conditions with good access to most essential services.',
                highlights: ['Good service coverage', 'Reasonable accessibility', 'Adequate amenities'],
                concerns: ['Some areas for improvement']
            },
            average: {
                title: 'Average Quality of Life',
                description: 'This area offers adequate living conditions with mixed service availability.',
                highlights: ['Basic service coverage', 'Moderate accessibility'],
                concerns: ['Several areas need improvement', 'Limited service options in some categories']
            },
            below_average: {
                title: 'Below Average Quality of Life',
                description: 'This location has limited amenities and service access that may impact daily living.',
                highlights: ['Some basic services available'],
                concerns: ['Limited service options', 'Accessibility challenges', 'Significant gaps in amenities']
            },
            poor: {
                title: 'Limited Quality of Life',
                description: 'This area has significant limitations in service access and amenities.',
                highlights: [],
                concerns: ['Very limited services', 'Poor accessibility', 'Major infrastructure gaps']
            }
        };

        return {
            level,
            score: percentage,
            grade: grade.label,
            ...assessments[level],
            percentileContext: this.getPercentileContext(percentage)
        };
    }

    /**
     * Identify area strengths based on high-performing categories
     */
    identifyStrengths(categories, services) {
        const strengths = [];
        
        Object.entries(categories).forEach(([category, data]) => {
            if (data.score >= this.strengthThreshold) {
                const categoryConfig = CONFIG.SERVICE_CATEGORIES[category];
                const serviceList = services[category] || [];
                
                const strength = {
                    category: categoryConfig.name,
                    categoryKey: category,
                    score: Math.round(data.score * 100),
                    level: this.getStrengthLevel(data.score),
                    serviceCount: data.serviceCount || serviceList.length,
                    averageDistance: data.averageDistance,
                    topServices: data.topServices || [],
                    reasons: this.getStrengthReasons(category, data, serviceList),
                    impact: this.getStrengthImpact(category, data.score)
                };
                
                strengths.push(strength);
            }
        });
        
        // Sort by score (highest first)
        return strengths.sort((a, b) => b.score - a.score);
    }

    /**
     * Identify areas for improvement based on low-performing categories
     */
    identifyWeaknesses(categories, services) {
        const weaknesses = [];
        
        Object.entries(categories).forEach(([category, data]) => {
            if (data.score < this.weaknessThreshold) {
                const categoryConfig = CONFIG.SERVICE_CATEGORIES[category];
                const serviceList = services[category] || [];
                
                const weakness = {
                    category: categoryConfig.name,
                    categoryKey: category,
                    score: Math.round(data.score * 100),
                    level: this.getWeaknessLevel(data.score),
                    serviceCount: data.serviceCount || serviceList.length,
                    averageDistance: data.averageDistance,
                    issues: this.getWeaknessIssues(category, data, serviceList),
                    impact: this.getWeaknessImpact(category, data.score),
                    suggestions: this.getImprovementSuggestions(category, data)
                };
                
                weaknesses.push(weakness);
            }
        });
        
        // Sort by severity (lowest score first)
        return weaknesses.sort((a, b) => a.score - b.score);
    }

    /**
     * Identify opportunities for improvement in average-performing categories
     */
    identifyOpportunities(categories, services) {
        const opportunities = [];
        
        Object.entries(categories).forEach(([category, data]) => {
            if (data.score >= this.weaknessThreshold && data.score < this.strengthThreshold) {
                const categoryConfig = CONFIG.SERVICE_CATEGORIES[category];
                const serviceList = services[category] || [];
                
                const opportunity = {
                    category: categoryConfig.name,
                    categoryKey: category,
                    score: Math.round(data.score * 100),
                    potential: this.assessImprovementPotential(category, data, serviceList),
                    quickWins: this.identifyQuickWins(category, data, serviceList),
                    longTermGoals: this.identifyLongTermGoals(category, data)
                };
                
                opportunities.push(opportunity);
            }
        });
        
        return opportunities.sort((a, b) => b.potential - a.potential);
    }

    /**
     * Generate demographic-specific insights
     */
    generateDemographicInsights(categories, demographic, services) {
        const profile = this.demographicProfiles[demographic];
        if (!profile) return [];

        const insights = [];
        
        // Check priority categories for this demographic
        profile.priorities.forEach(priority => {
            const categoryData = categories[priority.category];
            if (categoryData) {
                const insight = this.generateDemographicCategoryInsight(
                    priority, 
                    categoryData, 
                    services[priority.category] || []
                );
                if (insight) insights.push(insight);
            }
        });
        
        // Generate lifestyle compatibility insights
        const lifestyleInsight = this.generateLifestyleCompatibility(categories, demographic);
        if (lifestyleInsight) insights.push(lifestyleInsight);
        
        // Generate specific recommendations for this demographic
        const specificRecommendations = this.generateDemographicRecommendations(
            categories, 
            demographic, 
            services
        );
        if (specificRecommendations.length > 0) {
            insights.push({
                type: 'recommendations',
                title: `Recommendations for ${profile.name}`,
                items: specificRecommendations
            });
        }
        
        return insights;
    }

    /**
     * Generate contextual recommendations based on scores and demographic
     */
    getRecommendations(scores, services, demographic, timeContext) {
        const recommendations = [];
        
        // Priority-based recommendations
        const priorityRecs = this.generatePriorityRecommendations(scores.categories, demographic);
        recommendations.push(...priorityRecs);
        
        // Service-specific recommendations
        const serviceRecs = this.generateServiceRecommendations(services, demographic);
        recommendations.push(...serviceRecs);
        
        // Accessibility recommendations
        const accessRecs = this.generateAccessibilityRecommendations(scores.categories);
        recommendations.push(...accessRecs);
        
        // Time-context recommendations
        const timeRecs = this.generateTimeContextRecommendations(scores.categories, timeContext);
        recommendations.push(...timeRecs);
        
        // Quality improvement recommendations
        const qualityRecs = this.generateQualityRecommendations(scores.categories, services);
        recommendations.push(...qualityRecs);
        
        return this.prioritizeRecommendations(recommendations, demographic);
    }

    /**
     * Generate natural language summary using templates
     */
    generateNaturalLanguageSummary(insightData, options = {}) {
        const { verbosity = 'balanced', tone = 'professional' } = options;
        const { overallAssessment, strengths, weaknesses, demographic, scores } = insightData;
        
        const templates = this.insightTemplates[tone] || this.insightTemplates.professional;
        const template = templates[overallAssessment.level] || templates.average;
        
        let summary = template.base;
        
        // Replace placeholders with actual data
        summary = summary.replace('{score}', Math.round(scores.overall * 100));
        summary = summary.replace('{grade}', scores.grade.label);
        
        // Add strengths
        if (strengths.length > 0) {
            const strengthNames = strengths.slice(0, 2).map(s => s.category.toLowerCase());
            summary = summary.replace('{strengths}', this.formatList(strengthNames));
            
            if (verbosity === 'detailed' && strengths.length > 0) {
                summary += ` ${template.strengthDetail.replace('{topStrength}', strengths[0].category)}`;
            }
        } else {
            summary = summary.replace('{strengths}', 'basic amenities');
        }
        
        // Add weaknesses
        if (weaknesses.length > 0) {
            const weaknessNames = weaknesses.slice(0, 2).map(w => w.category.toLowerCase());
            summary = summary.replace('{weaknesses}', this.formatList(weaknessNames));
            
            if (verbosity === 'detailed' && weaknesses.length > 0) {
                summary += ` ${template.weaknessDetail.replace('{topWeakness}', weaknesses[0].category)}`;
            }
        } else {
            summary = summary.replace(' though {weaknesses} could be improved', '');
            summary = summary.replace(', areas for improvement: {weaknesses}', '');
        }
        
        // Add demographic context
        if (demographic !== 'general' && verbosity !== 'concise') {
            const demographicContext = this.getDemographicContext(demographic, strengths, weaknesses);
            if (demographicContext) {
                summary += ` ${demographicContext}`;
            }
        }
        
        // Add percentile context for detailed summaries
        if (verbosity === 'detailed' && overallAssessment.percentileContext) {
            summary += ` ${overallAssessment.percentileContext}`;
        }
        
        return summary.trim();
    }

    /**
     * Generate actionable insights that users can act upon
     */
    generateActionableInsights(weaknesses, opportunities, demographic) {
        const actionable = [];
        
        // Immediate actions for weaknesses
        weaknesses.forEach(weakness => {
            const actions = this.getImmediateActions(weakness, demographic);
            if (actions.length > 0) {
                actionable.push({
                    type: 'immediate',
                    category: weakness.category,
                    priority: 'high',
                    timeframe: 'immediate',
                    actions: actions
                });
            }
        });
        
        // Short-term opportunities
        opportunities.forEach(opportunity => {
            const actions = this.getShortTermActions(opportunity, demographic);
            if (actions.length > 0) {
                actionable.push({
                    type: 'opportunity',
                    category: opportunity.category,
                    priority: 'medium',
                    timeframe: 'short-term',
                    actions: actions
                });
            }
        });
        
        return actionable.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Initialize insight templates for different tones and assessment levels
     */
    initializeInsightTemplates() {
        return {
            professional: {
                excellent: {
                    base: "This area demonstrates exceptional quality of life with a score of {score}/100 ({grade}). Outstanding performance in {strengths} creates an excellent living environment.",
                    strengthDetail: "Particularly noteworthy is the superior {topStrength} infrastructure.",
                    weaknessDetail: "Minor considerations include {topWeakness} accessibility."
                },
                good: {
                    base: "This location offers good quality of life with a score of {score}/100 ({grade}). Strong performance in {strengths} provides solid living conditions, though {weaknesses} could benefit from improvement.",
                    strengthDetail: "The area excels particularly in {topStrength} services.",
                    weaknessDetail: "Primary areas for enhancement focus on {topWeakness} infrastructure."
                },
                average: {
                    base: "This area provides adequate quality of life with a score of {score}/100 ({grade}). Notable strengths in {strengths}, while {weaknesses} present opportunities for improvement.",
                    strengthDetail: "The {topStrength} sector shows promising development.",
                    weaknessDetail: "Addressing {topWeakness} limitations would significantly enhance livability."
                },
                below_average: {
                    base: "This location shows limited quality of life with a score of {score}/100 ({grade}). While some strengths exist in {strengths}, significant improvements needed in {weaknesses}.",
                    strengthDetail: "The available {topStrength} services provide some positive aspects.",
                    weaknessDetail: "Critical attention required for {topWeakness} infrastructure development."
                },
                poor: {
                    base: "This area faces substantial quality of life challenges with a score of {score}/100 ({grade}). Comprehensive improvements needed across {weaknesses} to enhance livability.",
                    strengthDetail: "Limited {topStrength} options provide minimal positive elements.",
                    weaknessDetail: "Urgent infrastructure development required in {topWeakness} sector."
                }
            },
            casual: {
                excellent: {
                    base: "This place is fantastic for quality of life! With a {score}/100 score ({grade}), you'll love the amazing {strengths} here.",
                    strengthDetail: "The {topStrength} options are really impressive.",
                    weaknessDetail: "Just keep in mind that {topWeakness} could be better."
                },
                good: {
                    base: "This is a pretty good spot to live with a {score}/100 score ({grade}). Great {strengths}, though you might want to consider the {weaknesses} situation.",
                    strengthDetail: "You'll really appreciate the {topStrength} here.",
                    weaknessDetail: "The {topWeakness} could use some work, but it's manageable."
                },
                average: {
                    base: "This area is decent for living with a {score}/100 score ({grade}). Good points include {strengths}, but {weaknesses} might be a concern.",
                    strengthDetail: "The {topStrength} is actually quite nice.",
                    weaknessDetail: "You'll probably notice the {topWeakness} limitations."
                },
                below_average: {
                    base: "This location has some challenges with a {score}/100 score ({grade}). There are some positives like {strengths}, but {weaknesses} are pretty limited.",
                    strengthDetail: "At least the {topStrength} isn't too bad.",
                    weaknessDetail: "The {topWeakness} situation definitely needs improvement."
                },
                poor: {
                    base: "This area has significant limitations with a {score}/100 score ({grade}). You'll face challenges with {weaknesses} and limited options overall.",
                    strengthDetail: "There are very few {topStrength} options available.",
                    weaknessDetail: "The {topWeakness} situation is quite challenging."
                }
            }
        };
    }

    /**
     * Initialize recommendation rules for different scenarios
     */
    initializeRecommendationRules() {
        return {
            transport: {
                poor: [
                    "Consider proximity to major transit hubs when choosing accommodation",
                    "Evaluate car ownership necessity for daily commuting",
                    "Look into bike-friendly routes and infrastructure"
                ],
                average: [
                    "Explore multiple transport options for flexibility",
                    "Consider off-peak travel times for better service"
                ],
                good: [
                    "Take advantage of excellent transport connectivity",
                    "Consider sustainable transport options"
                ]
            },
            education: {
                poor: [
                    "Research online learning opportunities",
                    "Consider commuting to better educational facilities",
                    "Look into private education alternatives"
                ],
                average: [
                    "Explore specialized programs in nearby institutions",
                    "Consider supplementary educational resources"
                ],
                good: [
                    "Take advantage of diverse educational opportunities",
                    "Consider continuing education programs"
                ]
            },
            healthcare: {
                poor: [
                    "Establish relationships with healthcare providers in nearby areas",
                    "Consider health insurance with broader network coverage",
                    "Maintain emergency healthcare contact information"
                ],
                average: [
                    "Research specialist services in the region",
                    "Consider preventive care options"
                ],
                good: [
                    "Take advantage of comprehensive healthcare options",
                    "Consider wellness and preventive programs"
                ]
            },
            social: {
                poor: [
                    "Explore online communities and virtual activities",
                    "Consider joining regional clubs or organizations",
                    "Look into community centers in nearby areas"
                ],
                average: [
                    "Engage with local community groups",
                    "Explore seasonal activities and events"
                ],
                good: [
                    "Take full advantage of diverse social opportunities",
                    "Consider volunteering or community leadership roles"
                ]
            },
            essential: {
                poor: [
                    "Plan for longer trips to access essential services",
                    "Consider bulk shopping and service consolidation",
                    "Explore online alternatives for routine services"
                ],
                average: [
                    "Optimize service access through planning",
                    "Consider service quality vs. convenience trade-offs"
                ],
                good: [
                    "Enjoy convenient access to essential services",
                    "Consider supporting local businesses"
                ]
            }
        };
    }

    /**
     * Initialize demographic profiles with priorities and characteristics
     */
    initializeDemographicProfiles() {
        return {
            families: {
                name: 'Families',
                priorities: [
                    { category: 'education', weight: 1.3, importance: 'critical' },
                    { category: 'healthcare', weight: 1.2, importance: 'high' },
                    { category: 'social', weight: 1.1, importance: 'high' },
                    { category: 'essential', weight: 1.1, importance: 'medium' },
                    { category: 'transport', weight: 1.0, importance: 'medium' }
                ],
                keyFactors: ['school quality', 'pediatric care', 'family activities', 'safety'],
                concerns: ['education access', 'child-friendly amenities', 'healthcare for children']
            },
            professionals: {
                name: 'Young Professionals',
                priorities: [
                    { category: 'transport', weight: 1.3, importance: 'critical' },
                    { category: 'essential', weight: 1.2, importance: 'high' },
                    { category: 'social', weight: 1.1, importance: 'high' },
                    { category: 'healthcare', weight: 1.0, importance: 'medium' },
                    { category: 'education', weight: 0.8, importance: 'low' }
                ],
                keyFactors: ['commute convenience', 'networking opportunities', 'work-life balance', 'career growth'],
                concerns: ['commuting time', 'professional networking', 'lifestyle amenities']
            },
            seniors: {
                name: 'Seniors',
                priorities: [
                    { category: 'healthcare', weight: 1.4, importance: 'critical' },
                    { category: 'transport', weight: 1.3, importance: 'critical' },
                    { category: 'essential', weight: 1.2, importance: 'high' },
                    { category: 'social', weight: 1.1, importance: 'medium' },
                    { category: 'education', weight: 0.7, importance: 'low' }
                ],
                keyFactors: ['medical access', 'mobility support', 'social engagement', 'safety'],
                concerns: ['healthcare accessibility', 'mobility limitations', 'social isolation']
            },
            students: {
                name: 'Students',
                priorities: [
                    { category: 'education', weight: 1.4, importance: 'critical' },
                    { category: 'transport', weight: 1.2, importance: 'high' },
                    { category: 'social', weight: 1.3, importance: 'high' },
                    { category: 'essential', weight: 1.0, importance: 'medium' },
                    { category: 'healthcare', weight: 0.9, importance: 'medium' }
                ],
                keyFactors: ['campus access', 'affordable transport', 'study spaces', 'social life'],
                concerns: ['education costs', 'transport affordability', 'social opportunities']
            },
            general: {
                name: 'General Population',
                priorities: [
                    { category: 'transport', weight: 1.0, importance: 'high' },
                    { category: 'healthcare', weight: 1.0, importance: 'high' },
                    { category: 'education', weight: 1.0, importance: 'medium' },
                    { category: 'social', weight: 1.0, importance: 'medium' },
                    { category: 'essential', weight: 1.0, importance: 'medium' }
                ],
                keyFactors: ['balanced access', 'convenience', 'quality of life', 'affordability'],
                concerns: ['overall accessibility', 'service quality', 'cost of living']
            }
        };
    }

    /**
     * Initialize contextual factors for different scenarios
     */
    initializeContextualFactors() {
        return {
            timeOfDay: {
                peak_hours: {
                    transport: { multiplier: 1.2, note: 'Consider peak hour congestion' },
                    essential: { multiplier: 0.9, note: 'Services may be crowded during peak hours' }
                },
                off_peak: {
                    transport: { multiplier: 0.9, note: 'Better transport availability off-peak' },
                    essential: { multiplier: 1.1, note: 'More convenient service access off-peak' }
                }
            },
            dayOfWeek: {
                weekend: {
                    social: { multiplier: 1.3, note: 'Enhanced weekend social opportunities' },
                    education: { multiplier: 0.7, note: 'Limited educational services on weekends' }
                }
            },
            season: {
                winter: {
                    transport: { multiplier: 0.9, note: 'Weather may impact transport reliability' },
                    social: { multiplier: 0.8, note: 'Reduced outdoor social activities in winter' }
                },
                summer: {
                    social: { multiplier: 1.2, note: 'Increased outdoor activities in summer' }
                }
            }
        };
    }

    // Helper methods for insight generation

    getAssessmentLevel(score) {
        if (score >= 0.85) return 'excellent';
        if (score >= 0.70) return 'good';
        if (score >= 0.55) return 'average';
        if (score >= 0.40) return 'below_average';
        return 'poor';
    }

    getStrengthLevel(score) {
        if (score >= 0.90) return 'exceptional';
        if (score >= 0.80) return 'excellent';
        if (score >= 0.70) return 'good';
        return 'adequate';
    }

    getWeaknessLevel(score) {
        if (score < 0.20) return 'critical';
        if (score < 0.30) return 'severe';
        if (score < 0.40) return 'moderate';
        return 'minor';
    }

    getStrengthReasons(category, data, services) {
        const reasons = [];
        
        if (data.serviceCount > 10) {
            reasons.push('Abundant service options available');
        }
        if (data.averageDistance && data.averageDistance < 800) {
            reasons.push('Services within walking distance');
        }
        if (data.accessibilityScore && data.accessibilityScore > 0.8) {
            reasons.push('Highly accessible services');
        }
        if (data.qualityDistribution && data.qualityDistribution.excellent > 0) {
            reasons.push('High-quality service providers');
        }
        
        return reasons;
    }

    getWeaknessIssues(category, data, services) {
        const issues = [];
        
        if (data.serviceCount === 0) {
            issues.push('No services found in this category');
        } else if (data.serviceCount < 3) {
            issues.push('Very limited service options');
        }
        
        if (data.averageDistance && data.averageDistance > 2000) {
            issues.push('Services require significant travel');
        }
        
        if (data.accessibilityScore && data.accessibilityScore < 0.4) {
            issues.push('Poor service accessibility');
        }
        
        return issues;
    }

    getStrengthImpact(category, score) {
        const impacts = {
            transport: 'Excellent mobility and commuting options',
            education: 'Strong learning and development opportunities',
            healthcare: 'Comprehensive health and wellness support',
            social: 'Rich community and recreational experiences',
            essential: 'Convenient daily life management'
        };
        
        return impacts[category] || 'Positive impact on quality of life';
    }

    getWeaknessImpact(category, score) {
        const impacts = {
            transport: 'Limited mobility may affect daily commuting',
            education: 'Reduced access to learning opportunities',
            healthcare: 'Potential challenges accessing medical care',
            social: 'Limited community engagement opportunities',
            essential: 'Inconvenient access to daily necessities'
        };
        
        return impacts[category] || 'May negatively impact quality of life';
    }

    formatList(items) {
        if (items.length === 0) return '';
        if (items.length === 1) return items[0];
        if (items.length === 2) return `${items[0]} and ${items[1]}`;
        return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
    }

    getPercentileContext(percentage) {
        if (percentage >= 90) return 'This places it among the top 10% of areas assessed.';
        if (percentage >= 75) return 'This ranks in the top 25% of evaluated locations.';
        if (percentage >= 60) return 'This performs better than most comparable areas.';
        if (percentage >= 40) return 'This shows typical performance for similar locations.';
        if (percentage >= 25) return 'This ranks below most comparable areas.';
        return 'This falls in the bottom quartile of assessed locations.';
    }

    getDemographicContext(demographic, strengths, weaknesses) {
        const profile = this.demographicProfiles[demographic];
        if (!profile) return null;
        
        const relevantStrengths = strengths.filter(s => 
            profile.priorities.some(p => p.category === s.categoryKey && p.importance === 'critical')
        );
        
        const relevantWeaknesses = weaknesses.filter(w => 
            profile.priorities.some(p => p.category === w.categoryKey && p.importance === 'critical')
        );
        
        if (relevantStrengths.length > 0) {
            return `This area is particularly well-suited for ${profile.name.toLowerCase()}.`;
        } else if (relevantWeaknesses.length > 0) {
            return `${profile.name} may face some challenges in this location.`;
        }
        
        return null;
    }

    // Additional helper methods would continue here...
    // (Implementing remaining methods for completeness)

    assessImprovementPotential(category, data, services) {
        let potential = 50; // Base potential
        
        if (data.serviceCount > 0) potential += 20;
        if (data.averageDistance && data.averageDistance < 1500) potential += 15;
        if (data.accessibilityScore && data.accessibilityScore > 0.5) potential += 15;
        
        return Math.min(100, potential);
    }

    identifyQuickWins(category, data, services) {
        const quickWins = [];
        
        if (data.accessibilityScore && data.accessibilityScore < 0.6) {
            quickWins.push('Improve service accessibility and operating hours');
        }
        
        if (services.length > 0 && data.averageDistance > 1000) {
            quickWins.push('Enhance transport connections to existing services');
        }
        
        return quickWins;
    }

    identifyLongTermGoals(category, data) {
        const goals = [];
        
        if (data.serviceCount < 5) {
            goals.push('Increase number of service providers in the area');
        }
        
        if (data.diversityScore && data.diversityScore < 0.5) {
            goals.push('Diversify service types and options');
        }
        
        return goals;
    }

    generateAccessibilityInsights(categories) {
        const insights = [];
        
        const avgAccessibility = Object.values(categories)
            .reduce((sum, cat) => sum + (cat.accessibilityScore || 0), 0) / Object.keys(categories).length;
        
        if (avgAccessibility > 0.8) {
            insights.push('Excellent accessibility across all service categories');
        } else if (avgAccessibility > 0.6) {
            insights.push('Good accessibility with some room for improvement');
        } else if (avgAccessibility > 0.4) {
            insights.push('Moderate accessibility - consider transport options');
        } else {
            insights.push('Accessibility challenges may impact daily activities');
        }
        
        return insights;
    }

    generateMobilityInsights(categories, services) {
        const insights = [];
        const transportData = categories.transport;
        
        if (transportData) {
            if (transportData.score > 0.8) {
                insights.push('Excellent transport connectivity supports easy mobility');
            } else if (transportData.score > 0.6) {
                insights.push('Good transport options available for most needs');
            } else if (transportData.score > 0.4) {
                insights.push('Limited transport options may require planning');
            } else {
                insights.push('Poor transport connectivity - consider alternative mobility solutions');
            }
        }
        
        return insights;
    }

    generateQualityConsistencyInsights(categories) {
        const insights = [];
        const scores = Object.values(categories).map(cat => cat.score);
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        
        if (variance < 0.05) {
            insights.push('Consistent quality across all service categories');
        } else if (variance < 0.15) {
            insights.push('Generally balanced service quality with some variation');
        } else {
            insights.push('Significant quality variation between service categories');
        }
        
        return insights;
    }

    assessFuturePotential(scores, services) {
        // Simplified future potential assessment
        const totalServices = Object.values(services).reduce((sum, cat) => sum + cat.length, 0);
        const avgScore = scores.overall;
        
        let potential = 'moderate';
        
        if (avgScore > 0.7 && totalServices > 50) {
            potential = 'high';
        } else if (avgScore < 0.4 || totalServices < 10) {
            potential = 'limited';
        }
        
        return {
            level: potential,
            factors: this.getFuturePotentialFactors(scores, services),
            outlook: this.getFutureOutlook(potential)
        };
    }

    getFuturePotentialFactors(scores, services) {
        const factors = [];
        
        if (scores.overall > 0.6) {
            factors.push('Strong foundation for continued development');
        }
        
        const totalServices = Object.values(services).reduce((sum, cat) => sum + cat.length, 0);
        if (totalServices > 30) {
            factors.push('Robust service infrastructure supports growth');
        }
        
        return factors;
    }

    getFutureOutlook(potential) {
        const outlooks = {
            high: 'Excellent prospects for continued improvement and development',
            moderate: 'Good potential for targeted improvements in key areas',
            limited: 'Significant investment needed to improve quality of life'
        };
        
        return outlooks[potential] || outlooks.moderate;
    }

    // Placeholder methods for remaining functionality
    generateDemographicCategoryInsight(priority, categoryData, services) {
        // Implementation would generate specific insights for demographic priorities
        return null;
    }

    generateLifestyleCompatibility(categories, demographic) {
        // Implementation would assess lifestyle fit for demographic
        return null;
    }

    generateDemographicRecommendations(categories, demographic, services) {
        // Implementation would generate demographic-specific recommendations
        return [];
    }

    generatePriorityRecommendations(categories, demographic) {
        // Implementation would generate priority-based recommendations
        return [];
    }

    generateServiceRecommendations(services, demographic) {
        // Implementation would generate service-specific recommendations
        return [];
    }

    generateAccessibilityRecommendations(categories) {
        // Implementation would generate accessibility recommendations
        return [];
    }

    generateTimeContextRecommendations(categories, timeContext) {
        // Implementation would generate time-context recommendations
        return [];
    }

    generateQualityRecommendations(categories, services) {
        // Implementation would generate quality improvement recommendations
        return [];
    }

    prioritizeRecommendations(recommendations, demographic) {
        // Implementation would prioritize recommendations based on demographic
        return recommendations;
    }

    getImprovementSuggestions(category, data) {
        // Implementation would generate improvement suggestions
        return [];
    }

    getImmediateActions(weakness, demographic) {
        // Implementation would generate immediate actions
        return [];
    }

    getShortTermActions(opportunity, demographic) {
        // Implementation would generate short-term actions
        return [];
    }

    getRegionalComparison(scores, comparisonData) {
        // Implementation would generate regional comparison
        return null;
    }

    formatInsights(insights) {
        return insights;
    }

    getEmptyInsights() {
        return {
            summary: 'Unable to generate insights - insufficient data',
            overallAssessment: null,
            strengths: [],
            weaknesses: [],
            recommendations: [],
            metadata: {
                generatedAt: new Date().toISOString(),
                error: 'Insufficient data for insight generation'
            }
        };
    }
}

// Utility functions for insights generation
const InsightsUtils = {
    /**
     * Format insights for display in UI
     */
    formatInsightsForDisplay(insights) {
        if (!insights) return null;
        
        return {
            summary: insights.summary,
            sections: [
                {
                    title: 'Overall Assessment',
                    content: insights.overallAssessment,
                    type: 'assessment'
                },
                {
                    title: 'Strengths',
                    content: insights.strengths,
                    type: 'strengths'
                },
                {
                    title: 'Areas for Improvement',
                    content: insights.weaknesses,
                    type: 'weaknesses'
                },
                {
                    title: 'Recommendations',
                    content: insights.recommendations,
                    type: 'recommendations'
                }
            ].filter(section => section.content && 
                (Array.isArray(section.content) ? section.content.length > 0 : true))
        };
    },

    /**
     * Generate insights comparison between multiple areas
     */
    compareAreaInsights(insightsArray) {
        if (!insightsArray || insightsArray.length < 2) return null;
        
        const comparison = {
            bestOverall: null,
            categoryLeaders: {},
            commonStrengths: [],
            commonWeaknesses: [],
            uniqueFeatures: []
        };
        
        // Find best overall
        comparison.bestOverall = insightsArray.reduce((best, current) => 
            current.overallAssessment?.score > best.overallAssessment?.score ? current : best
        );
        
        return comparison;
    },

    /**
     * Extract key metrics from insights
     */
    extractKeyMetrics(insights) {
        if (!insights) return {};
        
        return {
            overallScore: insights.overallAssessment?.score || 0,
            strengthCount: insights.strengths?.length || 0,
            weaknessCount: insights.weaknesses?.length || 0,
            recommendationCount: insights.recommendations?.length || 0,
            assessmentLevel: insights.overallAssessment?.level || 'unknown'
        };
    }
};

// Export classes and utilities
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        InsightsGenerator,
        InsightsUtils
    };
} else {
    // Browser environment - make available globally
    window.InsightsGenerator = InsightsGenerator;
    window.InsightsUtils = InsightsUtils;
}
