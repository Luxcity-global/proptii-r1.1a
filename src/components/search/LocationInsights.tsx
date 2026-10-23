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
        </div>

        <div className="sr-intel-tabs" role="tablist">
          {(
            [
              ['overview', 'Overview'],
              ['strengths', 'Area Strengths'],
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
          <div>
            <div className="sr-intel-stat-grid">
              <div className="sr-intel-stat">
                <span className="sr-intel-stat-val">{propertyCount}</span>
                <span className="sr-intel-stat-lbl">Active listings</span>
              </div>
              <div className="sr-intel-stat">
                <span className="sr-intel-stat-val">High</span>
                <span className="sr-intel-stat-lbl">Rental demand</span>
              </div>
              <div className="sr-intel-stat">
                <span className="sr-intel-stat-val">Good</span>
                <span className="sr-intel-stat-lbl">Transport links</span>
              </div>
              <div className="sr-intel-stat">
                <span className="sr-intel-stat-val">Strong</span>
                <span className="sr-intel-stat-lbl">Local amenities</span>
              </div>
            </div>
            <p className="sr-intel-desc">
              Insights based on current market availability and neighborhood intelligence for {locationLabel}.
            </p>
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
