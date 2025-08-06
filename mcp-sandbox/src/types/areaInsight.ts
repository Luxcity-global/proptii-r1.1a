export interface AreaInsight {
  location: string;
  averageRent: {
    amount: number;
    currency: string;
    propertyType: string;
    period: string;
  };
  amenities: {
    category: string;
    items: string[];
  }[];
  transport: {
    type: string;
    details: string;
  }[];
  marketTrends?: {
    trend: "rising" | "stable" | "declining";
    percentage: number;
    description: string;
  };
  neighborhoodInfo?: {
    description: string;
    highlights: string[];
  };
} 