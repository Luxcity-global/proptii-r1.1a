/**
 * Platform Configuration
 * Comprehensive platform types, formats and dimensions for different social media platforms
 */

export interface PlatformType {
  id: string;
  name: string;
  dimensions: {
    width: number;
    height: number;
    ratio: string;
  };
  description?: string;
  recommended?: boolean;
}

export interface Platform {
  id: string;
  name: string;
  color: string;
  types: PlatformType[];
}

export const PLATFORM_CONFIG: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    types: [
      {
        id: 'feed-post',
        name: 'Feed Post',
        dimensions: { width: 1200, height: 630, ratio: '1.91:1' },
        description: 'Standard Facebook feed post',
        recommended: true
      },
      {
        id: 'story',
        name: 'Story',
        dimensions: { width: 1080, height: 1920, ratio: '9:16' },
        description: 'Facebook Story vertical format'
      },
      {
        id: 'cover',
        name: 'Cover Photo',
        dimensions: { width: 1200, height: 315, ratio: '3.8:1' },
        description: 'Facebook page cover photo'
      },
      {
        id: 'event-cover',
        name: 'Event Cover',
        dimensions: { width: 1920, height: 1080, ratio: '16:9' },
        description: 'Facebook event cover image'
      },
      {
        id: 'ad-landscape',
        name: 'Ad (Landscape)',
        dimensions: { width: 1200, height: 628, ratio: '1.91:1' },
        description: 'Facebook ad landscape format'
      },
      {
        id: 'ad-square',
        name: 'Ad (Square)',
        dimensions: { width: 1080, height: 1080, ratio: '1:1' },
        description: 'Facebook ad square format'
      }
    ]
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    types: [
      {
        id: 'feed-square',
        name: 'Feed Post (Square)',
        dimensions: { width: 1080, height: 1080, ratio: '1:1' },
        description: 'Instagram square post',
        recommended: true
      },
      {
        id: 'feed-portrait',
        name: 'Feed Post (Portrait)',
        dimensions: { width: 1080, height: 1350, ratio: '4:5' },
        description: 'Instagram portrait post'
      },
      {
        id: 'feed-landscape',
        name: 'Feed Post (Landscape)', 
        dimensions: { width: 1080, height: 608, ratio: '16:9' },
        description: 'Instagram landscape post'
      },
      {
        id: 'story',
        name: 'Story',
        dimensions: { width: 1080, height: 1920, ratio: '9:16' },
        description: 'Instagram Story vertical format'
      },
      {
        id: 'igtv-cover',
        name: 'IGTV Cover',
        dimensions: { width: 1080, height: 1350, ratio: '4:5' },
        description: 'Instagram IGTV cover image',
        recommended: true
      },
      {
        id: 'reels',
        name: 'Reels',
        dimensions: { width: 1080, height: 1920, ratio: '9:16' },
        description: 'Instagram Reels vertical format'
      },
      {
        id: 'carousel',
        name: 'Carousel',
        dimensions: { width: 1080, height: 1080, ratio: '1:1' },
        description: 'Instagram carousel post'
      }
    ]
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    types: [
      {
        id: 'feed-post',
        name: 'Feed Post',
        dimensions: { width: 1200, height: 627, ratio: '1.91:1' },
        description: 'LinkedIn feed post',
        recommended: true
      },
      {
        id: 'cover',
        name: 'Cover Photo',
        dimensions: { width: 1584, height: 396, ratio: '4:1' },
        description: 'LinkedIn profile/company cover'
      },
      {
        id: 'company-logo',
        name: 'Company Logo',
        dimensions: { width: 300, height: 300, ratio: '1:1' },
        description: 'LinkedIn company page logo'
      },
      {
        id: 'article-header',
        name: 'Article Header',
        dimensions: { width: 1200, height: 627, ratio: '1.91:1' },
        description: 'LinkedIn article header image'
      },
      {
        id: 'event-cover',
        name: 'Event Cover',
        dimensions: { width: 1200, height: 627, ratio: '1.91:1' },
        description: 'LinkedIn event cover image'
      }
    ]
  },
  {
    id: 'twitter',
    name: 'Twitter',
    color: '#1DA1F2',
    types: [
      {
        id: 'tweet-image',
        name: 'Tweet Image',
        dimensions: { width: 1200, height: 675, ratio: '16:9' },
        description: 'Twitter tweet image',
        recommended: true
      },
      {
        id: 'header',
        name: 'Header Photo',
        dimensions: { width: 1500, height: 500, ratio: '3:1' },
        description: 'Twitter profile header'
      },
      {
        id: 'card-summary',
        name: 'Card Summary',
        dimensions: { width: 800, height: 418, ratio: '1.91:1' },
        description: 'Twitter card summary image'
      },
      {
        id: 'card-large',
        name: 'Card Large',
        dimensions: { width: 800, height: 320, ratio: '2.5:1' },
        description: 'Twitter card large summary'
      }
    ]
  }
];

// Helper functions
export const getPlatformById = (platformId: string): Platform | undefined => {
  return PLATFORM_CONFIG.find(platform => platform.id === platformId);
};

export const getPlatformTypeById = (platformId: string, typeId: string): PlatformType | undefined => {
  const platform = getPlatformById(platformId);
  return platform?.types.find(type => type.id === typeId);
};

export const getDefaultTypeForPlatform = (platformId: string): PlatformType | undefined => {
  const platform = getPlatformById(platformId);
  if (!platform) return undefined;
  
  // Return recommended type or first type
  return platform.types.find(type => type.recommended) || platform.types[0];
};

export const getAllPlatformIds = (): string[] => {
  return PLATFORM_CONFIG.map(platform => platform.id);
};

export const getAllTypesForPlatform = (platformId: string): PlatformType[] => {
  const platform = getPlatformById(platformId);
  return platform?.types || [];
};
