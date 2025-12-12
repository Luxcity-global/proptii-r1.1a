import { useState, useEffect } from 'react';
import { trackEvent } from '../utils/performanceMonitor';

export type ABTestVariant = 'A' | 'B';

interface UseABTestOptions {
  testName: string;
  defaultVariant?: ABTestVariant;
  persistKey?: string;
  trackAssignment?: boolean;
}

/**
 * Custom hook for A/B testing
 * 
 * @param testName - Name of the A/B test (e.g., 'landing-page-image')
 * @param defaultVariant - Default variant if assignment fails (defaults to 'A')
 * @param persistKey - localStorage key to persist variant (defaults to `ab-test-${testName}`)
 * @param trackAssignment - Whether to track variant assignment in analytics (defaults to true)
 * 
 * @returns The assigned variant ('A' or 'B')
 * 
 * @example
 * const variant = useABTest({ testName: 'landing-page-image' });
 * const imageUrl = variant === 'A' ? '/images/family.jpg' : '/images/signing.jpg';
 */
export const useABTest = ({
  testName,
  defaultVariant = 'A',
  persistKey,
  trackAssignment = true,
}: UseABTestOptions): ABTestVariant => {
  const storageKey = persistKey || `ab-test-${testName}`;
  const [variant, setVariant] = useState<ABTestVariant>(defaultVariant);

  useEffect(() => {
    // Check if variant is already stored in localStorage
    const storedVariant = localStorage.getItem(storageKey) as ABTestVariant | null;

    if (storedVariant && (storedVariant === 'A' || storedVariant === 'B')) {
      // Use stored variant
      setVariant(storedVariant);
      
      if (trackAssignment) {
        trackEvent('ABTest_View', {
          testName,
          variant: storedVariant,
          source: 'localStorage',
        });
      }
    } else {
      // Assign new variant randomly (50/50 split)
      const newVariant: ABTestVariant = Math.random() < 0.5 ? 'A' : 'B';
      
      // Store in localStorage for consistency
      localStorage.setItem(storageKey, newVariant);
      setVariant(newVariant);
      
      if (trackAssignment) {
        trackEvent('ABTest_Assignment', {
          testName,
          variant: newVariant,
          source: 'random',
        });
      }
    }
  }, [testName, storageKey, trackAssignment]);

  return variant;
};




