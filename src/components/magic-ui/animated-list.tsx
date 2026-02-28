import React, { useEffect, useRef, useState } from 'react';

interface AnimatedListProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  delay = 1000,
  className = '',
}) => {
  const items = React.Children.toArray(children);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (items.length <= 1) return;

    const cycle = () => {
      setVisible(false);
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setVisible(true);
        timerRef.current = setTimeout(cycle, delay);
      }, 400);
    };

    timerRef.current = setTimeout(cycle, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [items.length, delay]);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          width: '100%',
        }}
      >
        {items[currentIndex]}
      </div>
    </div>
  );
};
