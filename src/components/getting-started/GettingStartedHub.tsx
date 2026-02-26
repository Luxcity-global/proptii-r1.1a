import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ListChecks, Minus } from 'lucide-react';
import {
  type GettingStartedApp,
  getProgress,
  isAllComplete,
  getHubMinimized,
  setHubMinimized,
} from '../../utils/gettingStartedProgress';

const BRAND_BLUE = '#136C9E';

export interface GettingStartedHubProps {
  app: GettingStartedApp;
  userName?: string;
  /** 'top' = above main content; 'sidebar' = right-hand sidebar */
  placement?: 'top' | 'sidebar';
  /** Optional: custom resume action (e.g. landlord app opens main app URL) */
  onResumeClick?: (path: string, tourParam?: string) => void;
}

/**
 * Getting Started dashboard hub: progress, up to 5 steps, minimize (to icon), microcopy.
 * Hidden when all core actions are complete.
 */
export function GettingStartedHub({ app, userName, placement = 'top', onResumeClick }: GettingStartedHubProps) {
  const navigate = useNavigate();
  const [minimized, setMinimizedState] = useState(getHubMinimized(app));
  const progress = getProgress(app);
  const allComplete = isAllComplete(app);

  const toggleMinimized = useCallback(() => {
    const next = !minimized;
    setMinimizedState(next);
    setHubMinimized(app, next);
  }, [app, minimized]);

  const handleBeginTour = useCallback(
    (path: string, tourParam?: string) => {
      const url = tourParam
        ? `${path}${path.includes('?') ? '&' : '?'}${tourParam}`
        : path;
      if (onResumeClick) {
        onResumeClick(path, tourParam);
        return;
      }
      if (app === 'homeowner' || app === 'landlord') {
        try {
          if (tourParam) localStorage.setItem(tourParam.split('=')[0], '1');
        } catch {}
        window.location.href = url;
        return;
      }
      try {
        if (tourParam) localStorage.setItem(tourParam.split('=')[0], '1');
      } catch {}
      navigate(url);
    },
    [app, navigate, onResumeClick]
  );

  if (allComplete) return null;

  const displayName = userName?.trim() || 'there';

  // Floating button: lower right corner of dashboard
  const fab = (
    <div
      role="button"
      tabIndex={0}
      onClick={toggleMinimized}
      onKeyDown={(e) => e.key === 'Enter' && toggleMinimized()}
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
      style={{ fontFamily: 'Archivo, sans-serif' }}
      aria-label="Open getting started"
    >
      <ListChecks size={26} style={{ color: BRAND_BLUE }} />
      <span
        className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: BRAND_BLUE }}
      >
        {progress.completedCount}/{progress.total}
      </span>
    </div>
  );

  const isSidebar = placement === 'sidebar';
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Let&apos;s get you settled, {displayName}.
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {progress.completedCount === 0
              ? 'Complete these steps to get the most out of your dashboard.'
              : `${progress.completedCount} of ${progress.total} done.`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleMinimized}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Minimize getting started"
          >
            <Minus size={16} />
            Minimize
          </button>
        </div>
      </div>

      {/* Progress: horizontal bar + percentage */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%`, backgroundColor: BRAND_BLUE }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 shrink-0" style={{ minWidth: '3ch' }}>
          {progress.percentage}%
        </span>
      </div>

      {/* Step list (max 5) with "Begin tour" outline button per step */}
      <ul className="mt-4 space-y-3">
        {progress.steps.slice(0, 5).map((step) => (
          <li key={step.id} className="flex items-center gap-3 text-sm">
            {step.completed ? (
              <span className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 bg-green-100">
                <Check size={14} className="text-green-600" strokeWidth={2.5} />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 shrink-0 border-gray-300" />
            )}
            <span className={`flex-1 min-w-0 ${step.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
              {step.label}
            </span>
            <button
              type="button"
              onClick={() => handleBeginTour(step.path, step.tourParam)}
              className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors hover:bg-gray-50 border-gray-300 text-gray-700"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              Begin tour
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  if (isSidebar) {
    return (
      <aside
        className="w-72 shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm p-5"
        style={{ fontFamily: 'Archivo, sans-serif' }}
      >
        {content}
      </aside>
    );
  }

  // Default: FAB in lower right; when expanded, show overlay
  if (minimized) {
    return fab;
  }

  return (
    <>
      {fab}
      {/* Overlay: open when not minimized */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        role="dialog"
        aria-modal="true"
        aria-label="Getting started"
        onClick={(e) => e.target === e.currentTarget && toggleMinimized()}
      >
        <div
          className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-lg w-full p-6 transition-opacity duration-200"
          style={{ fontFamily: 'Archivo, sans-serif' }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    </>
  );
}
