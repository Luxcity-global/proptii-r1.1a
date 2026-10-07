/**
 * PropertySetupStep1 — redirect shim.
 *
 * The add-property wizard is now fully handled by AddPropertyWizard.tsx.
 * This component used to be a hub/landing screen with separate section-jump
 * buttons (Section 1: Type, Section 2: Details, etc.) that mapped to individual
 * full-page screens. Those screens no longer exist — AddPropertyWizard handles
 * all steps in one place.
 *
 * App.tsx still maps the 'property-setup-step1' screen case to AddPropertyWizard
 * directly, so this component is never rendered in the normal flow. It is kept
 * here solely so any external code that imports PropertySetupStep1 continues to
 * compile. On mount it immediately calls onNext() to advance out of itself.
 */
import React, { useEffect } from 'react';

interface PropertySetupStep1Props {
  onNext: () => void;
  onBack: () => void;
  onHome: () => void;
  onSection1: () => void;
  onSection2: () => void;
  onSection3: () => void;
  onSection4: () => void;
  onBulkImport?: () => void;
}

export function PropertySetupStep1({ onNext }: PropertySetupStep1Props) {
  // Auto-advance immediately — this component should never render visibly.
  useEffect(() => {
    onNext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Minimal loading state shown for the ~1 frame before the effect fires.
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#f7fafc', fontFamily: 'Nunito Sans, sans-serif' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
          style={{ borderColor: '#136C9E', borderTopColor: 'transparent' }}
        />
        <p className="text-[13px] text-[#64748b]">Loading…</p>
      </div>
    </div>
  );
}

export default PropertySetupStep1;
