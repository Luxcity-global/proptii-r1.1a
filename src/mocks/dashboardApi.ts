import { ApiResponse } from '../services/api';

// Import ReferencingModal constants for consistency
const BLUE_COLOR = '#136C9E';

// Define types for dashboard data
export interface DashboardSummary {
  savedSearches: {
    count: number;
    recentSearches: Array<{ id: string; query: string; date: string }>;
  };
  viewings: {
    upcoming: number;
    past: number;
    total: number;
    nextViewing?: { property: string; date: string; time: string };
  };
  referencing: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress: number;
    completedSteps: number;
    totalSteps: number;
    nextStep?: string;
  };
  contracts: {
    pending: number;
    signed: number;
    total: number;
    requested: number;
    urgent?: Array<{ id: string; name: string; dueDate: string }>;
  };
  files: {
    count: number;
    recentlyAdded: Array<{ 
      id: string; 
      name: string; 
      type: string; 
      date: string;
      url: string;
      size: number;
    }>;
  };
}

export interface SavedProperty {
  id: string;
  price: number;
  address: string;
  city: string;
  postcode: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  imageUrl: string;
  savedAt: string;
}

export interface PropertyViewing {
  id: string;
  propertyId: string;
  propertyAddress: string;
  propertyImageUrl: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  agentName: string;
  agentContact: string;
}

export interface ReferencingApplication {
  id: string;
  propertyId: string;
  propertyAddress: string;
  startedAt: string;
  lastUpdatedAt: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'rejected';
  progress: number;
  completedSteps: number;
  totalSteps: number;
}

export interface Contract {
  id: string;
  propertyId: string;
  propertyAddress: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
  signedAt?: string;
  documentUrl?: string;
  parties: Array<{
    name: string;
    email: string;
    status: 'pending' | 'signed' | 'rejected';
  }>;
}

export interface UserFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  category: 'identity' | 'employment' | 'residential' | 'financial' | 'contract' | 'other';
  url: string;
}

// Mock data for dashboard
const mockDashboardData: DashboardSummary = {
  savedSearches: {
    count: 3,
    recentSearches: [
      { id: '1', query: '2 bed flat in Manchester', date: '2023-12-01T10:30:00Z' },
      { id: '2', query: 'Houses in London under £500,000', date: '2023-11-28T14:15:00Z' },
      { id: '3', query: 'Studio apartments in Birmingham', date: '2023-11-25T09:45:00Z' }
    ]
  },
  viewings: {
    upcoming: 3,
    past: 5,
    total: 8,
    nextViewing: {
      property: '12 High Street, Manchester',
      date: '2023-12-15',
      time: '14:00'
    }
  },
  referencing: {
    status: 'in_progress',
    progress: 50,
    completedSteps: 3,
    totalSteps: 6,
    nextStep: 'Financial Information'
  },
  contracts: {
    pending: 0,
    signed: 1,
    total: 1,
    requested: 0,
    urgent: []
  },
  files: {
    count: 8,
    recentlyAdded: [
      { 
        id: '1', 
        name: 'Passport.jpg', 
        type: 'image/jpeg', 
        date: '2023-12-01T14:30:00Z',
        url: 'https://example.com/files/passport.jpg',
        size: 1240000
      },
      { 
        id: '2', 
        name: 'Bank Statement.pdf', 
        type: 'application/pdf', 
        date: '2023-11-29T10:15:00Z',
        url: 'https://example.com/files/bank_statement.pdf',
        size: 2450000
      },
      { 
        id: '3', 
        name: 'Rental Contract.pdf', 
        type: 'application/pdf', 
        date: '2023-11-25T16:45:00Z',
        url: 'https://example.com/files/rental_contract.pdf',
        size: 3200000
      },
      { 
        id: '4', 
        name: 'Proof of Address.pdf', 
        type: 'application/pdf', 
        date: '2023-11-23T09:20:00Z',
        url: 'https://example.com/files/proof_of_address.pdf',
        size: 1800000
      },
      { 
        id: '5', 
        name: 'Property Photo 1.jpg', 
        type: 'image/jpeg', 
        date: '2023-11-20T13:10:00Z',
        url: 'https://example.com/files/property_photo_1.jpg',
        size: 2100000
      },
      { 
        id: '6', 
        name: 'Property Photo 2.jpg', 
        type: 'image/jpeg', 
        date: '2023-11-20T13:12:00Z',
        url: 'https://example.com/files/property_photo_2.jpg',
        size: 1950000
      },
      { 
        id: '7', 
        name: 'Employment Contract.pdf', 
        type: 'application/pdf', 
        date: '2023-11-18T11:30:00Z',
        url: 'https://example.com/files/employment_contract.pdf',
        size: 2700000
      },
      { 
        id: '8', 
        name: 'Utility Bill.pdf', 
        type: 'application/pdf', 
        date: '2023-11-15T16:25:00Z',
        url: 'https://example.com/files/utility_bill.pdf',
        size: 1350000
      }
    ]
  }
};

// Mock saved properties
const mockSavedProperties: SavedProperty[] = [
  {
    id: '1',
    price: 258000,
    address: 'Flat 3A, 12 High Street',
    city: 'Manchester',
    postcode: 'M1 4BT',
    bedrooms: 2,
    bathrooms: 1,
    propertyType: 'Flat',
    imageUrl: '/images/property1.jpg',
    savedAt: '2023-12-01T10:30:00Z'
  },
  {
    id: '2',
    price: 425000,
    address: '45 Park Lane',
    city: 'Manchester',
    postcode: 'M20 2JT',
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'Semi-detached',
    imageUrl: '/images/property2.jpg',
    savedAt: '2023-11-28T14:15:00Z'
  },
  {
    id: '3',
    price: 175000,
    address: 'Studio 12, The Landmark',
    city: 'Manchester',
    postcode: 'M4 5JD',
    bedrooms: 1,
    bathrooms: 1,
    propertyType: 'Studio',
    imageUrl: '/images/property3.jpg',
    savedAt: '2023-11-25T09:45:00Z'
  }
];

// Mock property viewings
const mockViewings: PropertyViewing[] = [
  {
    id: '1',
    propertyId: '1',
    propertyAddress: 'Flat 3A, 12 High Street, Manchester',
    propertyImageUrl: '/images/property1.jpg',
    date: '2023-12-15',
    time: '14:00',
    status: 'upcoming',
    agentName: 'Sarah Johnson',
    agentContact: 'sarah.j@luxcity.com'
  },
  {
    id: '2',
    propertyId: '2',
    propertyAddress: '45 Park Lane, Manchester',
    propertyImageUrl: '/images/property2.jpg',
    date: '2023-12-18',
    time: '11:30',
    status: 'upcoming',
    agentName: 'Michael Brown',
    agentContact: 'michael.b@luxcity.com'
  },
  {
    id: '3',
    propertyId: '3',
    propertyAddress: 'Studio 12, The Landmark, Manchester',
    propertyImageUrl: '/images/property3.jpg',
    date: '2023-12-20',
    time: '16:00',
    status: 'upcoming',
    agentName: 'David Smith',
    agentContact: 'david.s@luxcity.com'
  },
  {
    id: '4',
    propertyId: '4',
    propertyAddress: '78 Queen Street, Manchester',
    propertyImageUrl: '/images/property4.jpg',
    date: '2023-11-10',
    time: '10:00',
    status: 'completed',
    notes: 'Property was nice but too small',
    agentName: 'Emma Wilson',
    agentContact: 'emma.w@luxcity.com'
  },
  {
    id: '5',
    propertyId: '5',
    propertyAddress: '23 River Road, Manchester',
    propertyImageUrl: '/images/property5.jpg',
    date: '2023-11-12',
    time: '13:30',
    status: 'completed',
    notes: 'Excellent property, considered making an offer',
    agentName: 'James Taylor',
    agentContact: 'james.t@luxcity.com'
  }
];

// Mock referencing applications
const mockReferencingApplications: ReferencingApplication[] = [
  {
    id: '1',
    propertyId: '1',
    propertyAddress: 'Flat 3A, 12 High Street, Manchester',
    startedAt: '2023-11-25T14:30:00Z',
    lastUpdatedAt: '2023-12-05T11:45:00Z',
    status: 'in_progress',
    progress: 50,
    completedSteps: 3,
    totalSteps: 6
  }
];

// Mock contracts
const mockContracts: Contract[] = [
  {
    id: '1',
    propertyId: '1',
    propertyAddress: 'Flat 3A, 12 High Street, Manchester',
    status: 'signed',
    createdAt: '2023-11-20T09:30:00Z',
    expiresAt: '2023-12-20T09:30:00Z',
    signedAt: '2023-11-22T14:15:00Z',
    documentUrl: 'https://example.com/contracts/contract1.pdf',
    parties: [
      {
        name: 'Tosin Lanipekun',
        email: 'tosin.lanipekun@example.com',
        status: 'signed'
      },
      {
        name: 'Luxcity Properties',
        email: 'contracts@luxcity.com',
        status: 'signed'
      }
    ]
  }
];

// Mock files
const mockFiles: UserFile[] = mockDashboardData.files.recentlyAdded.map(file => ({
  id: file.id,
  name: file.name,
  type: file.type,
  size: file.size,
  uploadedAt: file.date,
  category: file.name.toLowerCase().includes('passport') || file.name.toLowerCase().includes('photo') 
    ? 'identity' 
    : file.name.toLowerCase().includes('bank') || file.name.toLowerCase().includes('employment')
      ? 'financial'
      : file.name.toLowerCase().includes('address') || file.name.toLowerCase().includes('utility')
        ? 'residential'
        : file.name.toLowerCase().includes('contract')
          ? 'contract'
          : 'other',
  url: file.url
}));

// Mock API endpoints for dashboard
export const mockGetDashboardSummary = async (): Promise<ApiResponse<DashboardSummary>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return { success: true, data: mockDashboardData };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to fetch dashboard summary'
    };
  }
};

export const mockGetSavedProperties = async (): Promise<ApiResponse<SavedProperty[]>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return { success: true, data: mockSavedProperties };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to fetch saved properties'
    };
  }
};

export const mockGetViewings = async (): Promise<ApiResponse<PropertyViewing[]>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return { success: true, data: mockViewings };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to fetch viewings'
    };
  }
};

export const mockGetReferencingApplications = async (): Promise<ApiResponse<ReferencingApplication[]>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, data: mockReferencingApplications };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to fetch referencing applications'
    };
  }
};

export const mockGetContracts = async (): Promise<ApiResponse<Contract[]>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 650));
    
    return { success: true, data: mockContracts };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to fetch contracts'
    };
  }
};

export const mockGetUserFiles = async (): Promise<ApiResponse<UserFile[]>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 750));
    
    return { success: true, data: mockFiles };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to fetch user files'
    };
  }
};

// Function to simulate API errors (for testing error handling)
export const simulateApiError = async <T>(mockFn: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    success: false,
    error: 'Simulated API error for testing'
  };
}; 