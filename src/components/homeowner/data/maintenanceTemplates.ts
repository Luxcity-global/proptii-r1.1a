import { MaintenanceTask } from '../components/homeowner/MaintenanceManagement';

export interface MaintenanceTemplate {
    id: string;
    title: string;
    description: string;
    category: MaintenanceTask['category'];
    priority: MaintenanceTask['priority'];
    estimatedCost: {
        min: number;
        max: number;
    };
    frequency: 'monthly' | 'quarterly' | 'biannual' | 'yearly' | 'once';
    season?: 'spring' | 'summer' | 'autumn' | 'winter';
    diyDifficulty: 'easy' | 'medium' | 'hard' | 'professional';
    timeEstimate: string;
    tags: string[];
    diyGuideId?: string;
}

export const maintenanceTemplates: MaintenanceTemplate[] = [
    // HVAC Templates
    {
        id: 'hvac-001',
        title: 'Boiler Annual Service',
        description: 'Professional boiler service and safety check. Required annually for warranty and safety compliance.',
        category: 'hvac',
        priority: 'high',
        estimatedCost: { min: 80, max: 150 },
        frequency: 'yearly',
        season: 'autumn',
        diyDifficulty: 'professional',
        timeEstimate: '1-2 hours',
        tags: ['heating', 'safety', 'legal', 'warranty'],
        diyGuideId: 'guide-hvac-001'
    },
    {
        id: 'hvac-002',
        title: 'Replace HVAC Filters',
        description: 'Change air filters in heating and cooling systems to maintain efficiency and air quality.',
        category: 'hvac',
        priority: 'medium',
        estimatedCost: { min: 10, max: 30 },
        frequency: 'quarterly',
        diyDifficulty: 'easy',
        timeEstimate: '15-30 minutes',
        tags: ['air quality', 'efficiency', 'diy'],
        diyGuideId: 'guide-hvac-002'
    },
    {
        id: 'hvac-003',
        title: 'Bleed Radiators',
        description: 'Release trapped air from radiators to improve heating efficiency before winter.',
        category: 'hvac',
        priority: 'medium',
        estimatedCost: { min: 0, max: 5 },
        frequency: 'yearly',
        season: 'autumn',
        diyDifficulty: 'easy',
        timeEstimate: '30-60 minutes',
        tags: ['heating', 'efficiency', 'diy', 'winter prep'],
        diyGuideId: 'guide-hvac-003'
    },
    {
        id: 'hvac-004',
        title: 'Clean Air Conditioning Unit',
        description: 'Clean filters and coils of air conditioning unit for optimal performance.',
        category: 'hvac',
        priority: 'medium',
        estimatedCost: { min: 0, max: 50 },
        frequency: 'yearly',
        season: 'spring',
        diyDifficulty: 'medium',
        timeEstimate: '1-2 hours',
        tags: ['cooling', 'efficiency', 'summer prep'],
        diyGuideId: 'guide-hvac-004'
    },

    // Plumbing Templates
    {
        id: 'plumb-001',
        title: 'Check for Leaks',
        description: 'Inspect all taps, pipes, and connections for leaks. Early detection prevents water damage.',
        category: 'plumbing',
        priority: 'high',
        estimatedCost: { min: 0, max: 0 },
        frequency: 'quarterly',
        diyDifficulty: 'easy',
        timeEstimate: '30 minutes',
        tags: ['inspection', 'prevention', 'water damage'],
        diyGuideId: 'guide-plumb-001'
    },
    {
        id: 'plumb-002',
        title: 'Drain Water Heater',
        description: 'Flush sediment from water heater to improve efficiency and extend lifespan.',
        category: 'plumbing',
        priority: 'medium',
        estimatedCost: { min: 0, max: 100 },
        frequency: 'yearly',
        diyDifficulty: 'medium',
        timeEstimate: '1-2 hours',
        tags: ['efficiency', 'maintenance', 'hot water'],
        diyGuideId: 'guide-plumb-002'
    },
    {
        id: 'plumb-003',
        title: 'Clean Shower Heads',
        description: 'Remove limescale buildup from shower heads to maintain water pressure.',
        category: 'plumbing',
        priority: 'low',
        estimatedCost: { min: 0, max: 5 },
        frequency: 'quarterly',
        diyDifficulty: 'easy',
        timeEstimate: '15-30 minutes',
        tags: ['cleaning', 'diy', 'water pressure'],
        diyGuideId: 'guide-plumb-003'
    },
    {
        id: 'plumb-004',
        title: 'Test Water Pressure',
        description: 'Check water pressure throughout the home. Low pressure may indicate issues.',
        category: 'plumbing',
        priority: 'low',
        estimatedCost: { min: 0, max: 0 },
        frequency: 'biannual',
        diyDifficulty: 'easy',
        timeEstimate: '15 minutes',
        tags: ['inspection', 'diagnostics'],
        diyGuideId: 'guide-plumb-004'
    },
    {
        id: 'plumb-005',
        title: 'Insulate Pipes',
        description: 'Insulate exposed pipes to prevent freezing in winter and reduce heat loss.',
        category: 'plumbing',
        priority: 'medium',
        estimatedCost: { min: 20, max: 100 },
        frequency: 'once',
        season: 'autumn',
        diyDifficulty: 'easy',
        timeEstimate: '2-4 hours',
        tags: ['winter prep', 'efficiency', 'prevention'],
        diyGuideId: 'guide-plumb-005'
    },

    // Electrical Templates
    {
        id: 'elec-001',
        title: 'Test Smoke Detectors',
        description: 'Test all smoke alarms and replace batteries. Critical for safety.',
        category: 'electrical',
        priority: 'urgent',
        estimatedCost: { min: 5, max: 20 },
        frequency: 'monthly',
        diyDifficulty: 'easy',
        timeEstimate: '10 minutes',
        tags: ['safety', 'legal', 'fire prevention'],
        diyGuideId: 'guide-elec-001'
    },
    {
        id: 'elec-002',
        title: 'Test Carbon Monoxide Detectors',
        description: 'Test CO detectors and replace batteries. Essential for homes with gas appliances.',
        category: 'electrical',
        priority: 'urgent',
        estimatedCost: { min: 5, max: 20 },
        frequency: 'monthly',
        diyDifficulty: 'easy',
        timeEstimate: '10 minutes',
        tags: ['safety', 'legal', 'gas safety'],
        diyGuideId: 'guide-elec-002'
    },
    {
        id: 'elec-003',
        title: 'Test RCD/Circuit Breakers',
        description: 'Test residual current devices and circuit breakers for proper operation.',
        category: 'electrical',
        priority: 'high',
        estimatedCost: { min: 0, max: 0 },
        frequency: 'quarterly',
        diyDifficulty: 'easy',
        timeEstimate: '15 minutes',
        tags: ['safety', 'electrical', 'testing'],
        diyGuideId: 'guide-elec-003'
    },
    {
        id: 'elec-004',
        title: 'Electrical Safety Inspection',
        description: 'Professional electrical inspection (EICR). Required every 5-10 years for homeowners.',
        category: 'electrical',
        priority: 'high',
        estimatedCost: { min: 150, max: 400 },
        frequency: 'once',
        diyDifficulty: 'professional',
        timeEstimate: '2-4 hours',
        tags: ['safety', 'legal', 'inspection', 'certification'],
        diyGuideId: 'guide-elec-004'
    },

    // Exterior Templates
    {
        id: 'ext-001',
        title: 'Clean Gutters and Downspouts',
        description: 'Remove leaves and debris from gutters to prevent water damage and blockages.',
        category: 'exterior',
        priority: 'high',
        estimatedCost: { min: 50, max: 150 },
        frequency: 'biannual',
        season: 'autumn',
        diyDifficulty: 'medium',
        timeEstimate: '2-4 hours',
        tags: ['water damage', 'prevention', 'autumn', 'spring'],
        diyGuideId: 'guide-ext-001'
    },
    {
        id: 'ext-002',
        title: 'Roof Inspection',
        description: 'Check roof for missing tiles, damage, or leaks. Early detection prevents costly repairs.',
        category: 'exterior',
        priority: 'high',
        estimatedCost: { min: 0, max: 200 },
        frequency: 'yearly',
        season: 'spring',
        diyDifficulty: 'medium',
        timeEstimate: '1-2 hours',
        tags: ['inspection', 'prevention', 'water damage'],
        diyGuideId: 'guide-ext-002'
    },
    {
        id: 'ext-003',
        title: 'Seal Windows and Doors',
        description: 'Check and replace weatherstripping to improve energy efficiency and prevent drafts.',
        category: 'exterior',
        priority: 'medium',
        estimatedCost: { min: 20, max: 100 },
        frequency: 'yearly',
        season: 'autumn',
        diyDifficulty: 'easy',
        timeEstimate: '2-3 hours',
        tags: ['efficiency', 'winter prep', 'diy'],
        diyGuideId: 'guide-ext-003'
    },
    {
        id: 'ext-004',
        title: 'Pressure Wash Exterior',
        description: 'Clean exterior walls, driveway, and patio to remove dirt, mold, and algae.',
        category: 'exterior',
        priority: 'low',
        estimatedCost: { min: 50, max: 200 },
        frequency: 'yearly',
        season: 'spring',
        diyDifficulty: 'medium',
        timeEstimate: '3-5 hours',
        tags: ['cleaning', 'curb appeal', 'maintenance'],
        diyGuideId: 'guide-ext-004'
    },
    {
        id: 'ext-005',
        title: 'Paint Exterior Woodwork',
        description: 'Repaint or stain exterior wood to protect from weather damage.',
        category: 'exterior',
        priority: 'medium',
        estimatedCost: { min: 100, max: 500 },
        frequency: 'once',
        diyDifficulty: 'medium',
        timeEstimate: '1-3 days',
        tags: ['protection', 'curb appeal', 'maintenance'],
        diyGuideId: 'guide-ext-005'
    },
    {
        id: 'ext-006',
        title: 'Check Exterior Drainage',
        description: 'Ensure proper drainage away from foundation to prevent water damage.',
        category: 'exterior',
        priority: 'high',
        estimatedCost: { min: 0, max: 0 },
        frequency: 'biannual',
        season: 'spring',
        diyDifficulty: 'easy',
        timeEstimate: '30 minutes',
        tags: ['inspection', 'water damage', 'prevention'],
        diyGuideId: 'guide-ext-006'
    },

    // Interior Templates
    {
        id: 'int-001',
        title: 'Deep Clean Carpets',
        description: 'Professional or DIY deep clean of carpets to maintain appearance and hygiene.',
        category: 'interior',
        priority: 'low',
        estimatedCost: { min: 50, max: 200 },
        frequency: 'yearly',
        season: 'spring',
        diyDifficulty: 'easy',
        timeEstimate: '2-4 hours',
        tags: ['cleaning', 'hygiene', 'spring clean'],
        diyGuideId: 'guide-int-001'
    },
    {
        id: 'int-002',
        title: 'Service Kitchen Extractor',
        description: 'Clean or replace kitchen extractor filters to maintain efficiency and reduce fire risk.',
        category: 'interior',
        priority: 'medium',
        estimatedCost: { min: 10, max: 50 },
        frequency: 'quarterly',
        diyDifficulty: 'easy',
        timeEstimate: '30 minutes',
        tags: ['cleaning', 'safety', 'kitchen'],
        diyGuideId: 'guide-int-002'
    },
    {
        id: 'int-003',
        title: 'Check for Damp and Mold',
        description: 'Inspect walls, ceilings, and corners for signs of damp or mold growth.',
        category: 'interior',
        priority: 'high',
        estimatedCost: { min: 0, max: 0 },
        frequency: 'quarterly',
        diyDifficulty: 'easy',
        timeEstimate: '30 minutes',
        tags: ['inspection', 'health', 'prevention'],
        diyGuideId: 'guide-int-003'
    },
    {
        id: 'int-004',
        title: 'Seal Bathroom Grout',
        description: 'Reseal bathroom tiles and grout to prevent water damage and mold.',
        category: 'interior',
        priority: 'medium',
        estimatedCost: { min: 15, max: 50 },
        frequency: 'yearly',
        diyDifficulty: 'easy',
        timeEstimate: '1-2 hours',
        tags: ['bathroom', 'water damage', 'prevention', 'diy'],
        diyGuideId: 'guide-int-004'
    },
    {
        id: 'int-005',
        title: 'Test Door and Window Locks',
        description: 'Check all locks function properly and lubricate if needed for security.',
        category: 'interior',
        priority: 'medium',
        estimatedCost: { min: 0, max: 20 },
        frequency: 'biannual',
        diyDifficulty: 'easy',
        timeEstimate: '30 minutes',
        tags: ['security', 'maintenance', 'diy'],
        diyGuideId: 'guide-int-005'
    },

    // Appliance Templates
    {
        id: 'app-001',
        title: 'Clean Washing Machine Filter',
        description: 'Clean washing machine filter and run maintenance cycle to prevent odors and blockages.',
        category: 'appliance',
        priority: 'medium',
        estimatedCost: { min: 0, max: 5 },
        frequency: 'monthly',
        diyDifficulty: 'easy',
        timeEstimate: '15 minutes',
        tags: ['cleaning', 'appliance', 'diy'],
        diyGuideId: 'guide-app-001'
    },
    {
        id: 'app-002',
        title: 'Clean Dishwasher Filter',
        description: 'Remove and clean dishwasher filter to maintain cleaning performance.',
        category: 'appliance',
        priority: 'low',
        estimatedCost: { min: 0, max: 0 },
        frequency: 'monthly',
        diyDifficulty: 'easy',
        timeEstimate: '10 minutes',
        tags: ['cleaning', 'appliance', 'diy'],
        diyGuideId: 'guide-app-002'
    },
    {
        id: 'app-003',
        title: 'Defrost Freezer',
        description: 'Defrost and clean freezer to maintain efficiency and storage capacity.',
        category: 'appliance',
        priority: 'low',
        estimatedCost: { min: 0, max: 0 },
        frequency: 'biannual',
        diyDifficulty: 'easy',
        timeEstimate: '2-3 hours',
        tags: ['cleaning', 'efficiency', 'diy'],
        diyGuideId: 'guide-app-003'
    },
    {
        id: 'app-004',
        title: 'Clean Oven and Hob',
        description: 'Deep clean oven and hob to maintain performance and reduce fire risk.',
        category: 'appliance',
        priority: 'medium',
        estimatedCost: { min: 5, max: 50 },
        frequency: 'quarterly',
        diyDifficulty: 'easy',
        timeEstimate: '1-2 hours',
        tags: ['cleaning', 'safety', 'kitchen'],
        diyGuideId: 'guide-app-004'
    },
    {
        id: 'app-005',
        title: 'Service Tumble Dryer',
        description: 'Clean lint filter and vents to prevent fire risk and maintain efficiency.',
        category: 'appliance',
        priority: 'high',
        estimatedCost: { min: 0, max: 100 },
        frequency: 'quarterly',
        diyDifficulty: 'easy',
        timeEstimate: '30 minutes',
        tags: ['safety', 'fire prevention', 'efficiency'],
        diyGuideId: 'guide-app-005'
    },

    // Other/General Templates
    {
        id: 'other-001',
        title: 'Review Home Insurance',
        description: 'Annual review of home insurance coverage and compare quotes.',
        category: 'other',
        priority: 'medium',
        estimatedCost: { min: 0, max: 0 },
        frequency: 'yearly',
        diyDifficulty: 'easy',
        timeEstimate: '1-2 hours',
        tags: ['insurance', 'financial', 'review'],
    },
    {
        id: 'other-002',
        title: 'Update Home Inventory',
        description: 'Document valuable items and update home inventory for insurance purposes.',
        category: 'other',
        priority: 'low',
        estimatedCost: { min: 0, max: 0 },
        frequency: 'yearly',
        diyDifficulty: 'easy',
        timeEstimate: '2-3 hours',
        tags: ['insurance', 'documentation', 'security'],
    },
    {
        id: 'other-003',
        title: 'Garden Maintenance',
        description: 'Seasonal garden maintenance including lawn care, pruning, and weeding.',
        category: 'other',
        priority: 'low',
        estimatedCost: { min: 0, max: 100 },
        frequency: 'quarterly',
        diyDifficulty: 'easy',
        timeEstimate: '2-4 hours',
        tags: ['garden', 'curb appeal', 'seasonal'],
    },
    {
        id: 'other-004',
        title: 'Pest Control Check',
        description: 'Inspect for signs of pests and take preventive measures.',
        category: 'other',
        priority: 'medium',
        estimatedCost: { min: 0, max: 150 },
        frequency: 'biannual',
        season: 'spring',
        diyDifficulty: 'easy',
        timeEstimate: '1 hour',
        tags: ['inspection', 'prevention', 'health'],
    },
];

// Helper functions
export const getTemplatesByCategory = (category: MaintenanceTask['category']) => {
    return maintenanceTemplates.filter(template => template.category === category);
};

export const getTemplatesBySeason = (season: 'spring' | 'summer' | 'autumn' | 'winter') => {
    return maintenanceTemplates.filter(template => template.season === season);
};

export const getTemplatesByDifficulty = (difficulty: 'easy' | 'medium' | 'hard' | 'professional') => {
    return maintenanceTemplates.filter(template => template.diyDifficulty === difficulty);
};

export const getTemplateById = (id: string) => {
    return maintenanceTemplates.find(template => template.id === id);
};
