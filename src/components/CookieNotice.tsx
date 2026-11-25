import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  denyAnalyticsConsent,
  grantAnalyticsConsent,
  trackPageView,
} from '../utils/analytics';

const KEY = 'proptii_cookie_notice_dismissed';

export function CookieNotice() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(KEY) !== '1');
    } catch {
      setOpen(true);
    }
  }, []);

  const dismissNotice = useCallback(() => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  const acceptEssentialOnly = useCallback(() => {
    denyAnalyticsConsent();
    dismissNotice();
  }, [dismissNotice]);

  const acceptAll = useCallback(async () => {
    await grantAnalyticsConsent();
    dismissNotice();
    const path = `${location.pathname}${location.search}`;
    trackPageView(path);
  }, [dismissNotice, location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        acceptEssentialOnly();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, acceptEssentialOnly]);

  if (!open) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#0F2537] text-white text-sm px-4 py-3 md:px-6 flex flex-col md:flex-row md:items-center gap-3 justify-between"
    >
      <p className="opacity-90 max-w-3xl">
        <span>
          We use essential cookies and browser storage to run Proptii (sign-in and the forms you
          submit).
        </span>
        <span className="block">
          With your consent, we also use Google Analytics to understand how the site is used. Read
          our{' '}
          <Link to="/cookie-policy" className="underline hover:text-gray-200">
            Cookie Policy
          </Link>
          .
        </span>
      </p>
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <button
          type="button"
          onClick={acceptEssentialOnly}
          className="px-4 py-2 border border-white/30 hover:bg-white/10 rounded text-white font-medium transition-colors"
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={() => void acceptAll()}
          className="px-4 py-2 bg-[#2C5B81] hover:bg-[#3A6B91] rounded text-white font-medium transition-colors"
        >
          Accept analytics
        </button>
      </div>
    </div>
  );
}

export default CookieNotice;
