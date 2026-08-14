import { useEffect, useState } from 'react';
import '../styles/search-loading.css';

const SCOUT_IMAGE = '/images/Scout ava.png';

const STEPS = [
  { label: 'Understanding your search' },
  { label: 'Scanning live listings' },
  { label: 'Ranking best matches' },
];

const STEP_DURATION_MS = 15000;
const FILL_DURATION_MS = 45000;

const TIPS = [
  { heading: 'Did you know?', body: 'Adding “south-facing garden” finds homes that get the most afternoon sun.' },
  { heading: 'Pro tip', body: 'Homes near a station sell 12% faster — mention it to prioritise commuter-friendly listings.' },
  { heading: 'Scout says', body: 'Try “quiet street” or “corner plot” for more outdoor space.' },
  { heading: 'Good to know', body: 'Ofsted-rated schools are factored in when you say “near good schools”.' },
];

const BLIPS = [
  { top: '22%', left: '68%', delay: '0.3s', size: 5 },
  { top: '62%', left: '20%', delay: '0.9s', size: 4 },
  { top: '72%', left: '65%', delay: '1.4s', size: 3 },
  { top: '30%', left: '28%', delay: '0.6s', size: 4 },
];

interface SearchLoadingAnimationProps {
  query?: string;
}

function Radar() {
  return (
    <div className="search-load-radar">
      {[1, 2, 3].map((ring) => (
        <div
          key={ring}
          className="search-load-ring-static"
          style={{ width: ring * 56, height: ring * 56 }}
          aria-hidden
        />
      ))}
      <div className="search-load-ring-ping" aria-hidden />
      <div className="search-load-ring-ping search-load-ring-ping-delay" aria-hidden />
      {BLIPS.map((blip, index) => (
        <div
          key={index}
          className="search-load-blip"
          style={{
            top: blip.top,
            left: blip.left,
            width: blip.size,
            height: blip.size,
            animationDelay: blip.delay,
          }}
          aria-hidden
        />
      ))}
      <div className="search-load-avatar">
        <img src={SCOUT_IMAGE} alt="Scout" className="search-load-avatar-img" draggable={false} />
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActiveDots() {
  return (
    <span className="search-load-dots">
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="search-load-dot" style={{ animationDelay: `${dot * 0.16}s` }} />
      ))}
    </span>
  );
}

export const SearchLoadingAnimation = ({ query = '' }: SearchLoadingAnimationProps) => {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(96, (elapsed / FILL_DURATION_MS) * 96));
      setActiveStep(Math.min(STEPS.length - 1, Math.floor(elapsed / STEP_DURATION_MS)));
    }, 50);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let fadeTimer: number | undefined;
    const id = window.setInterval(() => {
      setTipVisible(false);
      fadeTimer = window.setTimeout(() => {
        setTipIndex((current) => (current + 1) % TIPS.length);
        setTipVisible(true);
      }, 380);
    }, 3800);

    return () => {
      window.clearInterval(id);
      if (fadeTimer) window.clearTimeout(fadeTimer);
    };
  }, []);

  const tip = TIPS[tipIndex];

  return (
    <div
      className="search-load-root"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Searching for properties"
    >
      <div className="search-load-inner">
        <Radar />

        <div className="search-load-status">
          <p className="search-load-headline">{STEPS[activeStep].label}</p>
          {query ? <p className="search-load-query">“{query}”</p> : null}
        </div>

        <div className="search-load-progress-wrap">
          <div
            className="search-load-bar"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="search-load-bar-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="search-load-steps">
            {STEPS.map((step, index) => {
              const done = index < activeStep;
              const active = index === activeStep;
              return (
                <div key={step.label} className="search-load-step">
                  <div
                    className={`search-load-step-icon${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}
                  >
                    {done ? <CheckIcon /> : active ? <ActiveDots /> : <span className="search-load-step-idle" />}
                  </div>
                  <span
                    className={`search-load-step-label${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`search-load-tip${tipVisible ? ' is-visible' : ''}`}>
          <p className="search-load-tip-heading">{tip.heading}</p>
          <p className="search-load-tip-body">{tip.body}</p>
        </div>
      </div>
      <span className="sr-only">Searching for properties...</span>
    </div>
  );
};

export default SearchLoadingAnimation;
