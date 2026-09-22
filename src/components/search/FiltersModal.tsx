import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { ClassifyEntities } from '../../types/govData';
import type { Property } from '../../types/property';

export interface SearchFilterState {
  priceMin: number;
  priceMax: number;
  pricePeriod: 'monthly' | 'weekly';
  beds: string[];
  baths: string[];
  propTypes: string[];
  transaction: 'rent' | 'buy';
  availability: 'now' | '30' | 'date';
  outdoor: string[];
  furnishing: string;
  pets: string[];
  rooms: string[];
  tenure: string[];
  billsIncluded: boolean;
  commuteTime: number;
  commuteDest: string;
  commuteModes: string[];
  floors: string[];
  accessibility: string[];
  buildingAmenities: string[];
  propStyle: string[];
  floorplan: boolean;
  virtualTour: boolean;
  verifiedOnly: boolean;
}

const BED_OPTIONS = ['Studio', '1', '2', '3', '4', '5+'];
const BATH_OPTIONS = ['1+', '2+', '3+', '4+'];
const PROP_TYPE_OPTIONS = ['Detached', 'Semi-detached', 'Terraced', 'Flat / Apartment', 'Studio', 'Bungalow'];
const OUTDOOR_OPTIONS = ['Private Garden', 'Balcony / Terrace', 'Off-street Parking', 'Garage', 'EV Charging'];
const FURNISHING_OPTIONS = ['Furnished', 'Unfurnished', 'Part-furnished'];
const PET_OPTIONS = ['Dogs allowed', 'Cats allowed'];
const ROOM_OPTIONS = ['Home Office / Study', 'Ensuite Bathroom', 'Open-plan Kitchen'];
const TENURE_OPTIONS = ['Freehold', 'Leasehold', 'Share of Freehold'];
const TRANSPORT_OPTIONS = ['Tube', 'Rail', 'Bus', 'Cycling', 'Driving'];
const FLOOR_OPTIONS = ['Ground', 'Low (1–3)', 'Mid (4–8)', 'High (9–15)', 'Penthouse'];
const ACCESS_OPTIONS = ['Step-free access', 'Lift'];
const AMENITY_OPTIONS = ['Concierge', 'Gym', "Residents' Lounge", 'Rooftop', 'Swimming Pool'];
const STYLE_OPTIONS = ['Period / Victorian', 'Edwardian', 'Art Deco', 'Modern (1970s–2000s)', 'New Build', 'Needs Renovation', 'Move-in Ready'];

const PROP_TYPE_QUERY: Record<string, string> = {
  Detached: 'detached house',
  'Semi-detached': 'semi-detached house',
  Terraced: 'terraced house',
  'Flat / Apartment': 'flat',
  Studio: 'studio',
  Bungalow: 'bungalow',
};

const TYPE_PATTERNS: Array<[RegExp, string]> = [
  [/semi[-\s]?detached/i, 'Semi-detached'],
  [/detached/i, 'Detached'],
  [/terraced/i, 'Terraced'],
  [/bungalow/i, 'Bungalow'],
  [/\bstudio\b/i, 'Studio'],
  [/flat|apartment/i, 'Flat / Apartment'],
];

const OUTDOOR_PATTERNS: Array<[RegExp, string]> = [
  [/garden/i, 'Private Garden'],
  [/balcon|terrace/i, 'Balcony / Terrace'],
  [/parking|off[-\s]?street/i, 'Off-street Parking'],
  [/garage/i, 'Garage'],
  [/ev charg/i, 'EV Charging'],
];

function parsePriceNumber(price: string): number {
  if (!price) return 0;
  const match = price.replace(/,/g, '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function detectMatches(query: string, patterns: Array<[RegExp, string]>): string[] {
  const found: string[] = [];
  for (const [re, label] of patterns) {
    if (re.test(query) && !found.includes(label)) found.push(label);
  }
  return found;
}

function sliderBounds(transaction: 'rent' | 'buy', period: 'monthly' | 'weekly') {
  if (transaction === 'buy') return { max: 1_500_000, step: 5_000 };
  if (period === 'weekly') return { max: 750, step: 25 };
  return { max: 3_000, step: 50 };
}

export function seedFiltersFromSearch(
  query: string,
  entities?: ClassifyEntities | null,
): SearchFilterState {
  const q = query || '';
  const transaction: 'rent' | 'buy' =
    entities?.tenure === 'buy' || /\bto buy\b|\bfor sale\b/i.test(q) ? 'buy' : 'rent';

  let beds: string[] = [];
  if (entities?.bedrooms != null) {
    if (entities.bedrooms === 0) beds = ['Studio'];
    else if (entities.bedrooms >= 5) beds = ['5+'];
    else beds = [String(entities.bedrooms)];
  } else if (/\bstudio\b/i.test(q)) {
    beds = ['Studio'];
  } else {
    const bedMatch = q.match(/(\d+)\s*(?:bed|bedroom)/i);
    if (bedMatch) {
      const n = parseInt(bedMatch[1], 10);
      beds = [n >= 5 ? '5+' : String(n)];
    }
  }

  const priceMax = entities?.price_max ?? (transaction === 'buy' ? 500_000 : 1_200);
  const bounds = sliderBounds(transaction, 'monthly');

  let furnishing = '';
  if (/part[-\s]?furnished/i.test(q)) furnishing = 'Part-furnished';
  else if (/unfurnished/i.test(q)) furnishing = 'Unfurnished';
  else if (/furnished/i.test(q)) furnishing = 'Furnished';

  const pets: string[] = [];
  if (/dogs?\s+allowed|pet friendly|pets?\s+allowed/i.test(q)) pets.push('Dogs allowed');
  if (/cats?\s+allowed/i.test(q)) pets.push('Cats allowed');

  return {
    priceMin: 0,
    priceMax: Math.min(Math.max(priceMax, bounds.step), bounds.max),
    pricePeriod: 'monthly',
    beds,
    baths: [],
    propTypes: detectMatches(q, TYPE_PATTERNS),
    transaction,
    availability: 'now',
    outdoor: detectMatches(q, OUTDOOR_PATTERNS),
    furnishing,
    pets,
    rooms: /office|study/i.test(q) ? ['Home Office / Study'] : [],
    tenure: transaction === 'buy' && /leasehold/i.test(q) ? ['Leasehold'] : [],
    billsIncluded: /bills included/i.test(q),
    commuteTime: 30,
    commuteDest: '',
    commuteModes: [],
    floors: [],
    accessibility: [],
    buildingAmenities: [],
    propStyle: [],
    floorplan: /floorplan/i.test(q),
    virtualTour: /virtual(?:\s+3d)?\s+tour/i.test(q),
    verifiedOnly: false,
  };
}

export function buildFilterSearchQuery(
  state: SearchFilterState,
  location: string,
): string {
  const bits: string[] = [];

  const bedBits = state.beds.map((bed) => {
    if (bed === 'Studio') return 'studio';
    if (bed === '5+') return '5+ bedroom';
    return `${bed} bedroom`;
  });
  if (bedBits.length) bits.push(bedBits.join(' or '));

  const typeBits = state.propTypes
    .map((t) => PROP_TYPE_QUERY[t] || t.toLowerCase())
    .filter((t) => t !== 'studio' || !bedBits.includes('studio'));
  if (typeBits.length) bits.push(typeBits.join(' or '));

  const loc = location.trim();
  if (loc && loc.toLowerCase() !== 'this area') bits.push(`in ${loc}`);

  bits.push(state.transaction === 'buy' ? 'to buy' : 'to rent');

  if (state.priceMax > 0) {
    const formatted = state.priceMax.toLocaleString('en-GB');
    if (state.transaction === 'buy') bits.push(`under £${formatted}`);
    else if (state.pricePeriod === 'weekly') bits.push(`under £${formatted} pw`);
    else bits.push(`under ${state.priceMax}pcm`);
  }

  if (state.availability === '30') bits.push('available within 30 days');
  if (state.furnishing) bits.push(state.furnishing.toLowerCase());
  if (state.billsIncluded) bits.push('bills included');

  const extras = [
    ...state.outdoor,
    ...state.pets,
    ...state.rooms,
    ...state.tenure,
    ...state.floors.map((f) => `${f} floor`),
    ...state.accessibility,
    ...state.buildingAmenities,
    ...state.propStyle,
    ...state.commuteModes,
  ];
  if (extras.length) bits.push(`with ${extras.join(', ')}`);
  if (state.commuteDest.trim()) {
    bits.push(`commute to ${state.commuteDest.trim()} within ${state.commuteTime} minutes`);
  }
  if (state.floorplan) bits.push('floorplan');
  if (state.virtualTour) bits.push('virtual tour');

  return bits.join(' ').replace(/\s+/g, ' ').trim();
}

function matchesCoreFilters(property: Property, state: SearchFilterState): boolean {
  const bedsRaw = Number(property.bedrooms);
  if (state.beds.length && Number.isFinite(bedsRaw)) {
    const ok = state.beds.some((bed) => {
      if (bed === 'Studio') return bedsRaw === 0;
      if (bed === '5+') return bedsRaw >= 5;
      return bedsRaw === Number(bed);
    });
    if (!ok) return false;
  }

  const bathsRaw = Number(property.bathrooms);
  if (state.baths.length && Number.isFinite(bathsRaw) && property.bathrooms != null) {
    const minBaths = Math.max(...state.baths.map((b) => parseInt(b, 10) || 0));
    if (bathsRaw < minBaths) return false;
  }

  const price = parsePriceNumber(property.price);
  if (price > 0) {
    let min = state.priceMin;
    let max = state.priceMax;
    if (state.transaction === 'rent' && state.pricePeriod === 'weekly') {
      min = Math.round((min * 52) / 12);
      max = Math.round((max * 52) / 12);
    }
    if (price < min || price > max) return false;
  }

  if (state.propTypes.length) {
    const hay = `${property.propertyType || ''} ${property.title || ''}`.toLowerCase();
    const ok = state.propTypes.some((t) => {
      if (t === 'Flat / Apartment') return /flat|apartment/.test(hay);
      if (t === 'Semi-detached') return /semi/.test(hay);
      return hay.includes(t.split(' / ')[0].toLowerCase());
    });
    if (!ok) return false;
  }

  return true;
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function PillRow({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="sr-fm-pills">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`sr-fm-pill${selected.includes(opt) ? ' is-on' : ''}`}
          onClick={() => onToggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Accordion({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="sr-fm-acc">
      <button
        type="button"
        className="sr-fm-acc-head"
        aria-expanded={open}
        onClick={() => onToggle(id)}
      >
        <span>{title}</span>
        <svg className={`sr-fm-chevron${open ? ' is-open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open ? <div className="sr-fm-acc-body">{children}</div> : null}
    </div>
  );
}

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  locationLabel: string;
  entities?: ClassifyEntities | null;
  results: Property[];
  onApply: (query: string, matchCount: number) => void;
}

export function FiltersModal({
  isOpen,
  onClose,
  searchQuery,
  locationLabel,
  entities,
  results,
  onApply,
}: FiltersModalProps) {
  const [draft, setDraft] = useState<SearchFilterState>(() => seedFiltersFromSearch(searchQuery, entities));
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setDraft(seedFiltersFromSearch(searchQuery, entities));
    setOpenAccordions(new Set());
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps -- seed only when the dialog opens

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const location = entities?.location || entities?.address_full || locationLabel;
  const bounds = sliderBounds(draft.transaction, draft.pricePeriod);
  const minPct = Math.min(100, (draft.priceMin / bounds.max) * 100);
  const maxPct = Math.min(100, (draft.priceMax / bounds.max) * 100);

  const matchCount = useMemo(() => {
    if (!results.length) return 0;
    return results.filter((property) => matchesCoreFilters(property, draft)).length;
  }, [results, draft]);

  const update = (patch: Partial<SearchFilterState>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const setPricePeriod = (pricePeriod: 'monthly' | 'weekly') => {
    setDraft((prev) => {
      const nextBounds = sliderBounds(prev.transaction, pricePeriod);
      return {
        ...prev,
        pricePeriod,
        priceMin: Math.min(prev.priceMin, nextBounds.max - nextBounds.step),
        priceMax: Math.min(Math.max(prev.priceMax, nextBounds.step), nextBounds.max),
      };
    });
  };

  const setTransaction = (transaction: 'rent' | 'buy') => {
    setDraft((prev) => {
      const nextBounds = sliderBounds(transaction, prev.pricePeriod);
      let { priceMin, priceMax } = prev;
      if (transaction === 'buy' && priceMax <= 3_000) {
        priceMin = 0;
        priceMax = 500_000;
      }
      if (transaction === 'rent' && priceMax > 3_000) {
        priceMin = 0;
        priceMax = 1_200;
      }
      return {
        ...prev,
        transaction,
        priceMin: Math.min(priceMin, nextBounds.max - nextBounds.step),
        priceMax: Math.min(Math.max(priceMax, nextBounds.step), nextBounds.max),
      };
    });
  };

  const handleMinSlider = (raw: number) => {
    const v = Math.min(raw, draft.priceMax - bounds.step);
    update({ priceMin: Math.max(0, v) });
  };

  const handleMaxSlider = (raw: number) => {
    const v = Math.max(raw, draft.priceMin + bounds.step);
    update({ priceMax: Math.min(bounds.max, v) });
  };

  const handleApply = () => {
    const query = buildFilterSearchQuery(draft, location);
    if (!query) return;
    onApply(query, matchCount);
  };

  const handleReset = () => {
    setDraft(seedFiltersFromSearch(searchQuery, entities));
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="sr-fm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="sr-fm-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sr-fm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sr-fm-header">
          <h2 id="sr-fm-title">All Filters</h2>
          <button type="button" className="sr-fm-close" onClick={onClose} title="Close filters" aria-label="Close filters">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="sr-fm-body">
          <div className="sr-fm-stack">
            <div>
              <div className="sr-fm-label-row">
                <span className="sr-fm-label">Price Range</span>
                {draft.transaction === 'rent' ? (
                  <div className="sr-fm-seg sr-fm-seg-sm">
                    <button
                      type="button"
                      className={draft.pricePeriod === 'monthly' ? 'is-on' : ''}
                      onClick={() => setPricePeriod('monthly')}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      className={draft.pricePeriod === 'weekly' ? 'is-on' : ''}
                      onClick={() => setPricePeriod('weekly')}
                    >
                      Weekly
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="sr-fm-slider-wrap">
                <div className="sr-fm-dual">
                  <div className="sr-fm-dual-track" />
                  <div
                    className="sr-fm-dual-hl"
                    style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={bounds.max}
                    step={bounds.step}
                    value={draft.priceMin}
                    className="sr-fm-range"
                    aria-label="Minimum price"
                    onChange={(e) => handleMinSlider(Number(e.target.value))}
                  />
                  <input
                    type="range"
                    min={0}
                    max={bounds.max}
                    step={bounds.step}
                    value={draft.priceMax}
                    className="sr-fm-range"
                    aria-label="Maximum price"
                    onChange={(e) => handleMaxSlider(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="sr-fm-price-inputs">
                <div className="sr-fm-price-field">
                  <span>£</span>
                  <input
                    type="number"
                    step={bounds.step}
                    min={0}
                    max={draft.priceMax - bounds.step}
                    value={draft.priceMin}
                    onChange={(e) => handleMinSlider(Number(e.target.value) || 0)}
                  />
                </div>
                <span className="sr-fm-price-dash">—</span>
                <div className="sr-fm-price-field">
                  <span>£</span>
                  <input
                    type="number"
                    step={bounds.step}
                    min={draft.priceMin + bounds.step}
                    max={bounds.max}
                    value={draft.priceMax}
                    onChange={(e) => handleMaxSlider(Number(e.target.value) || bounds.max)}
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="sr-fm-label">Bedrooms</span>
              <PillRow options={BED_OPTIONS} selected={draft.beds} onToggle={(v) => update({ beds: toggleValue(draft.beds, v) })} />
            </div>
            <div>
              <span className="sr-fm-label">Bathrooms</span>
              <PillRow options={BATH_OPTIONS} selected={draft.baths} onToggle={(v) => update({ baths: toggleValue(draft.baths, v) })} />
            </div>
            <div>
              <span className="sr-fm-label">Property Type</span>
              <PillRow options={PROP_TYPE_OPTIONS} selected={draft.propTypes} onToggle={(v) => update({ propTypes: toggleValue(draft.propTypes, v) })} />
            </div>

            <div className="sr-fm-split">
              <div>
                <span className="sr-fm-label">Transaction</span>
                <div className="sr-fm-seg">
                  <button type="button" className={draft.transaction === 'rent' ? 'is-on' : ''} onClick={() => setTransaction('rent')}>
                    Rent
                  </button>
                  <button type="button" className={draft.transaction === 'buy' ? 'is-on' : ''} onClick={() => setTransaction('buy')}>
                    Buy
                  </button>
                </div>
              </div>
              <div className="sr-fm-avail">
                <label className="sr-fm-label" htmlFor="sr-fm-availability">Move-in / Availability</label>
                <select
                  id="sr-fm-availability"
                  value={draft.availability}
                  onChange={(e) => update({ availability: e.target.value as SearchFilterState['availability'] })}
                >
                  <option value="now">Available now</option>
                  <option value="30">Within 30 days</option>
                  <option value="date">Specific date</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="sr-fm-hr" />

          <div className="sr-fm-stack">
            <div>
              <span className="sr-fm-label">Outdoor Space & Parking</span>
              <PillRow options={OUTDOOR_OPTIONS} selected={draft.outdoor} onToggle={(v) => update({ outdoor: toggleValue(draft.outdoor, v) })} />
            </div>
            <div>
              <span className="sr-fm-label">Furnishing</span>
              <PillRow
                options={FURNISHING_OPTIONS}
                selected={draft.furnishing ? [draft.furnishing] : []}
                onToggle={(v) => update({ furnishing: draft.furnishing === v ? '' : v })}
              />
            </div>
            <div>
              <span className="sr-fm-label">Pet Policy</span>
              <PillRow options={PET_OPTIONS} selected={draft.pets} onToggle={(v) => update({ pets: toggleValue(draft.pets, v) })} />
            </div>
            <div>
              <span className="sr-fm-label">Key Interior Rooms</span>
              <PillRow options={ROOM_OPTIONS} selected={draft.rooms} onToggle={(v) => update({ rooms: toggleValue(draft.rooms, v) })} />
            </div>
            {draft.transaction === 'buy' ? (
              <div>
                <span className="sr-fm-label">Tenure</span>
                <PillRow options={TENURE_OPTIONS} selected={draft.tenure} onToggle={(v) => update({ tenure: toggleValue(draft.tenure, v) })} />
              </div>
            ) : (
              <label className="sr-fm-bills">
                <span>
                  <span className="sr-fm-bills-title">Bills Included in Rent</span>
                  <span className="sr-fm-bills-sub">Includes water, council tax & high-speed broadband</span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.billsIncluded}
                  onChange={(e) => update({ billsIncluded: e.target.checked })}
                />
              </label>
            )}
          </div>

          <hr className="sr-fm-hr" />

          <div className="sr-fm-advanced">
            <p className="sr-fm-advanced-label">Advanced & Niche Preferences</p>

            <Accordion id="commute" title="Commute & Transport" open={openAccordions.has('commute')} onToggle={toggleAccordion}>
              <div>
                <div className="sr-fm-commute-label">
                  <span>Max commute time</span>
                  <strong>{draft.commuteTime} mins</strong>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={draft.commuteTime}
                  className="sr-fm-commute-range"
                  onChange={(e) => update({ commuteTime: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="sr-fm-label sr-fm-label-muted" htmlFor="sr-fm-commute-dest">Destination</label>
                <input
                  id="sr-fm-commute-dest"
                  type="text"
                  className="sr-fm-text"
                  placeholder="e.g. Leeds Railway Station, London Bridge..."
                  value={draft.commuteDest}
                  onChange={(e) => update({ commuteDest: e.target.value })}
                />
              </div>
              <div>
                <span className="sr-fm-label sr-fm-label-muted">Transport Mode</span>
                <PillRow options={TRANSPORT_OPTIONS} selected={draft.commuteModes} onToggle={(v) => update({ commuteModes: toggleValue(draft.commuteModes, v) })} />
              </div>
            </Accordion>

            <Accordion id="building" title="Building, Floor & Accessibility" open={openAccordions.has('building')} onToggle={toggleAccordion}>
              <div>
                <span className="sr-fm-label sr-fm-label-muted">Floor Level</span>
                <PillRow options={FLOOR_OPTIONS} selected={draft.floors} onToggle={(v) => update({ floors: toggleValue(draft.floors, v) })} />
              </div>
              <div>
                <span className="sr-fm-label sr-fm-label-muted">Accessibility</span>
                <PillRow options={ACCESS_OPTIONS} selected={draft.accessibility} onToggle={(v) => update({ accessibility: toggleValue(draft.accessibility, v) })} />
              </div>
              <div>
                <span className="sr-fm-label sr-fm-label-muted">Building Amenities</span>
                <PillRow options={AMENITY_OPTIONS} selected={draft.buildingAmenities} onToggle={(v) => update({ buildingAmenities: toggleValue(draft.buildingAmenities, v) })} />
              </div>
            </Accordion>

            <Accordion id="style" title="Property Age & Style" open={openAccordions.has('style')} onToggle={toggleAccordion}>
              <span className="sr-fm-label sr-fm-label-muted">Architectural Style</span>
              <PillRow options={STYLE_OPTIONS} selected={draft.propStyle} onToggle={(v) => update({ propStyle: toggleValue(draft.propStyle, v) })} />
            </Accordion>

            <Accordion id="media" title="Listing Media & Verification" open={openAccordions.has('media')} onToggle={toggleAccordion}>
              <label className="sr-fm-check">
                <span>Floorplan included</span>
                <input type="checkbox" checked={draft.floorplan} onChange={(e) => update({ floorplan: e.target.checked })} />
              </label>
              <label className="sr-fm-check">
                <span>Virtual 3D tour available</span>
                <input type="checkbox" checked={draft.virtualTour} onChange={(e) => update({ virtualTour: e.target.checked })} />
              </label>
              <label className="sr-fm-check">
                <span>Verified listings only</span>
                <input type="checkbox" checked={draft.verifiedOnly} onChange={(e) => update({ verifiedOnly: e.target.checked })} />
              </label>
            </Accordion>
          </div>
        </div>

        <div className="sr-fm-footer">
          <button type="button" className="sr-fm-clear" onClick={handleReset}>
            Clear all
          </button>
          <button type="button" className="sr-fm-apply" onClick={handleApply}>
            Show {matchCount} {matchCount === 1 ? 'Property' : 'Properties'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
