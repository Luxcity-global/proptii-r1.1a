import React from 'react';
import { isStepComplete, type GettingStartedApp } from '../../utils/gettingStartedProgress';

const BRAND_BLUE = '#136C9E';

export interface ContextualBannerProps {
  app: GettingStartedApp;
  stepId: string;
  /** e.g. "Ready to list your first property?" */
  message: string;
  /** e.g. "Start the 2-minute guide" */
  linkText: string;
  /** Call when user clicks the link – start only this feature's tour (do not restart full tour). */
  onStartGuide: () => void;
}

/**
 * In-feature contextual banner: shows above the feature workspace when this step is incomplete.
 * Non-modal slim banner (toast/top-bar style). "Show me how" launches only this feature's walkthrough.
 */
export function ContextualBanner({
  app,
  stepId,
  message,
  linkText,
  onStartGuide,
}: ContextualBannerProps) {
  if (isStepComplete(app, stepId)) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-lg border border-blue-200 bg-blue-50/80 mb-4"
      style={{ fontFamily: 'Archivo, sans-serif' }}
    >
      <p className="text-sm text-gray-800 m-0">{message}</p>
      <button
        type="button"
        onClick={onStartGuide}
        className="shrink-0 inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: BRAND_BLUE }}
      >
        {linkText}
      </button>
    </div>
  );
}