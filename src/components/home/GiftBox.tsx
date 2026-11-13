import { useId, type CSSProperties } from 'react';
import '../../styles/freeTrialOffer.css';

interface GiftBoxProps {
  size: number;
  /** Coins, light rays and sparkles that spill out while the lid is open. */
  burst?: boolean;
  className?: string;
}

const COINS = [
  { dx: '-26px', dy: '-44px', delay: '0s' },
  { dx: '2px', dy: '-58px', delay: '0.1s' },
  { dx: '28px', dy: '-42px', delay: '0.2s' },
];

const SPARKS = [
  { x: 14, y: 40, delay: '0s', scale: 1 },
  { x: 106, y: 30, delay: '0.8s', scale: 0.8 },
  { x: 100, y: 88, delay: '1.4s', scale: 0.6 },
  { x: 20, y: 92, delay: '1.9s', scale: 0.7 },
];

const SPARK_PATH = 'M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6Z';

export const GiftBox = ({ size, burst = true, className = '' }: GiftBoxProps) => {
  // useId emits colons, which break url(#…) references in some browsers.
  const id = useId().replace(/:/g, '');
  const ref = (name: string) => `${id}-${name}`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      className={`gift-box ${className}`}
    >
      <defs>
        <linearGradient id={ref('box')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF9F6B" />
          <stop offset="55%" stopColor="#F15A22" />
          <stop offset="100%" stopColor="#C8431A" />
        </linearGradient>
        <linearGradient id={ref('lid')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB385" />
          <stop offset="100%" stopColor="#F46A30" />
        </linearGradient>
        <linearGradient id={ref('ribbon')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7FD3F5" />
          <stop offset="100%" stopColor="#2E9BD0" />
        </linearGradient>
        <linearGradient id={ref('bow')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE07A" />
          <stop offset="100%" stopColor="#F5A524" />
        </linearGradient>
        <linearGradient id={ref('ray')} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#FFE9A8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFE9A8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={ref('coin')} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFF3B0" />
          <stop offset="60%" stopColor="#FFC93C" />
          <stop offset="100%" stopColor="#E39B14" />
        </radialGradient>
      </defs>

      <ellipse className="gift-box__shadow" cx="60" cy="110" rx="36" ry="5" fill="#000" opacity="0.35" />

      <g className="gift-box__base">
        <rect x="24" y="60" width="72" height="46" rx="7" fill={`url(#${ref('box')})`} />
        <rect x="24" y="60" width="16" height="46" rx="7" fill="#fff" opacity="0.14" />
        <rect x="24" y="60" width="72" height="7" fill="#000" opacity="0.14" />
        <rect x="53" y="60" width="14" height="46" fill={`url(#${ref('ribbon')})`} />
      </g>

      {burst && (
        <g className="gift-box__glow">
          <polygon points="42,62 78,62 98,4 22,4" fill={`url(#${ref('ray')})`} />
          <ellipse cx="60" cy="62" rx="30" ry="6" fill="#FFF1C1" />
        </g>
      )}

      <g className="gift-box__lid">
        <path
          d="M60 46 C48 26 28 30 37 43 C41 49 52 48 60 46Z"
          fill={`url(#${ref('bow')})`}
          stroke="#E39B14"
          strokeWidth="1"
        />
        <path
          d="M60 46 C72 26 92 30 83 43 C79 49 68 48 60 46Z"
          fill={`url(#${ref('bow')})`}
          stroke="#E39B14"
          strokeWidth="1"
        />
        <rect x="18" y="45" width="84" height="18" rx="6" fill={`url(#${ref('lid')})`} />
        <rect x="20" y="46" width="80" height="5" rx="2.5" fill="#fff" opacity="0.3" />
        <rect x="53" y="45" width="14" height="18" fill={`url(#${ref('ribbon')})`} />
        <rect x="54" y="39" width="12" height="9" rx="4" fill={`url(#${ref('bow')})`} stroke="#E39B14" strokeWidth="1" />
      </g>

      {burst &&
        COINS.map((coin, i) => (
          <g
            key={i}
            className="gift-box__coin"
            style={{ '--dx': coin.dx, '--dy': coin.dy, animationDelay: coin.delay } as CSSProperties}
          >
            <circle cx="60" cy="60" r="7" fill={`url(#${ref('coin')})`} stroke="#D98E0F" strokeWidth="1" />
            <path
              d="M60 56 L61.2 58.8 L64 59.2 L62 61.2 L62.5 64 L60 62.6 L57.5 64 L58 61.2 L56 59.2 L58.8 58.8Z"
              fill="#FFF7D6"
            />
          </g>
        ))}

      {burst &&
        SPARKS.map((spark, i) => (
          <g key={i} transform={`translate(${spark.x} ${spark.y}) scale(${spark.scale})`}>
            <path className="gift-box__spark" d={SPARK_PATH} fill="#FFE07A" style={{ animationDelay: spark.delay }} />
          </g>
        ))}
    </svg>
  );
};
