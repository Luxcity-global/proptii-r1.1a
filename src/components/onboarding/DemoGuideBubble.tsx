import React, { useEffect, useState, useRef } from 'react';

export interface DemoGuideBubbleProps {
  /** Message shown in the bubble (e.g. "Click here to save property"). */
  message: string;
  /** CSS selector for the target element (e.g. [data-demo-save-target="first"]). */
  targetSelector: string;
  /** Optional: highlight the target with a ring and pulse. */
  highlightTarget?: boolean;
  /** Called when user dismisses the guide (optional). */
  onDismiss?: () => void;
  /** Optional: called when the user clicks "Next" (for multi-step guides). */
  onNext?: () => void;
  /** If true, the bubble is not shown. */
  hidden?: boolean;
  /** Optional: where to place the bubble relative to the target. Defaults to 'above'. */
  placement?: 'above' | 'below';
}

/**
 * Reusable demo guide bubble: speech bubble that points to a pivotal element.
 * Used in onboarding/demo mode for any demo (tenant search, landlord, homeowner).
 */
export function DemoGuideBubble({
  message,
  targetSelector,
  highlightTarget = true,
  onDismiss,
  onNext,
  hidden = false,
  placement = 'above'
}: DemoGuideBubbleProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hidden) {
      setTargetRect(null);
      setBubbleVisible(false);
      return;
    }
    const el = document.querySelector(targetSelector);
    if (!el) {
      setTargetRect(null);
      setBubbleVisible(false);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect(rect);
    setBubbleVisible(true);

    const observer = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setTargetRect(r);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [targetSelector, hidden]);

  useEffect(() => {
    if (!hidden && targetSelector) {
      const el = document.querySelector(targetSelector);
      if (el && highlightTarget) {
        el.classList.add('demo-guide-target-highlight');
        return () => el.classList.remove('demo-guide-target-highlight');
      }
    }
  }, [targetSelector, hidden, highlightTarget]);

  if (hidden || !bubbleVisible || !targetRect) return null;

  // Position bubble near the target
  const bubbleWidth = 220;
  const bubbleLeft = Math.max(16, targetRect.left - bubbleWidth / 2 + targetRect.width / 2);
  const bubbleBottom = window.innerHeight - targetRect.top + 12;
  const bubbleTop = targetRect.bottom + 12;

  return (
    <>
      <div
        ref={containerRef}
        className="fixed z-[100] pointer-events-auto"
        style={
          placement === 'above'
            ? {
                left: bubbleLeft,
                bottom: bubbleBottom,
                width: bubbleWidth
              }
            : {
                left: bubbleLeft,
                top: bubbleTop,
                width: bubbleWidth
              }
        }
      >
        <div className="bg-[#CBE6FF] rounded-xl px-4 py-3 shadow-lg border border-[#136C9E]">
          <p className="text-sm font-medium text-[#0F172A]">{message}</p>
          {(onDismiss || onNext) && (
            <div className="mt-2 flex justify-end gap-3">
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-xs text-gray-600 hover:text-gray-900 underline"
                >
                  Dismiss
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  className="text-xs font-semibold text-[#136C9E] hover:text-[#0F5A8A]"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
        {/* Pointer: small triangle between bubble and target */}
        {placement === 'above' ? (
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-[#CBE6FF] border-r border-b border-[#136C9E] rotate-45"
            style={{ marginBottom: 0 }}
          />
        ) : (
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 bg-[#CBE6FF] border-l border-t border-[#136C9E] rotate-45"
            style={{ marginTop: 0 }}
          />
        )}
      </div>
      <style>{`
        .demo-guide-target-highlight {
          outline: 2px solid #DC5F12;
          outline-offset: 2px;
          border-radius: 9999px;
          animation: demo-guide-pulse 1.5s ease-in-out infinite;
        }
        @keyframes demo-guide-pulse {
          0%, 100% { outline-color: #DC5F12; }
          50% { outline-color: #F97316; }
        }
      `}</style>
    </>
  );
}
