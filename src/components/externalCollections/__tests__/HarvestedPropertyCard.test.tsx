import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HarvestedPropertyCard from '../HarvestedPropertyCard';
import { HarvestedProperty } from '../../../types/harvesting';

// Mock the FeatureGate component
vi.mock('../../common/FeatureGate', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock the feature flags
vi.mock('../../../config/featureFlags', () => ({
  HARVESTING_FEATURES: {
    ENABLE_RESULTS: true,
    ENABLE_CONTACT: true
  }
}));

const mockProperty: HarvestedProperty = {
  id: 'TEST-HARVESTED-RIGHTMOVE-1',
  source: 'rightmove',
  title: '[TEST LISTING] Apartment in Chelsea, London',
  price: {
    amount: 2500,
    currency: 'GBP',
    type: 'rent',
    period: 'monthly',
    display: '£2,500/month'
  },
  location: {
    address: '[TEST] 123 Chelsea Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    coordinates: [51.5074, -0.1278],
    area: 'Chelsea'
  },
  specifications: {
    bedrooms: 2,
    bathrooms: 1,
    propertyType: 'Apartment',
    totalArea: 85,
    parkingSpaces: 1,
    yearBuilt: 2010
  },
  features: ['Furnished', 'Parking', 'Garden', 'Balcony'],
  description: '[TEST LISTING] Beautiful apartment in the heart of Chelsea. This property features 2 bedrooms and 1 bathroom. Furnished, Parking. Perfect for renting in this sought-after location. This is a test listing for development purposes.',
  images: [
    {
      src: '/images/listings/property-1.jpg',
      alt: '[TEST] Apartment in Chelsea',
      isPrimary: true
    },
    {
      src: '/images/listings/property-2.jpg',
      alt: '[TEST] Apartment interior',
      isPrimary: false
    }
  ],
  agent: {
    name: '[TEST] Sarah Johnson',
    company: '[TEST] Foxtons',
    phone: '+44 20 7123 4567',
    email: 'sarah.johnson@foxtons.com',
    photo: '/images/agents/agent-1.jpg'
  },
  amenities: {
    nearby: ['Supermarket', 'Restaurants', 'Public Transport', 'Schools'],
    onsite: ['Gym', 'Concierge']
  },
  status: 'available',
  metadata: {
    createdAt: '2024-01-01T00:00:00.000Z',
    lastUpdated: '2024-01-01T00:00:00.000Z',
    searchScore: 85,
    viewCount: 45,
    testEnvironment: true
  },
  contactUrl: 'https://rightmove.co.uk/contact/1',
  propertyUrl: 'https://rightmove.co.uk/property/1'
};

describe('HarvestedPropertyCard', () => {
  const mockOnContact = vi.fn();
  const mockOnViewDetails = vi.fn();

  beforeEach(() => {
    mockOnContact.mockClear();
    mockOnViewDetails.mockClear();
  });

  it('renders property information correctly', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByText('[TEST LISTING] Apartment in Chelsea, London')).toBeInTheDocument();
    expect(screen.getByText('£2,500/month')).toBeInTheDocument();
    // Bedrooms, bathrooms, parking: should be three 'text-sm' spans: 2, 1, 1
    const twos = screen.getAllByText('2');
    const ones = screen.getAllByText('1');
    expect(twos.length).toBeGreaterThanOrEqual(1); // bedrooms
    expect(ones.length).toBeGreaterThanOrEqual(2); // bathrooms and parking
    expect(screen.getByText('Furnished')).toBeInTheDocument();
    expect(screen.getByText('Parking')).toBeInTheDocument();
  });

  it('displays property image with correct alt text', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    const image = screen.getByAltText('[TEST] Apartment in Chelsea');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/listings/property-1.jpg');
  });

  it('shows agent information', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByText('[TEST] Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('[TEST] Foxtons')).toBeInTheDocument();
  });

  it('calls onContactAgent when contact button is clicked', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    const contactButton = screen.getByText('Contact Agent');
    fireEvent.click(contactButton);
    
    expect(mockOnContact).toHaveBeenCalledWith(mockProperty.id);
  });

  it('calls onViewDetails when view details button is clicked', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    const viewDetailsButton = screen.getByTitle('View details');
    fireEvent.click(viewDetailsButton);
    
    expect(mockOnViewDetails).toHaveBeenCalledWith(mockProperty.id);
  });

  it('displays source badge correctly', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByText('rightmove')).toBeInTheDocument();
  });

  it('shows property status badge', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByText('available')).toBeInTheDocument();
  });

  it('displays property features', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByText('Furnished')).toBeInTheDocument();
    expect(screen.getByText('Parking')).toBeInTheDocument();
    expect(screen.getByText('Garden')).toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument(); // Shows +1 more for the 4th feature
  });

  it('handles missing optional data gracefully', () => {
    const minimalProperty: HarvestedProperty = {
      ...mockProperty,
      images: [],
      agent: {
        ...mockProperty.agent,
        photo: undefined
      },
      amenities: {
        nearby: [],
        onsite: []
      }
    };

    render(
      <HarvestedPropertyCard 
        property={minimalProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    // Should still render without errors
    expect(screen.getByText('[TEST LISTING] Apartment in Chelsea, London')).toBeInTheDocument();
    expect(screen.getByText('£2,500/month')).toBeInTheDocument();
  });

  it('displays test environment indicator', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    // Check that test indicators are visible
    expect(screen.getByText('[TEST LISTING] Apartment in Chelsea, London')).toBeInTheDocument();
    expect(screen.getByText(/\[TEST\] 123 Chelsea Street/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    // Check for proper button roles
    expect(screen.getByRole('button', { name: 'Contact Agent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View details' })).toBeInTheDocument();
    
    // Check for proper image alt text
    expect(screen.getByAltText('[TEST] Apartment in Chelsea')).toBeInTheDocument();
    
    // Check for proper link
    expect(screen.getByRole('link', { name: 'View' })).toBeInTheDocument();
  });

  it('renders in list mode correctly', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="list"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    // Should still render all the same content
    expect(screen.getByText('[TEST LISTING] Apartment in Chelsea, London')).toBeInTheDocument();
    expect(screen.getByText('£2,500/month')).toBeInTheDocument();
    expect(screen.getByText('Contact Agent')).toBeInTheDocument();
  });

  it('displays bedrooms, bathrooms, and parking correctly', () => {
    render(
      <HarvestedPropertyCard 
        property={mockProperty} 
        viewMode="grid"
        onContactAgent={mockOnContact}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    // Bedrooms, bathrooms, parking: should be three 'text-sm' spans: 2, 1, 1
    const numbers = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && element.className.includes('text-sm') && (content === '2' || content === '1');
    });
    // Should find 3: 2 (bedrooms), 1 (bathrooms), 1 (parking)
    expect(numbers.length).toBeGreaterThanOrEqual(3);
  });
}); 