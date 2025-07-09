const API_BASE_URL = import.meta.env.VITE_MCP_API_URL || 'http://localhost:3002/api/mcp';

// Transform backend property format to frontend PropertyCard format
function transformProperty(backendProperty: any) {
  console.log('🔄 [FRONTEND] Transforming property:', backendProperty.id);
  
  // Determine if this is a rental or sale property
  const isRental = backendProperty.price?.type === 'rent' || 
                   backendProperty.price?.period === 'monthly' ||
                   backendProperty.title?.toLowerCase().includes('rent') ||
                   backendProperty.title?.toLowerCase().includes('let');
  
  const priceUnit = isRental ? 'pcm' : 'total';
  
  return {
    id: backendProperty.id,
    status: backendProperty.status || 'available',
    availableNow: backendProperty.status === 'available',
    title: backendProperty.title,
    price: backendProperty.price?.amount || 0,
    priceUnit: priceUnit,
    address: backendProperty.location?.address || backendProperty.address || 'Address not available',
    beds: backendProperty.specifications?.bedrooms || 0,
    baths: backendProperty.specifications?.bathrooms || 0,
    area: backendProperty.specifications?.totalArea || 0,
    areaUnit: 'sq ft',
    images: backendProperty.images && backendProperty.images.length > 0 
      ? backendProperty.images.map((img: any, index: number) => ({
          src: img.src || '',
          alt: img.alt || backendProperty.title,
          label: img.alt || `Property image ${index + 1}`
        }))
      : [
          { src: '', alt: backendProperty.title, label: 'Main View' },
          { src: '', alt: backendProperty.title, label: 'Living Room' },
          { src: '', alt: backendProperty.title, label: 'Kitchen' }
        ],
    isFavorited: false,
    agent: {
      company: backendProperty.agent?.company || 'Property Agent',
      name: backendProperty.agent?.name || 'Agent Name'
    },
    actions: [
      { type: 'chat', label: 'Chat' },
      { type: 'call', label: 'Call' },
      { type: 'email', label: 'Email' }
    ]
  };
}

// Enhanced search with real-time scraping support
export async function searchProperties(query: string, options?: {
  useRealData?: boolean;
  sources?: string[];
  filters?: any;
  page?: number;
  limit?: number;
}) {
  console.log('🚀 [FRONTEND] Starting enhanced property search...');
  console.log('📍 [FRONTEND] API Base URL:', API_BASE_URL);
  console.log('🔍 [FRONTEND] Search Query:', query);
  console.log('⚙️ [FRONTEND] Search Options:', options);
  
  const startTime = Date.now();
  
  try {
    // Use enhanced search endpoint if real data is requested
    const endpoint = options?.useRealData ? '/enhanced-search' : '/search';
    const payload = {
      query,
      filters: options?.filters || {},
      useRealData: options?.useRealData || false,
      sources: options?.sources || ['openrent'],
      page: options?.page || 1,
      limit: options?.limit || 20
    };
    
    console.log('🌐 [FRONTEND] Making fetch request to:', `${API_BASE_URL}${endpoint}`);
    console.log('📤 [FRONTEND] Request payload:', payload);
    
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const endTime = Date.now();
    console.log('⏱️ [FRONTEND] Request completed in:', endTime - startTime, 'ms');
    console.log('📊 [FRONTEND] Response status:', res.status);
    
    if (!res.ok) {
      console.error('❌ [FRONTEND] Response not OK:', res.status, res.statusText);
      const errorText = await res.text();
      console.error('❌ [FRONTEND] Error response body:', errorText);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('✅ [FRONTEND] Response data received:', data);
    console.log('📋 [FRONTEND] Data structure:', {
      hasSuccess: 'success' in data,
      hasData: 'data' in data,
      hasResults: 'results' in data,
      dataKeys: Object.keys(data),
      resultsLength: data.results?.length || data.data?.properties?.length || 'N/A'
    });
    
    // Handle different response structures
    const backendProperties = data.results || data.data?.properties || data.properties || [];
    console.log('🏠 [FRONTEND] Backend properties count:', backendProperties.length);
    console.log('🏠 [FRONTEND] First backend property sample:', backendProperties[0] || 'No results');
    
    // Transform backend properties to frontend format
    console.log('🔄 [FRONTEND] Transforming properties to frontend format...');
    const transformedProperties = backendProperties.map(transformProperty);
    console.log('✅ [FRONTEND] Properties transformed:', transformedProperties.length);
    console.log('🏠 [FRONTEND] First transformed property:', transformedProperties[0] || 'No results');
    
    return {
      properties: transformedProperties,
      metadata: {
        total: data.metadata?.total || transformedProperties.length,
        page: data.metadata?.page || 1,
        limit: data.metadata?.limit || 20,
        sources: data.metadata?.sources || ['openrent'],
        useRealData: data.metadata?.useRealData || false,
        scrapingTime: data.metadata?.scrapingTime || null,
        cacheStatus: data.metadata?.cacheStatus || 'miss'
      },
      intelligence: data.intelligence || null
    };
  } catch (error) {
    const endTime = Date.now();
    console.error('💥 [FRONTEND] Search request failed after:', endTime - startTime, 'ms');
    console.error('💥 [FRONTEND] Error details:', error);
    console.error('💥 [FRONTEND] Error type:', error.constructor.name);
    console.error('💥 [FRONTEND] Error message:', error.message);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 [FRONTEND] Network error - backend may be unavailable');
    }
    
    throw error;
  }
}

// Trigger real-time scraping
export async function triggerScraping(options: {
  source: string;
  query: string;
  pages?: number;
  filters?: any;
}) {
  console.log('🔄 [FRONTEND] Triggering real-time scraping...');
  console.log('⚙️ [FRONTEND] Scraping options:', options);
  
  try {
    const res = await fetch(`${API_BASE_URL}/scraping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
    }
    
    const data = await res.json();
    console.log('✅ [FRONTEND] Scraping triggered successfully:', data);
    return data;
  } catch (error) {
    console.error('💥 [FRONTEND] Scraping trigger failed:', error);
    throw error;
  }
}

// Get scraping status and progress
export async function getScrapingStatus() {
  console.log('📊 [FRONTEND] Getting scraping status...');
  
  try {
    const res = await fetch(`${API_BASE_URL}/scraping/status`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('✅ [FRONTEND] Scraping status received:', data);
    return data;
  } catch (error) {
    console.error('💥 [FRONTEND] Failed to get scraping status:', error);
    throw error;
  }
}

// Cache management
export async function getCacheInfo() {
  console.log('💾 [FRONTEND] Getting cache information...');
  
  try {
    const res = await fetch(`${API_BASE_URL}/cache`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('✅ [FRONTEND] Cache info received:', data);
    return data;
  } catch (error) {
    console.error('💥 [FRONTEND] Failed to get cache info:', error);
    throw error;
  }
}

// Clear cache
export async function clearCache(source?: string) {
  console.log('🗑️ [FRONTEND] Clearing cache...', source ? `for source: ${source}` : 'all');
  
  try {
    const url = source ? `${API_BASE_URL}/cache?source=${source}` : `${API_BASE_URL}/cache`;
    const res = await fetch(url, { method: 'DELETE' });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('✅ [FRONTEND] Cache cleared successfully:', data);
    return data;
  } catch (error) {
    console.error('💥 [FRONTEND] Failed to clear cache:', error);
    throw error;
  }
}

// Health check
export async function getHealthStatus() {
  console.log('🏥 [FRONTEND] Getting health status...');
  
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('✅ [FRONTEND] Health status received:', data);
    return data;
  } catch (error) {
    console.error('💥 [FRONTEND] Failed to get health status:', error);
    throw error;
  }
}

// Get available data sources
export async function getDataSources() {
  console.log('📚 [FRONTEND] Getting available data sources...');
  
  try {
    const res = await fetch(`${API_BASE_URL}/sources`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('✅ [FRONTEND] Data sources received:', data);
    return data;
  } catch (error) {
    console.error('💥 [FRONTEND] Failed to get data sources:', error);
    throw error;
  }
}

export async function getPropertyDetails(id: string) {
  console.log('🏠 [FRONTEND] Fetching property details for ID:', id);
  
  try {
    const res = await fetch(`${API_BASE_URL}/property/${id}`);
    console.log('📊 [FRONTEND] Property details response status:', res.status);
    
    if (!res.ok) {
      console.error('❌ [FRONTEND] Property details request failed:', res.status);
      throw new Error('Failed to fetch property details');
    }
    
    const data = await res.json();
    console.log('✅ [FRONTEND] Property details received:', data);
    return data;
  } catch (error) {
    console.error('💥 [FRONTEND] Property details error:', error);
    throw error;
  }
} 