import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Minus, Wrench, FileDown, Compass } from 'lucide-react';
import {
  type GettingStartedApp,
  type ProgressStep,
  getProgress,
  getHubMinimized,
  setHubMinimized,
} from '../../utils/gettingStartedProgress';
import { clearOnboardingCompleted, HOMEPAGE_ONBOARDING_FLOW_ENABLED } from '../../utils/onboardingSession';

/** Minimal tool entry for modal tools tab */
const MODAL_TOOLS: { id: string; title: string; link: string }[] = [
  { id: 'readiness-checker', title: 'Rental Readiness Checker', link: '/tools/readiness-checker' },
  { id: 'document-tracker', title: 'Document Tracker', link: '/tools/document-tracker' },
  { id: 'viewing-tracker', title: 'Viewing Tracker', link: '/tools/viewing-tracker' },
  { id: 'process-simulator', title: 'Process Simulator', link: '/tools/process-simulator' },
  { id: 'timeline-generator', title: 'Timeline Generator', link: '/tools/timeline-generator' },
  { id: 'know-your-rights', title: 'Know Your Rights', link: '/tools/know-your-rights' },
];

/** Minimal document entry for modal documents tab */
const MODAL_DOCUMENTS: { id: string; title: string; file: string }[] = [
  { id: 'how-to-rent', title: 'How to Rent Guide', file: '/rental_documents/DLUHC_How_to_rent_Oct2023.pdf' },
  { id: 'right-to-rent-guide', title: 'Right to Rent Checks Guide', file: '/rental_documents/Right to Rent Checks_ A guide to immigration documents for tenants and landlords.pdf' },
  { id: 'right-to-rent-easy-read', title: 'Right to Rent User Guide (Easy Read)', file: '/rental_documents/3286 Home Office Right to Rent User Guide Easy Read v3.pdf' },
  { id: 'prescribed-information', title: 'Prescribed Information Template', file: '/rental_documents/1tds-ew-custodial-prescribed-information-template.docx' },
  { id: 'legionella-assessment', title: 'Legionella Risk Assessment Template', file: '/rental_documents/legionella_Risk_Assessment_template.pdf' },
];

const BRAND_BLUE = '#136C9E';

/** Scout head avatar image for the getting-started FAB */
const SCOUT_HEAD_IMAGE = '/images/Scout ava.png';

export interface GettingStartedHubProps {
  app: GettingStartedApp;
  userName?: string;
  /** 'top' = above main content; 'sidebar' = right-hand sidebar */
  placement?: 'top' | 'sidebar';
  /** 'left' | 'right' – FAB position when using floating placement (default: right) */
  fabPosition?: 'left' | 'right';
  /** Optional: custom resume action (e.g. landlord app opens main app URL) */
  onResumeClick?: (path: string, tourParam?: string) => void;
}

/**
 * Getting Started dashboard hub: progress, up to 5 steps, minimize (to icon), microcopy.
 * FAB always visible; overlay shows progress and steps.
 */
type ModalTab = 'tours' | 'tools' | 'documents';

export function GettingStartedHub({ app, userName, placement = 'top', fabPosition = 'right', onResumeClick }: GettingStartedHubProps) {
  const navigate = useNavigate();
  const [minimized, setMinimizedState] = useState(() => getHubMinimized(app) || true);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('tours');
  const progress = getProgress(app);

  const toggleMinimized = useCallback(() => {
    const next = !minimized;
    setMinimizedState(next);
    setHubMinimized(app, next);
  }, [app, minimized]);

  const handleBeginTour = useCallback(
    (path: string, tourParam?: string) => {
      // Close the Getting Started modal first so it doesn't stay open over the tour
      setMinimizedState(true);
      setHubMinimized(app, true);

      const url = tourParam
        ? `${path}${path.includes('?') ? '&' : '?'}${tourParam}`
        : path;

      const startTour = () => {
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
        // tenant and home: navigate within main app
        try {
          if (tourParam) localStorage.setItem(tourParam.split('=')[0], '1');
        } catch {}
        navigate(url);
      };

      // Defer tour start so the modal can close and unmount first
      requestAnimationFrame(() => {
        setTimeout(startTour, 150);
      });
    },
    [app, navigate, onResumeClick]
  );

  const displayName = userName?.trim() || 'there';

  // Floating trigger: lower left or right – Scout avatar; chat bubble on hover
  const isLeft = fabPosition === 'left';
  const fab = (
    <div
      className={`group fixed bottom-6 z-40 flex flex-col gap-2 ${isLeft ? 'left-6 items-start' : 'right-6 items-end'}`}
    >
      {/* Chat bubble: visible on hover */}
      <div
        className={`relative rounded-2xl bg-white px-4 py-2.5 shadow-lg border border-gray-200 text-sm text-gray-800 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 ${isLeft ? 'rounded-bl-md' : 'rounded-br-md'}`}
        style={{ fontFamily: 'Archivo, sans-serif', maxWidth: '200px' }}
      >
        Need help with anything?
        <div
          className={`absolute -bottom-2 w-4 h-4 rotate-45 border-r border-b border-gray-200 bg-white ${isLeft ? 'left-5' : 'right-5'}`}
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
          src={SCOUT_HEAD_IMAGE}
          alt="Scout"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );

  const isSidebar = placement === 'sidebar';
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
            {activeModalTab === 'tours' && `Let's get you settled, ${displayName}.`}
            {activeModalTab === 'tools' && 'Tools & resources'}
            {activeModalTab === 'documents' && 'Document downloads'}
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {activeModalTab === 'tours' &&
              (progress.completedCount === 0
                ? 'Complete these steps to get the most out of your dashboard.'
                : `${progress.completedCount} of ${progress.total} done.`)}
            {activeModalTab === 'tools' && 'Interactive tools to help you navigate the rental process.'}
            {activeModalTab === 'documents' && 'Official UK government documents for tenants and landlords.'}
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

      {/* Tab navigation */}
      <div className="mt-4 flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveModalTab('tours')}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeModalTab === 'tours'
              ? 'border-[#136C9E] text-gray-900'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          <Compass size={14} />
          Guided Tours
        </button>
        <button
          type="button"
          onClick={() => setActiveModalTab('tools')}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeModalTab === 'tools'
              ? 'border-[#136C9E] text-gray-900'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          <Wrench size={14} />
          Tools
        </button>
        <button
          type="button"
          onClick={() => setActiveModalTab('documents')}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeModalTab === 'documents'
              ? 'border-[#136C9E] text-gray-900'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          <FileDown size={14} />
          Documents
        </button>
      </div>

      {/* Tab content */}
      {activeModalTab === 'tours' && (
        <>
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

      {/* Step list: 3 per dashboard, all 9 for home */}
      <ul className="mt-4 space-y-3">
        {progress.steps.slice(0, app === 'home' ? 9 : 5).map((step: ProgressStep) => (
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

      {/* Resume Onboarding — hidden while homepage onboarding is archived */}
      {HOMEPAGE_ONBOARDING_FLOW_ENABLED && (
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            clearOnboardingCompleted();
            setMinimizedState(true);
            setHubMinimized(app, true);
            navigate('/');
          }}
          className="px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 bg-[#E65D24] text-white hover:bg-[#d9541f] hover:shadow-md"
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          Resume Onboarding
        </button>
      </div>
      )}
        </>
      )}

      {activeModalTab === 'tools' && (
        <ul className="mt-4 space-y-3">
          {MODAL_TOOLS.map((tool) => (
            <li key={tool.id} className="flex items-center gap-3 text-sm">
              <span className="w-5 h-5 rounded shrink-0 bg-blue-100 flex items-center justify-center">
                <Wrench size={12} className="text-blue-600" />
              </span>
              <span className="flex-1 min-w-0 text-gray-800">{tool.title}</span>
              <Link
                to={tool.link}
                onClick={() => {
                  setMinimizedState(true);
                  setHubMinimized(app, true);
                }}
                className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors hover:bg-gray-50 border-gray-300 text-gray-700"
                style={{ fontFamily: 'Archivo, sans-serif' }}
              >
                Open
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <Link
              to="/tools"
              onClick={() => {
                setMinimizedState(true);
                setHubMinimized(app, true);
              }}
              className="text-sm text-[#136C9E] hover:underline font-medium"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              View all tools →
            </Link>
          </li>
        </ul>
      )}

      {activeModalTab === 'documents' && (
        <ul className="mt-4 space-y-3 max-h-64 overflow-y-auto">
          {MODAL_DOCUMENTS.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 text-sm">
              <span className="w-5 h-5 rounded shrink-0 bg-purple-100 flex items-center justify-center">
                <FileDown size={12} className="text-purple-600" />
              </span>
              <span className="flex-1 min-w-0 text-gray-800">{doc.title}</span>
              <a
                href={doc.file}
                download
                className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors hover:bg-gray-50 border-gray-300 text-gray-700"
                style={{ fontFamily: 'Archivo, sans-serif' }}
              >
                Download
              </a>
            </li>
          ))}
          <li className="pt-2">
            <Link
              to="/tools#documents"
              onClick={() => {
                setMinimizedState(true);
                setHubMinimized(app, true);
              }}
              className="text-sm text-[#136C9E] hover:underline font-medium"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              View all documents →
            </Link>
          </li>
        </ul>
      )}
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