import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

const KEY = 'proptii_cookie_notice_dismissed';

export function CookieNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(KEY) !== '1');
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#0F2537] text-white text-sm px-4 py-3 md:px-6 flex flex-col md:flex-row md:items-center gap-3 justify-between"
    >
      <p className="opacity-90 max-w-3xl">
        <span>
          We only use cookies and browser storage that are needed to run Proptii
          (sign-in and the forms you submit).
        </span>
        <span className="block">
          We do not use analytics cookies. Read our{' '}
          <Link to="/cookie-policy" className="underline hover:text-gray-200">
            Cookie Policy
          </Link>
          .
        </span>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 px-4 py-2 bg-[#2C5B81] hover:bg-[#3A6B91] rounded text-white font-medium transition-colors"
      >
        OK
      </button>
    </div>
  );
}

export default CookieNotice;
