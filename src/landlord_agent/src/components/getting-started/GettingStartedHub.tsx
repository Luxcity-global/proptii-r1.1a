import React, { useState, useCallback } from 'react';
import { Check, Minus } from 'lucide-react';
import {
  getProgress,
  getHubMinimized,
  setHubMinimized,
  type GettingStartedApp,
} from '../../../utils/gettingStartedProgress';

const BRAND_BLUE = '#136C9E';

/** Base URL for "Begin tour" – reload landlord app with tour param so App useEffects start the guide. */
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export interface GettingStartedHubProps {
  app: GettingStartedApp;
  userName?: string;
  /** Called when user clicks "Begin tour" (path and tourParam). */
  onResumeClick: (path: string, tourParam?: string) => void;
}

/**
 * Getting Started hub for landlord app: FAB + overlay, progress, steps, "Begin tour" per step.
 * FAB always visible; overlay shows progress and steps.
 */
export function GettingStartedHub({ app, userName, onResumeClick }: GettingStartedHubProps) {
  const [minimized, setMinimizedState] = useState(() => getHubMinimized(app) || true);
  const progress = getProgress(app);

  const toggleMinimized = useCallback(() => {
    const next = !minimized;
    setMinimizedState(next);
    setHubMinimized(app, next);
  }, [app, minimized]);

  const handleBeginTour = useCallback(
    (path: string, tourParam?: string) => {
      setMinimizedState(true);
      setHubMinimized(app, true);
      const url = tourParam
        ? `${path}${path.includes('?') ? '&' : '?'}${tourParam}`
        : path;
      const fullUrl = path.startsWith('http') ? url : `${BASE_URL}${url}`;
      try {
        if (tourParam) localStorage.setItem(tourParam.split('=')[0], '1');
      } catch {}
      requestAnimationFrame(() => {
        setTimeout(() => {
          onResumeClick(path, tourParam);
          window.location.href = fullUrl;
        }, 150);
      });
    },
    [app, onResumeClick]
  );

  const displayName = userName?.trim() || 'there';

  const fab = (
    <div className="group fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      <div
        className="relative rounded-2xl rounded-br-md bg-white px-4 py-2.5 shadow-lg border border-gray-200 text-sm text-gray-800 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200"
        style={{ fontFamily: 'Archivo, sans-serif', maxWidth: '200px' }}
      >
        Need help with anything?
        <div
          className="absolute -bottom-2 right-5 w-4 h-4 rotate-45 border-r border-b border-gray-200 bg-white"
          style={{ boxShadow: '2px 2px 0 -1px rgba(0,0,0,0.05)' }}
          aria-hidden
        />
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={toggleMinimized}
        onKeyDown={(e) => e.key === 'Enter' && toggleMinimized()}
        className="flex items-center justify-center w-20 h-20 rounded-full shadow-lg border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden"
        style={{ fontFamily: 'Archivo, sans-serif' }}
        aria-label="Open getting started"
      >
        <img
          src="/images/Scout ava.png"
          alt="Scout"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );

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
            <span className={`flex-1 min-w-0 ${step.completed ? 'text-gray-500' : 'text-gray-800'}`}>
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

  if (minimized) return fab;

  return (
    <>
      {fab}
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
