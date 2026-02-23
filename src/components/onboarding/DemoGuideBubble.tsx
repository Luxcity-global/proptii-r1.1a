import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

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
  /** Optional: where to place the bubble relative to the target. Defaults to 'above'. Use 'left' or 'right' to place beside the target. */
  placement?: 'above' | 'below' | 'left' | 'right';
  /** Optional: avatar image URL (e.g. Scout character). */
  avatarSrc?: string;
  /** Optional: horizontal alignment relative to target. 'left' = bubble to the left of target; 'center' = above/below centered. */
  align?: 'left' | 'center';
  /** Optional: which side the avatar is on. Default 'left'. Use 'top' to place avatar above the bubble. */
  avatarSide?: 'left' | 'right' | 'top';
  /** Optional: which side the arrow points from. Default 'right' when align is left, else bottom/top center. */
  arrowSide?: 'left' | 'right';
  /** Optional: horizontal nudge in pixels (positive = right). */
  offsetX?: number;
  /** Optional: vertical nudge in pixels (positive = down). */
  offsetY?: number;
  /** Optional: fix the bubble to a corner of the viewport instead of positioning near the target. */
  fixedPosition?: 'top-left' | 'top-right';
  /** Optional: when target not found, show bubble at this position (e.g. { top: 200, left: 100 }). */
  fallbackPosition?: { top: number; left: number };
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
  placement = 'above',
  avatarSrc,
  align = 'center',
  avatarSide = 'left',
  arrowSide,
  offsetX = 0,
  offsetY = 0,
  fixedPosition,
  fallbackPosition
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
      setBubbleVisible(!!fallbackPosition);
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
  }, [targetSelector, hidden, fallbackPosition]);

  useEffect(() => {
    if (!hidden && targetSelector) {
      const el = document.querySelector(targetSelector);
      if (el && highlightTarget) {
        el.classList.add('demo-guide-target-highlight');
        return () => el.classList.remove('demo-guide-target-highlight');
      }
    }
  }, [targetSelector, hidden, highlightTarget]);

  if (hidden) return null;
  const useFallback = !targetRect && fallbackPosition;
  if (!bubbleVisible || (!targetRect && !useFallback)) return null;

  // Position bubble near the target
  const bubbleWidth = 220;
  const avatarSize = 64;
  const gap = 8;
  const avatarOnTop = avatarSrc && avatarSide === 'top';
  const totalWidth = avatarOnTop ? Math.max(avatarSize, bubbleWidth) : (avatarSrc ? avatarSize + gap + bubbleWidth : bubbleWidth);
  const gapToTarget = 12;
  const cornerPadding = 24;

  let positionStyle: React.CSSProperties;

  if (useFallback && fallbackPosition) {
    positionStyle = {
      left: fallbackPosition.left + offsetX,
      top: fallbackPosition.top + offsetY
    };
  } else if (fixedPosition === 'top-left') {
    positionStyle = {
      left: Math.max(-350, cornerPadding + offsetX),
      top: cornerPadding + offsetY
    };
  } else if (fixedPosition === 'top-right') {
    positionStyle = {
      left: 'auto',
      right: cornerPadding - offsetX,
      top: cornerPadding + offsetY
    };
  } else if (placement === 'left') {
    // Beside target, to the left; vertically centered
    const left = Math.max(16, targetRect.left - totalWidth - gapToTarget);
    const centerY = targetRect.top + targetRect.height / 2;
    positionStyle = {
      left: left + offsetX,
      top: centerY + offsetY,
      transform: 'translateY(-50%)'
    };
  } else if (placement === 'right') {
    // Beside target, to the right; vertically centered
    const left = targetRect.right + gapToTarget;
    const centerY = targetRect.top + targetRect.height / 2;
    positionStyle = {
      left: left + offsetX,
      top: centerY + offsetY,
      transform: 'translateY(-50%)'
    };
  } else {
    const bubbleLeft =
      align === 'left'
        ? Math.max(16, targetRect.left - totalWidth - 16)
        : Math.max(16, targetRect.left - bubbleWidth / 2 + targetRect.width / 2);
    const bubbleLeftWithOffset = bubbleLeft + offsetX;
    const gapToTargetAlign = align === 'left' ? 112 : 12;
    const bubbleBottom = window.innerHeight - targetRect.top - gapToTargetAlign;
    const bubbleTop = targetRect.bottom + gapToTargetAlign;
    const verticalPos = placement === 'above'
      ? { bottom: bubbleBottom - offsetY }
      : { top: bubbleTop + offsetY };
    positionStyle = {
      left: bubbleLeftWithOffset,
      ...verticalPos
    };
  }

  // Arrow: for left placement, point right; for right placement, point left
  const arrowPointsRight = placement === 'left';
  const arrowPointsLeft = placement === 'right';

  const content = (
    <>
      <div
        ref={containerRef}
        className={`fixed z-[100] pointer-events-auto flex ${avatarOnTop ? 'flex-col items-start' : avatarSrc ? 'items-center' : 'items-end'}`}
        style={{
          ...positionStyle,
          width: totalWidth,
          flexDirection: avatarOnTop ? 'column' : (avatarSide === 'right' ? 'row-reverse' : 'row')
        }}
      >
        {avatarSrc && avatarOnTop && (
          <img
            src={avatarSrc}
            alt=""
            className="flex-shrink-0 rounded-full object-cover border-2 border-[#136C9E] bg-white mb-2"
            style={{ width: avatarSize, height: avatarSize }}
          />
        )}
        {avatarSrc && !avatarOnTop && (
          <img
            src={avatarSrc}
            alt=""
            className="flex-shrink-0 rounded-full object-cover border-2 border-[#136C9E] bg-white"
            style={{ width: avatarSize, height: avatarSize }}
          />
        )}
        <div className="relative flex-shrink-0" style={{ width: bubbleWidth }}>
          <div
            className={`bg-[#CBE6FF] rounded-xl px-4 py-3 shadow-lg border border-[#136C9E] ${avatarSrc && !avatarOnTop ? (avatarSide === 'left' ? 'ml-2' : 'mr-2') : ''}`}
          >
            <p className="text-sm font-medium text-[#0F172A] whitespace-pre-line">{message}</p>
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
          {/* Pointer: hide when fixed to corner (unless arrowSide requested) */}
          {(fixedPosition && arrowSide === 'right') ? (
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full"
              style={{
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '10px solid #CBE6FF',
                filter: 'drop-shadow(1px 0 0 #136C9E)'
              }}
            />
          ) : !fixedPosition && (arrowPointsRight ? (
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full"
              style={{
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '10px solid #CBE6FF',
                filter: 'drop-shadow(1px 0 0 #136C9E)'
              }}
            />
          ) : arrowPointsLeft ? (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full"
              style={{
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '10px solid #CBE6FF',
                filter: 'drop-shadow(-1px 0 0 #136C9E)'
              }}
            />
          ) : arrowSide === 'left' ? (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full"
              style={{
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '10px solid #CBE6FF',
                filter: 'drop-shadow(-1px 0 0 #136C9E)'
              }}
            />
          ) : align === 'left' || arrowSide === 'right' ? (
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full"
              style={{
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '10px solid #CBE6FF',
                filter: 'drop-shadow(1px 0 0 #136C9E)'
              }}
            />
          ) : placement === 'above' ? (
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-[#CBE6FF] border-r border-b border-[#136C9E] rotate-45"
              style={{ marginBottom: 0 }}
            />
          ) : (
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 bg-[#CBE6FF] border-l border-t border-[#136C9E] rotate-45"
              style={{ marginTop: 0 }}
            />
          ))}
        </div>
      </div>
      <style>{`
        .demo-guide-target-highlight {
          outline: 2px solid #DC5F12;
          outline-offset: 2px;
          border-radius: 9999px;
          animation:         demo-guide-pulse 1.5s ease-in-out infinite;
        }
        @keyframes demo-guide-pulse {
          0%, 100% { outline-color: #DC5F12; }
          50% { outline-color: #F97316; }
        }
      `}</style>
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content;
}
