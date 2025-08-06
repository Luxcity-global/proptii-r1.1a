export interface AreaInsight {
  location: string;
  averageRent: {
    amount: number;
    currency: string;
    propertyType: string; // e.g., "1-BR", "2-BR"
    period: string; // "monthly", "weekly"
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

export interface AreaInsightState {
  data: AreaInsight | null;
  loading: boolean;
  error: string | null;
}

export interface AreaInsightProps {
  areaInsight: AreaInsight | null;
  loading?: boolean;
  error?: string | null;
} 