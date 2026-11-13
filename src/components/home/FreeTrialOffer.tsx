import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  FileSignature,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { GiftBox } from './GiftBox';
import '../../styles/freeTrialOffer.css';

interface FreeTrialOfferProps {
  isLight?: boolean;
  /** Gift + short label only, for tight mobile headers. */
  compact?: boolean;
  /** Open the modal automatically, at most once per browser session. */
  autoOpen?: boolean;
}

const AUTO_OPEN_SESSION_KEY = 'proptii_free_trial_offer_seen';
const AUTO_OPEN_DELAY_MS = 800;

const HIGHLIGHTS: { label: string; icon: LucideIcon }[] = [
  { label: 'Search properties', icon: Search },
  { label: 'Book viewings', icon: CalendarCheck },
  { label: 'Referencing', icon: ShieldCheck },
  { label: 'Contracts', icon: FileSignature },
];

const CONFETTI_COLORS = ['#F15A22', '#FFB48F', '#5BC0EB', '#FFC93C', '#FFFFFF'];

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 7) % 100}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  round: i % 3 === 0,
  delay: `${((i * 0.43) % 4).toFixed(2)}s`,
  duration: `${3.4 + (i % 4) * 0.6}s`,
  drift: `${i % 2 === 0 ? '' : '-'}${12 + (i % 5) * 6}px`,
}));

const rise = (delayMs: number) => ({ '--offer-delay': `${delayMs}ms` }) as CSSProperties;

const FreeTrialModal = ({ onClose, onSignUp }: { onClose: () => void; onSignUp: () => void }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [motionPaused, setMotionPaused] = useState(false);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="offer-backdrop fixed inset-0 z-[100] flex overflow-y-auto bg-black/65 p-4 backdrop-blur-md font-nunito"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="free-trial-offer-title"
        className={`offer-motion offer-card relative m-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#123A5C] via-[#0E2B47] to-[#0A1F33] px-6 pb-6 pt-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:px-8 ${
          motionPaused ? 'offer-motion-paused' : ''
        }`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {CONFETTI.map((piece, i) => (
            <span
              key={i}
              className={`offer-confetti ${piece.round ? 'h-2 w-2 rounded-full' : 'h-3 w-1.5 rounded-sm'}`}
              style={
                {
                  left: piece.left,
                  backgroundColor: piece.color,
                  '--fall-delay': piece.delay,
                  '--fall-duration': piece.duration,
                  '--drift': piece.drift,
                  '--fall': '220px',
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div
          aria-hidden="true"
          className="offer-halo pointer-events-none absolute -top-20 left-1/2 h-64 w-64 rounded-full bg-[#F15A22]/30 blur-3xl"
        />

        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMotionPaused((paused) => !paused)}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F15A22]"
          >
            {motionPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {motionPaused ? 'Play motion' : 'Pause motion'}
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close offer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/80 transition-all duration-300 hover:rotate-90 hover:border-white/50 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F15A22]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="offer-rise relative -mt-2 flex justify-center" style={rise(80)}>
          <GiftBox size={136} />
        </div>

        <div className="relative text-center">
          <p
            className="offer-rise text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFB48F]"
            style={rise(180)}
          >
            ✦ Your welcome gift
          </p>
          <h2
            id="free-trial-offer-title"
            className="offer-rise mt-2 font-archivo text-2xl font-bold tracking-tight sm:text-[28px]"
            style={rise(260)}
          >
            Start free. No commitment.
          </h2>

          <div className="offer-rise mt-4 flex items-center justify-center gap-3" style={rise(340)}>
            <span className="offer-number inline-block font-archivo text-6xl font-extrabold leading-none text-[#F15A22]">
              1
            </span>
            <span className="text-left leading-tight">
              <span className="block text-xl font-bold">month free</span>
              <span className="block text-xs text-white/60">for every new user</span>
            </span>
          </div>

          <p className="offer-rise mt-4 text-sm text-white/75" style={rise(420)}>
            Create your Proptii account and enjoy your first 30 days on us.
          </p>
        </div>

        <div
          className="offer-rise relative mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-xs text-white/75"
          style={rise(500)}
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB48F]" aria-hidden="true" />
          <span>No card required to start. Your free month is applied automatically once you sign up.</span>
        </div>

        <div className="offer-rise relative mt-5" style={rise(580)}>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-white/85">Explore Proptii</span>
            <span className="text-white/50">All in one place</span>
          </div>
          <ul className="grid grid-cols-4 gap-2">
            {HIGHLIGHTS.map(({ label, icon: Icon }, i) => (
              <li
                key={label}
                className="offer-tile flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-1.5 py-3 text-center"
                style={{ '--tile-delay': `${i * 1.2}s` } as CSSProperties}
              >
                <span className="offer-tile__icon flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE07A] via-[#FFB48F] to-[#F15A22] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]">
                  <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                </span>
                <span className="text-[11px] font-medium leading-tight text-white/85">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onSignUp}
          className="offer-rise group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#F15A22] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#F15A22]/30 transition-all hover:bg-[#d94e1c] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={rise(660)}
        >
          <span
            aria-hidden="true"
            className="offer-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
          />
          <span className="relative">Sign Up</span>
          <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>

        <p className="offer-rise relative mt-3 text-center text-[11px] text-white/45" style={rise(720)}>
          30 days free, once per account.
        </p>
      </div>
    </div>,
    document.body
  );
};

export const FreeTrialOffer = ({
  isLight = false,
  compact = false,
  autoOpen = false,
}: FreeTrialOfferProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!autoOpen) return;
    try {
      if (sessionStorage.getItem(AUTO_OPEN_SESSION_KEY)) return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(AUTO_OPEN_SESSION_KEY, '1');
      } catch {
        // Private mode can block storage; the modal still opens this once.
      }
      setIsOpen(true);
    }, AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleSignUp = () => {
    setIsOpen(false);
    navigate('/signup');
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Get 1 month free"
        className={`offer-motion offer-pill-pulse group relative isolate overflow-hidden rounded-full p-[1.5px] transition-transform hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F15A22] focus-visible:ring-offset-2 ${
          isLight ? 'focus-visible:ring-offset-white' : 'focus-visible:ring-offset-transparent'
        }`}
      >
        <span
          aria-hidden="true"
          className="offer-pill-border absolute inset-[-150%] -z-10 bg-[conic-gradient(from_0deg,#F15A22,#FFB48F,#FFE07A,#5BC0EB,#F15A22)]"
        />
        <span
          className={`flex items-center rounded-full bg-[#0B2238] ${
            compact ? 'gap-1.5 py-1 pl-1 pr-3' : 'gap-2 py-1.5 pl-1.5 pr-4'
          }`}
        >
          <span className="flex shrink-0 items-center justify-center">
            <GiftBox size={compact ? 26 : 32} burst={false} />
          </span>
          <span className="text-left leading-tight">
            <span className={`block whitespace-nowrap font-bold text-white ${compact ? 'text-xs' : 'text-[13px]'}`}>
              {compact ? '1 month free' : 'Get 1 month free'}
            </span>
            {!compact && (
              <span className="block whitespace-nowrap text-[10px] font-medium text-white/60">
                Free · No commitment
              </span>
            )}
          </span>
        </span>
      </button>

      {isOpen && <FreeTrialModal onClose={close} onSignUp={handleSignUp} />}
    </>
  );
};
