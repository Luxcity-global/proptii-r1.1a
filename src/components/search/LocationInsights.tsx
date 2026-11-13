import React, { useState } from 'react';

export const extractLocationLabel = (query: string): string => {
  const locationMatch = query.match(
    /\b(?:in|at|near)\s+([A-Za-z][A-Za-z\s]*?)(?=\s+(?:under|over|below|above|for|with|to|pcm|pw)\b|\s*£|\s*\d|$)/i
  );
  const location = locationMatch ? locationMatch[1].trim().replace(/,+$/, '') : '';
  return location || 'this area';
};

interface LocationInsightsProps {
  searchQuery: string;
  propertyCount: number;
}

type MetricTone = 'emerald' | 'blue' | 'orange' | 'teal';

interface AreaMetric {
  name: string;
  tooltip: string;
  tone: MetricTone;
  score: number;
  label: string;
  icon: React.ReactNode;
}

const AREA_METRICS: AreaMetric[] = [
  {
    name: 'Public Transport',
    tooltip: 'Excellent access to public transport networks and major routes',
    tone: 'emerald',
    score: 5,
    label: 'Excellent',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="4" y="3" width="16" height="16" rx="2" />
        <path d="M4 11h16" />
        <path d="M12 3v8" />
      </svg>
    ),
  },
  {
    name: 'Schools & Universities',
    tooltip: 'Multiple schools and educational facilities in the vicinity',
    tone: 'blue',
    score: 4,
    label: 'Strong',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
      </svg>
    ),
  },
  {
    name: 'Shopping',
    tooltip: 'Convenient access to supermarkets and retail outlets',
    tone: 'orange',
    score: 4,
    label: 'Convenient',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
      </svg>
    ),
  },
  {
    name: 'Healthcare',
    tooltip: 'Medical facilities and pharmacies readily available',
    tone: 'teal',
    score: 3,
    label: 'Available',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

const METRIC_BAR_COUNT = 5;

export const LocationInsights: React.FC<LocationInsightsProps> = ({ searchQuery, propertyCount }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'strengths' | 'recommendations' | 'amenities'>('overview');

  const location = extractLocationLabel(searchQuery);
  const locationLabel = location || 'this area';

  return (
    <div className="sr-intel">
      <div className="sr-intel-head">
        <div className="sr-intel-title-row">
          <div className="sr-intel-title">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span>Local Area Intelligence — {locationLabel}</span>
          </div>
          <span className="sr-intel-chip">{propertyCount} listings</span>
        </div>

        <div className="sr-intel-tabs" role="tablist">
          {(
            [
              ['overview', 'Overview'],
              ['strengths', 'Strengths'],
              ['recommendations', 'Tips'],
              ['amenities', 'Amenities'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              className={`sr-intel-tab${activeTab === key ? ' is-active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="sr-intel-body">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="sr-gauge-card" title="Area snapshot based on connectivity and local amenities">
              <div className="sr-gauge">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72" aria-hidden>
                  <circle cx="36" cy="36" r="28" fill="none" stroke="#E2E8F0" strokeWidth="5.5" />
                  <circle
                    cx="36"
                    cy="36"
                    r="28"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="5.5"
                    strokeDasharray="175.9"
                    strokeDashoffset="35"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="sr-gauge-center">
                  <span className="sr-gauge-score">{propertyCount}</span>
                  <span className="sr-gauge-denom">listings</span>
                </div>
              </div>
              <div className="sr-gauge-copy">
                <h3>
                  Area snapshot
                  <span className="sr-live-dot" />
                </h3>
                <p>
                  {locationLabel} is a well-connected residential area with good access to public transport
                  and local amenities, suitable for both families and professionals.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {AREA_METRICS.map((metric) => (
                <div key={metric.name} className="sr-metric-row" title={metric.tooltip}>
                  <div className="sr-metric-left">
                    <div className={`sr-metric-icon ${metric.tone}`}>{metric.icon}</div>
                    <div>
                      <span className="sr-metric-name">{metric.name}</span>
                      <div className="sr-metric-bars">
                        {Array.from({ length: METRIC_BAR_COUNT }, (_, i) => (
                          <span key={i} className={i < metric.score ? `on ${metric.tone}` : undefined} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="sr-metric-right">
                    <span className={`sr-metric-label ${metric.tone}`}>{metric.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'strengths' && (
          <div className="space-y-3">
            <div className="sr-insight-card">
              <span className="sr-insight-mark check">✓</span>
              <div>
                <h4>Property availability</h4>
                <p>{propertyCount} properties currently available, with a diverse range of types and price points.</p>
              </div>
            </div>
            <div className="sr-insight-card">
              <span className="sr-insight-mark check">✓</span>
              <div>
                <h4>Connectivity</h4>
                <p>Well-served by public transport, close to major road networks, and a good walkability score.</p>
              </div>
            </div>
            <div className="sr-insight-card">
              <span className="sr-insight-mark check">✓</span>
              <div>
                <h4>Local amenities</h4>
                <p>Supermarkets, restaurants, cafes, parks and recreational facilities within easy reach.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            <div className="sr-insight-card tip">
              <span className="sr-insight-mark warn">!</span>
              <div>
                <h4>Viewing tips</h4>
                <p>Schedule viewings at different times of day, check water pressure and heating, and ask about council tax and extra fees.</p>
              </div>
            </div>
            <div className="sr-insight-card tip">
              <span className="sr-insight-mark warn">!</span>
              <div>
                <h4>Location research</h4>
                <p>Visit the area at different times, review local community feedback, and look into nearby development plans.</p>
              </div>
            </div>
            <div className="sr-insight-card tip">
              <span className="sr-insight-mark warn">!</span>
              <div>
                <h4>Quick actions</h4>
                <p>Compare prices with similar properties, read landlord reviews if available, and prepare tenancy questions in advance.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'amenities' && (
          <div>
            <div className="sr-amenity-group">
              <h4>Nearby</h4>
              <ul>
                <li>Schools & education</li>
                <li>Hospitals & clinics</li>
                <li>Shopping centres</li>
                <li>Restaurants & cafes</li>
                <li>Parks & recreation</li>
                <li>Public transport</li>
                <li>Gyms & fitness</li>
                <li>Entertainment</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
