export interface DIYStep {
    stepNumber: number;
    title: string;
    description: string;
    warning?: string;
    tip?: string;
    imageUrl?: string;
}

export interface DIYGuide {
    id: string;
    title: string;
    category: 'hvac' | 'plumbing' | 'electrical' | 'appliance' | 'exterior' | 'interior' | 'other';
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    estimatedCost: { min: number; max: number };
    description: string;
    whenToCallPro: string[];
    toolsNeeded: string[];
    materialsNeeded: string[];
    safetyWarnings: string[];
    steps: DIYStep[];
    videoUrl?: string;
    relatedGuides?: string[];
}

export const diyGuides: DIYGuide[] = [
    // HVAC Guides
    {
        id: 'guide-hvac-002',
        title: 'How to Replace HVAC Filters',
        category: 'hvac',
        difficulty: 'easy',
        estimatedTime: '15-30 minutes',
        estimatedCost: { min: 10, max: 30 },
        description: 'Learn how to replace your heating and cooling system filters to improve air quality and system efficiency.',
        whenToCallPro: [
            'System not turning on after filter replacement',
            'Unusual noises from the system',
            'Filter compartment is damaged or inaccessible'
        ],
        toolsNeeded: ['None'],
        materialsNeeded: ['Replacement filter (correct size)', 'Vacuum cleaner (optional)'],
        safetyWarnings: [
            'Turn off the system before replacing filters',
            'Wear a dust mask if you have allergies'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Turn Off Your System',
                description: 'Switch off your heating/cooling system at the thermostat and wait 5 minutes for it to fully stop.',
                warning: 'Never attempt to change filters while the system is running'
            },
            {
                stepNumber: 2,
                title: 'Locate the Filter',
                description: 'Find the filter compartment - usually located in the return air duct or near the furnace/air handler.',
                tip: 'Check your system manual if you cannot locate the filter'
            },
            {
                stepNumber: 3,
                title: 'Remove Old Filter',
                description: 'Slide out the old filter, noting the direction of airflow arrows on the frame.',
                tip: 'Take a photo of the filter size and airflow direction for reference'
            },
            {
                stepNumber: 4,
                title: 'Clean the Area',
                description: 'Vacuum any dust around the filter compartment before installing the new filter.',
            },
            {
                stepNumber: 5,
                title: 'Install New Filter',
                description: 'Insert the new filter with arrows pointing in the same direction as the old one (towards the furnace).',
                warning: 'Installing the filter backwards reduces efficiency'
            },
            {
                stepNumber: 6,
                title: 'Turn System Back On',
                description: 'Close the filter compartment securely and turn your system back on. Check for proper airflow.',
            }
        ],
        videoUrl: 'https://www.youtube.com/watch?v=example',
        relatedGuides: ['guide-hvac-001', 'guide-hvac-004']
    },
    {
        id: 'guide-hvac-003',
        title: 'How to Bleed Radiators',
        category: 'hvac',
        difficulty: 'easy',
        estimatedTime: '30-60 minutes',
        estimatedCost: { min: 0, max: 5 },
        description: 'Release trapped air from your radiators to improve heating efficiency and eliminate cold spots.',
        whenToCallPro: [
            'Water is discolored or smells bad (system may need flushing)',
            'Radiators still cold after bleeding',
            'Boiler pressure keeps dropping',
            'Leaking valves or connections'
        ],
        toolsNeeded: ['Radiator key or flat-head screwdriver', 'Cloth or towel'],
        materialsNeeded: ['Container to catch water'],
        safetyWarnings: [
            'Turn off heating and wait for radiators to cool completely',
            'Water may be hot - wait at least 30 minutes after turning off heating',
            'Protect floors and carpets from water spillage'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Turn Off Heating',
                description: 'Switch off your central heating and wait for all radiators to cool completely (at least 30 minutes).',
                warning: 'Never bleed radiators while they are hot'
            },
            {
                stepNumber: 2,
                title: 'Identify Cold Spots',
                description: 'Feel each radiator to identify which ones have cold spots at the top (indicating trapped air).',
            },
            {
                stepNumber: 3,
                title: 'Prepare the Area',
                description: 'Place a cloth and container under the bleed valve (usually at the top corner of the radiator).',
            },
            {
                stepNumber: 4,
                title: 'Open the Bleed Valve',
                description: 'Insert the radiator key and turn anti-clockwise about a quarter turn. You should hear air hissing out.',
                tip: 'Only turn slightly - you do not need to remove the valve completely'
            },
            {
                stepNumber: 5,
                title: 'Wait for Water',
                description: 'Keep the valve open until water starts to drip out steadily, then close it immediately by turning clockwise.',
            },
            {
                stepNumber: 6,
                title: 'Check Boiler Pressure',
                description: 'Check your boiler pressure gauge. If it has dropped below 1 bar, top up the system following your boiler manual.',
                warning: 'Low pressure can prevent your heating from working'
            },
            {
                stepNumber: 7,
                title: 'Test the System',
                description: 'Turn heating back on and check that all radiators heat up evenly.',
            }
        ],
        relatedGuides: ['guide-hvac-001']
    },

    // Plumbing Guides
    {
        id: 'guide-plumb-001',
        title: 'How to Check for Leaks',
        category: 'plumbing',
        difficulty: 'easy',
        estimatedTime: '30 minutes',
        estimatedCost: { min: 0, max: 0 },
        description: 'Learn how to inspect your home for water leaks to prevent damage and save on water bills.',
        whenToCallPro: [
            'You find an active leak you cannot stop',
            'Water stains on ceilings or walls',
            'Unexplained increase in water bills',
            'Sound of running water when all taps are off'
        ],
        toolsNeeded: ['Torch/flashlight', 'Tissue or paper towel'],
        materialsNeeded: [],
        safetyWarnings: [
            'Know where your main water shutoff valve is located',
            'Do not touch electrical outlets if there is water nearby'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Check All Taps',
                description: 'Inspect all taps for drips. Even a slow drip can waste significant water over time.',
                tip: 'Dry the tap completely and place tissue underneath to detect slow drips'
            },
            {
                stepNumber: 2,
                title: 'Inspect Under Sinks',
                description: 'Check under all sinks for water stains, dampness, or active drips from pipes and connections.',
            },
            {
                stepNumber: 3,
                title: 'Check Toilet Tanks',
                description: 'Add food coloring to the toilet tank. If color appears in the bowl without flushing, you have a leak.',
                tip: 'Wait 15-20 minutes before checking the bowl'
            },
            {
                stepNumber: 4,
                title: 'Inspect Visible Pipes',
                description: 'Check all visible pipes in basements, under stairs, and in cupboards for moisture or corrosion.',
            },
            {
                stepNumber: 5,
                title: 'Check Water Meter',
                description: 'Turn off all water in the house. If the water meter is still moving, you likely have a hidden leak.',
                warning: 'A hidden leak requires professional detection'
            },
            {
                stepNumber: 6,
                title: 'Look for Warning Signs',
                description: 'Check for water stains on ceilings/walls, musty odors, or unexplained damp patches.',
            }
        ],
        relatedGuides: ['guide-plumb-002', 'guide-plumb-004']
    },
    {
        id: 'guide-plumb-003',
        title: 'How to Clean Shower Heads',
        category: 'plumbing',
        difficulty: 'easy',
        estimatedTime: '15-30 minutes',
        estimatedCost: { min: 0, max: 5 },
        description: 'Remove limescale buildup from shower heads to restore water pressure and spray pattern.',
        whenToCallPro: [
            'Shower head is damaged or cracked',
            'Cannot remove shower head',
            'Low pressure persists after cleaning (may indicate pipe issues)'
        ],
        toolsNeeded: ['Adjustable wrench or pliers', 'Old toothbrush', 'Cloth'],
        materialsNeeded: ['White vinegar', 'Plastic bag', 'Rubber band or string'],
        safetyWarnings: [
            'Be gentle when removing shower head to avoid damaging threads',
            'Protect chrome finish with a cloth when using tools'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Remove Shower Head (Optional)',
                description: 'If possible, unscrew the shower head by hand or use a wrench with a cloth to protect the finish.',
                tip: 'You can clean without removing - see step 3'
            },
            {
                stepNumber: 2,
                title: 'Soak in Vinegar (If Removed)',
                description: 'Place shower head in a bowl of white vinegar for 30 minutes to dissolve limescale.',
            },
            {
                stepNumber: 3,
                title: 'Bag Method (If Not Removed)',
                description: 'Fill a plastic bag with vinegar, secure it over the shower head with a rubber band, and leave for 30 minutes.',
            },
            {
                stepNumber: 4,
                title: 'Scrub Away Deposits',
                description: 'Use an old toothbrush to scrub away loosened limescale from nozzles and surfaces.',
            },
            {
                stepNumber: 5,
                title: 'Rinse Thoroughly',
                description: 'Rinse the shower head with warm water to remove all vinegar and debris.',
            },
            {
                stepNumber: 6,
                title: 'Reattach and Test',
                description: 'Screw the shower head back on (if removed) and run water to check pressure and spray pattern.',
            }
        ],
        relatedGuides: ['guide-plumb-001', 'guide-plumb-004']
    },

    // Electrical Guides
    {
        id: 'guide-elec-001',
        title: 'How to Test Smoke Detectors',
        category: 'electrical',
        difficulty: 'easy',
        estimatedTime: '10 minutes',
        estimatedCost: { min: 5, max: 20 },
        description: 'Ensure your smoke detectors are working properly to protect your family from fire.',
        whenToCallPro: [
            'Hardwired detector not working after battery replacement',
            'Detector keeps beeping after new battery',
            'Detector is more than 10 years old (replace it)'
        ],
        toolsNeeded: ['Step ladder', 'Vacuum with brush attachment'],
        materialsNeeded: ['Replacement batteries (9V or AA depending on model)'],
        safetyWarnings: [
            'Never disable a smoke detector',
            'Replace detectors every 10 years',
            'Test detectors monthly'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Locate All Detectors',
                description: 'Identify all smoke detectors in your home. You should have one on each floor and in each bedroom.',
            },
            {
                stepNumber: 2,
                title: 'Clean the Detector',
                description: 'Gently vacuum the detector using a brush attachment to remove dust that can interfere with operation.',
                tip: 'Dust buildup is a common cause of false alarms'
            },
            {
                stepNumber: 3,
                title: 'Press the Test Button',
                description: 'Press and hold the test button for 3-5 seconds. You should hear a loud beep or alarm.',
                warning: 'If there is no sound, replace the battery immediately'
            },
            {
                stepNumber: 4,
                title: 'Replace Battery if Needed',
                description: 'If the alarm is weak or absent, replace the battery with a new one of the correct type.',
                tip: 'Replace all batteries at the same time once a year'
            },
            {
                stepNumber: 5,
                title: 'Test Again',
                description: 'After replacing the battery, test again to ensure the alarm is loud and clear.',
            },
            {
                stepNumber: 6,
                title: 'Record the Date',
                description: 'Write the test date on the detector or in your maintenance log.',
                tip: 'Set a monthly reminder on your phone'
            }
        ],
        relatedGuides: ['guide-elec-002', 'guide-elec-003']
    },
    {
        id: 'guide-elec-002',
        title: 'How to Test Carbon Monoxide Detectors',
        category: 'electrical',
        difficulty: 'easy',
        estimatedTime: '10 minutes',
        estimatedCost: { min: 5, max: 20 },
        description: 'Test your CO detectors to ensure they can detect this deadly, odorless gas.',
        whenToCallPro: [
            'Detector alarm goes off (evacuate immediately and call emergency services)',
            'Detector not working after battery replacement',
            'Detector is more than 7 years old (replace it)'
        ],
        toolsNeeded: ['Step ladder'],
        materialsNeeded: ['Replacement batteries'],
        safetyWarnings: [
            'If the alarm sounds, evacuate immediately and call 999',
            'Never ignore a CO alarm',
            'Required by law if you have gas appliances',
            'Replace CO detectors every 5-7 years'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Check Detector Placement',
                description: 'Ensure detectors are installed near bedrooms and on each floor. Should be at head height, not on ceiling.',
                tip: 'CO is roughly the same weight as air, so mid-level placement is best'
            },
            {
                stepNumber: 2,
                title: 'Check Expiry Date',
                description: 'Look for the expiry or replacement date on the detector. Replace if expired.',
                warning: 'CO detectors have a limited lifespan of 5-7 years'
            },
            {
                stepNumber: 3,
                title: 'Press the Test Button',
                description: 'Press and hold the test button. You should hear a loud alarm within a few seconds.',
            },
            {
                stepNumber: 4,
                title: 'Replace Battery if Needed',
                description: 'If the alarm is weak or absent, replace the battery immediately.',
            },
            {
                stepNumber: 5,
                title: 'Test Again',
                description: 'After battery replacement, test again to confirm proper operation.',
            },
            {
                stepNumber: 6,
                title: 'Schedule Next Test',
                description: 'Set a monthly reminder to test your CO detectors.',
            }
        ],
        relatedGuides: ['guide-elec-001', 'guide-hvac-001']
    },

    // Exterior Guides
    {
        id: 'guide-ext-001',
        title: 'How to Clean Gutters',
        category: 'exterior',
        difficulty: 'medium',
        estimatedTime: '2-4 hours',
        estimatedCost: { min: 50, max: 150 },
        description: 'Remove debris from gutters to prevent water damage, foundation issues, and pest infestations.',
        whenToCallPro: [
            'Gutters are damaged or sagging',
            'You are not comfortable working on a ladder',
            'Roof is steep or high (above 2 stories)',
            'Gutters need repairs or replacement'
        ],
        toolsNeeded: [
            'Sturdy ladder',
            'Work gloves',
            'Bucket or bag for debris',
            'Garden trowel or gutter scoop',
            'Garden hose'
        ],
        materialsNeeded: ['Safety goggles', 'Non-slip shoes'],
        safetyWarnings: [
            'Never work on a ladder alone',
            'Ensure ladder is on stable, level ground',
            'Do not overreach - move the ladder frequently',
            'Avoid working in wet or windy conditions',
            'Be aware of power lines near gutters'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Safety First',
                description: 'Set up your ladder on stable ground. Have someone hold the ladder if possible.',
                warning: 'Falls from ladders are a leading cause of home injuries'
            },
            {
                stepNumber: 2,
                title: 'Remove Large Debris',
                description: 'Use your hands (with gloves) or a gutter scoop to remove leaves, twigs, and debris.',
                tip: 'Work from the downspout towards the ends'
            },
            {
                stepNumber: 3,
                title: 'Clear Downspouts',
                description: 'Check downspouts for blockages. Use a plumber\'s snake or hose to clear if blocked.',
            },
            {
                stepNumber: 4,
                title: 'Flush with Water',
                description: 'Use a garden hose to flush remaining debris and check for proper drainage.',
                tip: 'This also helps identify leaks or sagging sections'
            },
            {
                stepNumber: 5,
                title: 'Check for Damage',
                description: 'Inspect gutters for rust, holes, loose brackets, or sagging sections.',
            },
            {
                stepNumber: 6,
                title: 'Consider Gutter Guards',
                description: 'Install gutter guards to reduce future debris buildup and maintenance frequency.',
                tip: 'Gutter guards can reduce cleaning frequency to once per year'
            }
        ],
        relatedGuides: ['guide-ext-002', 'guide-ext-006']
    },
    {
        id: 'guide-ext-003',
        title: 'How to Seal Windows and Doors',
        category: 'exterior',
        difficulty: 'easy',
        estimatedTime: '2-3 hours',
        estimatedCost: { min: 20, max: 100 },
        description: 'Improve energy efficiency and comfort by sealing drafts around windows and doors.',
        whenToCallPro: [
            'Windows or doors are damaged and need replacement',
            'Frames are rotting or severely deteriorated',
            'Double glazing seals have failed (condensation between panes)'
        ],
        toolsNeeded: [
            'Utility knife',
            'Tape measure',
            'Scissors',
            'Caulking gun (if using caulk)'
        ],
        materialsNeeded: [
            'Weatherstripping (foam, V-strip, or door sweep)',
            'Caulk (for exterior gaps)',
            'Cleaning supplies'
        ],
        safetyWarnings: [
            'Work in well-ventilated area if using caulk',
            'Be careful with utility knives'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Identify Drafts',
                description: 'On a windy day, hold a candle or incense stick near window and door edges to detect drafts.',
                tip: 'You can also use your hand to feel for air movement'
            },
            {
                stepNumber: 2,
                title: 'Remove Old Weatherstripping',
                description: 'Carefully remove old, damaged weatherstripping and clean the surface thoroughly.',
            },
            {
                stepNumber: 3,
                title: 'Measure and Cut',
                description: 'Measure each section and cut weatherstripping to fit. Cut slightly longer than needed.',
                tip: 'It is better to have it slightly too long than too short'
            },
            {
                stepNumber: 4,
                title: 'Apply Weatherstripping',
                description: 'Peel backing and press firmly into place. Ensure good contact along the entire length.',
                tip: 'Start at the top and work down for vertical applications'
            },
            {
                stepNumber: 5,
                title: 'Install Door Sweeps',
                description: 'Attach door sweeps to the bottom of exterior doors to seal the gap.',
            },
            {
                stepNumber: 6,
                title: 'Caulk Exterior Gaps',
                description: 'Apply caulk to exterior gaps around window and door frames. Smooth with a wet finger.',
                warning: 'Only caulk exterior gaps - interior gaps need to breathe'
            },
            {
                stepNumber: 7,
                title: 'Test the Seal',
                description: 'Close windows and doors to ensure they seal properly without being too tight.',
            }
        ],
        relatedGuides: ['guide-ext-002']
    },

    // Interior Guides
    {
        id: 'guide-int-003',
        title: 'How to Check for Damp and Mold',
        category: 'interior',
        difficulty: 'easy',
        estimatedTime: '30 minutes',
        estimatedCost: { min: 0, max: 0 },
        description: 'Identify and address damp and mold issues before they become serious health and structural problems.',
        whenToCallPro: [
            'Large areas of mold (more than 1 square meter)',
            'Mold returns quickly after cleaning',
            'Structural damp issues',
            'Persistent musty odors',
            'Rising damp from ground level'
        ],
        toolsNeeded: ['Torch/flashlight', 'Moisture meter (optional)'],
        materialsNeeded: [],
        safetyWarnings: [
            'Do not disturb large mold patches (can release spores)',
            'Wear a mask if you have respiratory issues',
            'Some molds can cause health problems'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Check Common Problem Areas',
                description: 'Inspect bathrooms, kitchens, basements, and areas near windows for signs of damp or mold.',
            },
            {
                stepNumber: 2,
                title: 'Look for Visual Signs',
                description: 'Check for black spots, discoloration, peeling wallpaper, or bubbling paint.',
                tip: 'Use a torch to check dark corners and behind furniture'
            },
            {
                stepNumber: 3,
                title: 'Check for Musty Odors',
                description: 'Damp and mold often produce a distinctive musty smell, especially in enclosed spaces.',
            },
            {
                stepNumber: 4,
                title: 'Feel for Dampness',
                description: 'Touch walls and surfaces - they should feel dry. Persistent dampness indicates a problem.',
            },
            {
                stepNumber: 5,
                title: 'Check Ventilation',
                description: 'Ensure extractor fans work and windows can be opened for ventilation.',
                tip: 'Poor ventilation is the most common cause of condensation and mold'
            },
            {
                stepNumber: 6,
                title: 'Identify the Cause',
                description: 'Determine if damp is from condensation, leaks, rising damp, or penetrating damp.',
                warning: 'Different types of damp require different solutions'
            },
            {
                stepNumber: 7,
                title: 'Take Action',
                description: 'Small mold patches can be cleaned with mold remover. Address ventilation and moisture sources.',
                tip: 'Improve ventilation, use dehumidifiers, and fix any leaks'
            }
        ],
        relatedGuides: ['guide-int-004', 'guide-plumb-001']
    },
    {
        id: 'guide-int-004',
        title: 'How to Seal Bathroom Grout',
        category: 'interior',
        difficulty: 'easy',
        estimatedTime: '1-2 hours',
        estimatedCost: { min: 15, max: 50 },
        description: 'Reseal bathroom tiles and grout to prevent water damage, mold growth, and maintain appearance.',
        whenToCallPro: [
            'Tiles are loose or cracked',
            'Extensive water damage behind tiles',
            'Grout is severely deteriorated',
            'Structural issues with bathroom'
        ],
        toolsNeeded: [
            'Grout removal tool or utility knife',
            'Caulking gun',
            'Grout float or applicator',
            'Sponge',
            'Cleaning supplies'
        ],
        materialsNeeded: [
            'Grout sealer or silicone sealant',
            'Bathroom cleaner',
            'Mold remover (if needed)'
        ],
        safetyWarnings: [
            'Ensure good ventilation when using sealants',
            'Wear gloves to protect skin',
            'Keep products away from children and pets'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Clean the Area',
                description: 'Thoroughly clean tiles and grout with bathroom cleaner. Remove any mold with mold remover.',
                tip: 'The surface must be completely clean and dry for sealant to adhere'
            },
            {
                stepNumber: 2,
                title: 'Remove Old Sealant',
                description: 'Use a utility knife or grout removal tool to carefully remove old, damaged sealant.',
                warning: 'Be careful not to damage tiles or grout'
            },
            {
                stepNumber: 3,
                title: 'Let It Dry',
                description: 'Allow the area to dry completely - this may take 24-48 hours depending on conditions.',
                warning: 'Applying sealant to damp surfaces will cause it to fail'
            },
            {
                stepNumber: 4,
                title: 'Apply Grout Sealer',
                description: 'Apply grout sealer to grout lines using an applicator. Wipe excess from tiles immediately.',
                tip: 'Work in small sections to prevent sealer from drying on tiles'
            },
            {
                stepNumber: 5,
                title: 'Apply Silicone Sealant',
                description: 'Apply a smooth bead of silicone sealant where tiles meet the bath, shower tray, or sink.',
                tip: 'Use masking tape for a neat finish, then smooth with a wet finger'
            },
            {
                stepNumber: 6,
                title: 'Allow to Cure',
                description: 'Do not use the shower or bath for 24-48 hours to allow sealant to cure fully.',
            }
        ],
        relatedGuides: ['guide-int-003']
    },

    // Appliance Guides
    {
        id: 'guide-app-001',
        title: 'How to Clean Washing Machine Filter',
        category: 'appliance',
        difficulty: 'easy',
        estimatedTime: '15 minutes',
        estimatedCost: { min: 0, max: 5 },
        description: 'Clean your washing machine filter to prevent odors, improve performance, and avoid drainage issues.',
        whenToCallPro: [
            'Machine not draining despite clean filter',
            'Unusual noises during operation',
            'Error codes appearing',
            'Water leaking from filter area'
        ],
        toolsNeeded: ['Towels', 'Shallow container', 'Old toothbrush'],
        materialsNeeded: [],
        safetyWarnings: [
            'Unplug the machine before cleaning',
            'Water will drain out when you open the filter - be prepared'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Locate the Filter',
                description: 'Find the filter access panel - usually at the front bottom of the machine behind a small door.',
                tip: 'Check your machine manual if you cannot find it'
            },
            {
                stepNumber: 2,
                title: 'Prepare for Water',
                description: 'Place towels and a shallow container under the filter as water will drain out.',
            },
            {
                stepNumber: 3,
                title: 'Open the Filter',
                description: 'Slowly unscrew or pull out the filter. Water will drain - let it flow into your container.',
                warning: 'Do this slowly to control water flow'
            },
            {
                stepNumber: 4,
                title: 'Clean the Filter',
                description: 'Remove lint, coins, and debris from the filter. Rinse under running water and scrub with a toothbrush.',
            },
            {
                stepNumber: 5,
                title: 'Clean the Housing',
                description: 'Wipe inside the filter housing with a damp cloth to remove any remaining debris.',
            },
            {
                stepNumber: 6,
                title: 'Replace the Filter',
                description: 'Screw the filter back in firmly and close the access panel.',
                warning: 'Ensure it is tight to prevent leaks'
            },
            {
                stepNumber: 7,
                title: 'Run a Maintenance Cycle',
                description: 'Run an empty hot wash with washing machine cleaner or white vinegar to freshen the drum.',
                tip: 'Do this monthly to prevent odors'
            }
        ],
        relatedGuides: ['guide-app-002']
    },
    {
        id: 'guide-app-005',
        title: 'How to Clean Tumble Dryer Vents',
        category: 'appliance',
        difficulty: 'easy',
        estimatedTime: '30 minutes',
        estimatedCost: { min: 0, max: 100 },
        description: 'Clean dryer vents and lint filter to prevent fire risk and maintain drying efficiency.',
        whenToCallPro: [
            'Vent is damaged or disconnected',
            'Dryer not heating despite clean vents',
            'External vent is inaccessible',
            'Burning smell from dryer'
        ],
        toolsNeeded: [
            'Vacuum with hose attachment',
            'Dryer vent brush (optional)',
            'Screwdriver'
        ],
        materialsNeeded: [],
        safetyWarnings: [
            'Unplug dryer before cleaning',
            'Lint buildup is a major fire hazard',
            'Never run dryer without lint filter in place'
        ],
        steps: [
            {
                stepNumber: 1,
                title: 'Clean the Lint Filter',
                description: 'Remove lint filter and clean thoroughly. Wash with warm soapy water every few months.',
                tip: 'Clean the filter after EVERY load for best performance'
            },
            {
                stepNumber: 2,
                title: 'Vacuum the Filter Housing',
                description: 'Use a vacuum hose to remove lint from the filter housing area.',
            },
            {
                stepNumber: 3,
                title: 'Disconnect the Vent Hose',
                description: 'Pull the dryer away from the wall and disconnect the vent hose from the back of the dryer.',
                warning: 'Unplug the dryer first'
            },
            {
                stepNumber: 4,
                title: 'Clean the Vent Hose',
                description: 'Use a vent brush or vacuum to clean inside the vent hose. Remove all lint buildup.',
                tip: 'Replace vent hose if it is damaged or kinked'
            },
            {
                stepNumber: 5,
                title: 'Clean the External Vent',
                description: 'Go outside and clean the external vent cover. Ensure the flap opens and closes freely.',
            },
            {
                stepNumber: 6,
                title: 'Reconnect Everything',
                description: 'Reattach the vent hose securely and push the dryer back into place.',
            },
            {
                stepNumber: 7,
                title: 'Test the Dryer',
                description: 'Run a short cycle to ensure proper airflow and check the external vent is expelling air.',
            }
        ],
        relatedGuides: ['guide-app-001']
    }
];

// Helper functions
export const getGuideById = (id: string) => {
    return diyGuides.find(guide => guide.id === id);
};

export const getGuidesByCategory = (category: DIYGuide['category']) => {
    return diyGuides.filter(guide => guide.category === category);
};

export const getGuidesByDifficulty = (difficulty: DIYGuide['difficulty']) => {
    return diyGuides.filter(guide => guide.difficulty === difficulty);
};
