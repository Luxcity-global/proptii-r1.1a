import React from 'react';
import { LogIn } from 'lucide-react';
import { Button } from './ui/button';

interface LandlordEmptyStateProps {
  onSignIn: () => void;
}

/**
 * Inline empty state for the dashboard content area.
 * Shows when user is not signed in - displays scout mascot, message, and sign-in button
 * in place of the data table, so users can still see the dashboard layout.
 */
export function LandlordEmptyState({ onSignIn }: LandlordEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]">
      <div className="flex flex-col md:flex-row items-center gap-8 max-w-2xl">
        <img
          src="/images/scout1.png"
          alt="Scout"
          className="w-40 h-40 md:w-48 md:h-48 object-contain flex-shrink-0"
        />
        <div className="text-center md:text-left">
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#374957' }}>
            Hello there
          </h2>
          <p className="text-muted-foreground mb-6">
            Sign in to view and manage your properties, tenants, and contracts.
          </p>
          <Button
            onClick={onSignIn}
            className="flex items-center gap-2 px-12 py-3 min-h-[3.5rem] rounded-full transition-all duration-300 flex-shrink-0 w-auto"
            style={{
              backgroundColor: '#DC5F12',
              borderColor: '#DC5F12',
              minWidth: '180px',
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            <LogIn className="w-4 h-4" strokeWidth={2.5} />
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
