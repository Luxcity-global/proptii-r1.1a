import React from 'react';
import { Plus, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import type { LandlordEmptyPageId } from '../utils/landlordEmptyPageTypes';

const PAGE_COPY: Record<
  LandlordEmptyPageId,
  { title: string; description: string; cta: string }
> = {
  dashboard: {
    title: 'Welcome to your dashboard',
    description:
      'Add your first property to start tracking occupancy, documents, viewings, and more.',
    cta: 'Add your first property',
  },
  properties: {
    title: 'No properties yet',
    description:
      'Add a property to start managing listings, tenants, and compliance in one place.',
    cta: 'Add property',
  },
  documents: {
    title: 'No documents yet',
    description:
      'Upload certificates and compliance documents once you have added a property.',
    cta: 'Add property',
  },
  viewings: {
    title: 'No viewings yet',
    description:
      'Viewing requests and bookings will appear here after you add a property.',
    cta: 'Add property',
  },
  contracts: {
    title: 'No contracts yet',
    description:
      'Send and track tenancy agreements once you have added a property and tenants.',
    cta: 'Add property',
  },
  clients: {
    title: 'No tenants yet',
    description:
      'Add a property first, then invite tenants to manage leases and rent from here.',
    cta: 'Add property',
  },
  insights: {
    title: 'No portfolio data yet',
    description:
      'Analytics and performance insights will appear once you add properties to your portfolio.',
    cta: 'Add property',
  },
};

interface LandlordNewUserEmptyStateProps {
  page: LandlordEmptyPageId;
  onAddProperty?: () => void;
  userName?: string;
}

export function LandlordNewUserEmptyState({
  page,
  onAddProperty,
  userName,
}: LandlordNewUserEmptyStateProps) {
  const copy = PAGE_COPY[page];
  const greeting = userName?.trim()
    ? `Welcome, ${userName.split(' ')[0]}`
    : 'Welcome';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]">
      <div className="flex flex-col md:flex-row items-center gap-8 max-w-2xl">
        <img
          src="/images/scout1.png"
          alt="Scout"
          className="w-40 h-40 md:w-48 md:h-48 object-contain flex-shrink-0"
        />
        <div className="text-center md:text-left">
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: '#374957' }}
          >
            {greeting}
          </h2>
          <p className="font-medium mb-2" style={{ color: '#374957' }}>
            {copy.title}
          </p>
          <p className="text-muted-foreground mb-6">{copy.description}</p>
          {onAddProperty && (
            <Button
              onClick={onAddProperty}
              className="flex items-center gap-2 px-12 py-3 min-h-[3.5rem] rounded-full transition-all duration-300 flex-shrink-0 w-auto"
              style={{
                backgroundColor: '#DC5F12',
                borderColor: '#DC5F12',
                minWidth: '180px',
                background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
                e.currentTarget.style.boxShadow =
                  '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
                e.currentTarget.style.boxShadow =
                  '0 2px 4px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              {copy.cta}
            </Button>
          )}
          {!onAddProperty && (
            <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
              <Building2 className="w-4 h-4" />
              Add a property from the Properties page to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
