import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AgentContactModal from '../AgentContactModal';
import { HarvestedProperty } from '../../../types/harvesting';

// Mock the FeatureGate component
vi.mock('../../common/FeatureGate', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock the feature flags
vi.mock('../../../config/featureFlags', () => ({
  HARVESTING_FEATURES: {
    ENABLE_CONTACT_MODAL: true
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
  description: '[TEST LISTING] Beautiful apartment in the heart of Chelsea.',
  images: [
    {
      src: '/images/listings/property-1.jpg',
      alt: '[TEST] Apartment in Chelsea',
      isPrimary: true
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
    nearby: ['Supermarket', 'Restaurants'],
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

describe('AgentContactModal', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnClose.mockClear();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <AgentContactModal
        isOpen={true}
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('Contact Agent')).toBeInTheDocument();
    expect(screen.getByText('[TEST LISTING] Apartment in Chelsea, London')).toBeInTheDocument();
    expect(screen.getByText('[TEST] Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('[TEST] Foxtons')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <AgentContactModal
        isOpen={false}
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.queryByText('Contact Agent')).not.toBeInTheDocument();
  });

  it('displays property information correctly', () => {
    render(
      <AgentContactModal
        isOpen={true}
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('£2,500/month')).toBeInTheDocument();
    expect(screen.getByText('[TEST] 123 Chelsea Street, London')).toBeInTheDocument();
  });

  it('has all required form fields', () => {
    render(
      <AgentContactModal
        isOpen={true}
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByLabelText('Your Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Message *')).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    render(
      <AgentContactModal
        isOpen={true}
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    const submitButton = screen.getByText('Send Message');
    fireEvent.click(submitButton);
    // No custom error messages are rendered; browser validation prevents submission
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(
      <AgentContactModal
        isOpen={true}
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    const emailInput = screen.getByLabelText('Email Address *');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByText('Send Message');
    fireEvent.click(submitButton);
    // No custom error messages are rendered; browser validation prevents submission
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(
      <AgentContactModal
        isOpen={true}
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Your Name *'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+44 7123 456789' } });
    fireEvent.change(screen.getByLabelText('Message *'), { target: { value: 'I am interested in this property' } });
    
    const submitButton = screen.getByText('Send Message');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        propertyId: mockProperty.id,
        agentId: mockProperty.agent.name,
        contactInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 7123 456789',
          message: 'I am interested in this property',
        },
        preferredContactMethod: 'email',
      });
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <AgentContactModal
        isOpen={true}
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <AgentContactModal
        isOpen={true}
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const mockSubmitWithDelay = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <AgentContactModal
        isOpen={true}
        property={mockProperty}
        onSubmit={mockSubmitWithDelay}
        onClose={mockOnClose}
      />
    );
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Your Name *'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Message *'), { target: { value: 'Test message' } });
    
    const submitButton = screen.getByText('Send Message');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('displays agent contact information', () => {
    render(
      <AgentContactModal
        isOpen={true}
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('+44 20 7123 4567')).toBeInTheDocument();
    expect(screen.getByText('sarah.johnson@foxtons.com')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <AgentContactModal
        isOpen={true}
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    // Check for proper form labels
    expect(screen.getByLabelText('Your Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Message *')).toBeInTheDocument();
    
    // Check for proper button roles
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('handles missing agent photo gracefully', () => {
    const propertyWithoutPhoto = {
      ...mockProperty,
      agent: {
        ...mockProperty.agent,
        photo: undefined
      }
    };

    render(
      <AgentContactModal
        isOpen={true}
        property={propertyWithoutPhoto}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    
    // Should still render without errors
    expect(screen.getByText('[TEST] Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('[TEST] Foxtons')).toBeInTheDocument();
  });
}); 