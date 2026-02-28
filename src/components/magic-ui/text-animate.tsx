import React, { useEffect, useRef, useState } from 'react';

interface TextAnimateProps {
  children: React.ReactNode;
  className?: string;
  by?: 'word' | 'letter' | 'line';
  animation?: 'fadeIn' | 'slideUp' | 'blurIn';
  startOnView?: boolean;
  once?: boolean;
}

export const TextAnimate: React.FC<TextAnimateProps> = ({
  children,
  className = '',
  by = 'word',
  animation = 'fadeIn',
  startOnView = false,
  once = true,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(!startOnView);
  const [isInView, setIsInView] = useState(!startOnView);

  useEffect(() => {
    if (!startOnView || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) setHasAnimated(true);
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView, once]);

  const shouldAnimate = hasAnimated || (startOnView && isInView);
  const text = String(children);

  const tokens = by === 'word' ? text.split(/\s+/) : by === 'letter' ? text.split('') : [text];
  const delayBase = 50;

  return (
    <span ref={ref} className={className}>
      {tokens.map((token, i) => (
        <span
          key={i}
          style={{
            display: by === 'word' ? 'inline' : 'inline-block',
            whiteSpace: by === 'word' ? 'pre' : 'normal',
            opacity: shouldAnimate ? 1 : 0,
            transform: shouldAnimate ? 'translateY(0)' : 'translateY(8px)',
            transition: `opacity 0.4s ease ${i * delayBase}ms, transform 0.4s ease ${i * delayBase}ms`,
          }}
        >
          {token}
          {by === 'word' && i < tokens.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  );
};
