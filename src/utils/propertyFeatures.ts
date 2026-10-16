import React from 'react';
import {
  PawPrint,
  Zap,
  Train,
  Car,
  Trees,
  Dumbbell,
  Bell,
  Armchair,
  ArrowUpDown,
  Flame,
  Wind,
  ShieldCheck,
  Sparkles,
  Bath,
  Check,
  Utensils,
  Sun,
  Home,
  type LucideIcon,
} from 'lucide-react';
import type { Property } from '../types/property';

export interface DynamicFeature {
  id: string;
  label: string;
  category: 'essential' | 'outdoor' | 'transport' | 'building' | 'comfort' | 'interior' | 'amenity';
  Icon: LucideIcon;
  badgeClass: string;
  iconColorClass: string;
  isKeyFeature: boolean;
}

interface FeatureDefinition {
  id: string;
  label: string;
  category: DynamicFeature['category'];
  Icon: LucideIcon;
  badgeClass: string;
  iconColorClass: string;
  isKeyFeature: boolean;
  match: (text: string, rawAmenities: string[]) => boolean;
}

// Curated taxonomy of high-impact property features with distinct, aesthetic color schemes
const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    id: 'bills-included',
    label: 'Bills Included',
    category: 'essential',
    Icon: Zap,
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200/80',
    iconColorClass: 'text-blue-700',
    isKeyFeature: true,
    match: (text, raw) =>
      /\b(bills?\s+(inc|inclusive|included)|all\s+bills|utilities\s+included|gas\s+and\s+elec)\b/i.test(text) ||
      raw.some((a) => /\b(bills?\s+(inc|inclusive|included)|all\s+bills|utilities)\b/i.test(a)),
  },
  {
    id: 'furnished',
    label: 'Furnished',
    category: 'essential',
    Icon: Armchair,
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
    iconColorClass: 'text-indigo-700',
    isKeyFeature: true,
    match: (text, raw) =>
      /\b(furnished|fully\s+furnished)\b/i.test(text) && !/\bunfurnished|not\s+furnished\b/i.test(text) ||
      raw.some((a) => /\b(furnished|fully\s+furnished)\b/i.test(a) && !/\bunfurnished\b/i.test(a)),
  },
  {
    id: 'unfurnished',
    label: 'Unfurnished',
    category: 'essential',
    Icon: Armchair,
    badgeClass: 'bg-slate-50 text-slate-800 border-slate-200/80',
    iconColorClass: 'text-slate-600',
    isKeyFeature: false,
    match: (text, raw) =>
      /\bunfurnished\b/i.test(text) || raw.some((a) => /\bunfurnished\b/i.test(a)),
  },
  {
    id: 'pet-friendly',
    label: 'Pet Friendly',
    category: 'essential',
    Icon: PawPrint,
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    iconColorClass: 'text-amber-700',
    isKeyFeature: true,
    match: (text, raw) =>
      /\b(pets?\s+(welcome|considered|friendly|allowed)|dogs?\s+welcome|cats?\s+welcome)\b/i.test(text) ||
      raw.some((a) => /\b(pet|pets|dog|cat)\b/i.test(a)),
  },
  {
    id: 'parking',
    label: 'Parking',
    category: 'transport',
    Icon: Car,
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200/80',
    iconColorClass: 'text-violet-700',
    isKeyFeature: true,
    match: (text, raw) =>
      /\b(parking|allocated\s+parking|off[- ]street\s+parking|garage|driveway|residents?\s+parking)\b/i.test(text) ||
      raw.some((a) => /\b(parking|garage|driveway)\b/i.test(a)),
  },
  {
    id: 'station-nearby',
    label: 'Near Station',
    category: 'transport',
    Icon: Train,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    iconColorClass: 'text-emerald-700',
    isKeyFeature: true,
    match: (text, raw) =>
      /\b(near|close to|minutes to|walk to|adjacent to)\s+([a-z\s]+)?(station|tube|underground|train|dlr|overground)\b/i.test(text) ||
      /\b(\d+)\s*(mins?|minutes?)\s*(walk)?\s*(to)?\s*(station|tube)\b/i.test(text) ||
      raw.some((a) => /\b(station|underground|tube|dlr|overground|crossrail|metro)\b/i.test(a)),
  },
  {
    id: 'balcony-terrace',
    label: 'Balcony / Terrace',
    category: 'outdoor',
    Icon: Sun,
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/80',
    iconColorClass: 'text-teal-700',
    isKeyFeature: true,
    match: (text, raw) =>
      /\b(balcony|private\s+balcony|terrace|roof\s+terrace|patio)\b/i.test(text) ||
      raw.some((a) => /\b(balcony|terrace|patio)\b/i.test(a)),
  },
  {
    id: 'garden',
    label: 'Garden',
    category: 'outdoor',
    Icon: Trees,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    iconColorClass: 'text-emerald-700',
    isKeyFeature: true,
    match: (text, raw) =>
      /\b(private\s+garden|communal\s+garden|shared\s+garden|rear\s+garden)\b/i.test(text) ||
      raw.some((a) => /\b(garden|gardens)\b/i.test(a)),
  },
  {
    id: 'gym',
    label: 'Gym / Fitness',
    category: 'building',
    Icon: Dumbbell,
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200/80',
    iconColorClass: 'text-purple-700',
    isKeyFeature: true,
    match: (text, raw) =>
      /\b(gym|gymnasium|fitness\s+suite|residents'?\s+gym|on-?site\s+gym)\b/i.test(text) ||
      raw.some((a) => /\b(gym|fitness|workout)\b/i.test(a)),
  },
  {
    id: 'concierge',
    label: 'Concierge',
    category: 'building',
    Icon: Bell,
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200/80',
    iconColorClass: 'text-orange-700',
    isKeyFeature: true,
    match: (text, raw) =>
      /\b(concierge|porter|24[- ]?hour\s+concierge|24hr\s+concierge|day\s+concierge)\b/i.test(text) ||
      raw.some((a) => /\b(concierge|porter)\b/i.test(a)),
  },
  {
    id: 'lift-access',
    label: 'Lift Access',
    category: 'building',
    Icon: ArrowUpDown,
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
    iconColorClass: 'text-cyan-700',
    isKeyFeature: false,
    match: (text, raw) =>
      /\b(lift\s+access|passenger\s+lift|elevator)\b/i.test(text) ||
      raw.some((a) => /\b(lift|elevator)\b/i.test(a)),
  },
  {
    id: 'air-conditioning',
    label: 'Air Conditioning',
    category: 'comfort',
    Icon: Wind,
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200/80',
    iconColorClass: 'text-sky-700',
    isKeyFeature: false,
    match: (text, raw) =>
      /\b(air\s+conditioning|a\/c|comfort\s+cooling)\b/i.test(text) ||
      raw.some((a) => /\b(air\s+con|air\s+conditioning|cooling)\b/i.test(a)),
  },
  {
    id: 'heating',
    label: 'Central Heating',
    category: 'comfort',
    Icon: Flame,
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/80',
    iconColorClass: 'text-rose-700',
    isKeyFeature: false,
    match: (text, raw) =>
      /\b(gas\s+central\s+heating|underfloor\s+heating|central\s+heating)\b/i.test(text) ||
      raw.some((a) => /\b(heating|underfloor)\b/i.test(a)),
  },
  {
    id: 'security-gated',
    label: 'Gated / Secure Entry',
    category: 'building',
    Icon: ShieldCheck,
    badgeClass: 'bg-zinc-50 text-zinc-800 border-zinc-200/80',
    iconColorClass: 'text-zinc-700',
    isKeyFeature: false,
    match: (text, raw) =>
      /\b(gated\s+(development|entrance|community)|video\s+entry|secure\s+entry|cctv)\b/i.test(text) ||
      raw.some((a) => /\b(gated|cctv|secure\s+entry)\b/i.test(a)),
  },
  {
    id: 'ensuite',
    label: 'En-Suite Bathroom',
    category: 'interior',
    Icon: Bath,
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200/80',
    iconColorClass: 'text-blue-700',
    isKeyFeature: false,
    match: (text, raw) =>
      /\b(en[- ]?suite|master\s+en[- ]?suite)\b/i.test(text) ||
      raw.some((a) => /\ben[- ]?suite\b/i.test(a)),
  },
  {
    id: 'new-build',
    label: 'New Build / Modern',
    category: 'interior',
    Icon: Sparkles,
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200/80',
    iconColorClass: 'text-amber-600',
    isKeyFeature: false,
    match: (text, raw) =>
      /\b(new\s+build|newly\s+(refurbished|renovated|built)|modern\s+development)\b/i.test(text) ||
      raw.some((a) => /\b(new\s+build|newly\s+refurbished|modern)\b/i.test(a)),
  },
];

/**
 * Normalizes raw amenity text into a clean Title Case display string.
 */
function cleanAmenityString(str: string): string {
  return str
    .replace(/^[\s•\-\*\>]+/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Dynamically resolves all features and amenities for a property.
 * Evaluates semantic taxonomy definitions and dynamically absorbs any unlisted raw amenities.
 */
export function getPropertyDynamicFeatures(property: Property): DynamicFeature[] {
  const fullText = `${property.title || ''} ${property.description || ''} ${property.propertyType || ''}`;
  const rawAmenities: string[] = (property.amenities || [])
    .map((a: any) => cleanAmenityString(typeof a === 'string' ? a : (a?.description || a?.title || '')))
    .filter(Boolean);

  const matchedFeatures: DynamicFeature[] = [];
  const matchedIds = new Set<string>();

  // 1. Run through our curated semantic taxonomy
  for (const def of FEATURE_DEFINITIONS) {
    if (def.match(fullText, rawAmenities)) {
      matchedFeatures.push({
        id: def.id,
        label: def.label,
        category: def.category,
        Icon: def.Icon,
        badgeClass: def.badgeClass,
        iconColorClass: def.iconColorClass,
        isKeyFeature: def.isKeyFeature,
      });
      matchedIds.add(def.id);
    }
  }

  // 2. Dynamically absorb any raw amenity from the property feed that wasn't covered above
  for (let i = 0; i < rawAmenities.length; i++) {
    const raw = rawAmenities[i];
    if (raw.length < 3 || raw.length > 50) continue;

    // Check if raw amenity is already represented
    const alreadyRepresented = matchedFeatures.some((f) =>
      raw.toLowerCase().includes(f.label.toLowerCase()) || f.label.toLowerCase().includes(raw.toLowerCase())
    );

    if (!alreadyRepresented) {
      // Create a clean Title Case label
      const formattedLabel = raw
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      matchedFeatures.push({
        id: `raw-${i}-${raw.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        label: formattedLabel,
        category: 'amenity',
        Icon: Check,
        badgeClass: 'bg-gray-50 text-gray-700 border-gray-200/80 shadow-2xs',
        iconColorClass: 'text-emerald-600',
        isKeyFeature: false,
      });
    }
  }

  return matchedFeatures;
}

/**
 * Returns the top features for card pills, with overflow calculation.
 */
export function getKeyFeatureBadges(
  property: Property,
  limit: number = 3
): {
  visibleFeatures: DynamicFeature[];
  overflowCount: number;
} {
  const allFeatures = getPropertyDynamicFeatures(property);

  // Prioritize key features first, then other amenities
  const sorted = [...allFeatures].sort((a, b) => {
    if (a.isKeyFeature && !b.isKeyFeature) return -1;
    if (!a.isKeyFeature && b.isKeyFeature) return 1;
    return 0;
  });

  const visibleFeatures = sorted.slice(0, limit);
  const overflowCount = Math.max(0, sorted.length - limit);

  return { visibleFeatures, overflowCount };
}
