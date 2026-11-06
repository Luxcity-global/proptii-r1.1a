import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import '../../../styles/tenantSaved.css';
import '../../../styles/tenantModals.css';

interface ProptiiSearchModalProps {
  open: boolean;
  onClose: () => void;
}

/** Must be rendered inside a tenant page wrapper that defines the --tn-* colour variables. */
const ProptiiSearchModal: React.FC<ProptiiSearchModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState('');
  const [searchBudget, setSearchBudget] = useState('3000');
  const [searchBeds, setSearchBeds] = useState('2');

  const runProptiiSearch = () => {
    const city = searchCity.trim();
    const beds = searchBeds ? `${searchBeds} bedroom` : '';
    const place = city || 'UK';
    let q = `${beds} property to rent in ${place}`.replace(/\s+/g, ' ').trim();
    if (searchBudget) q += ` under ${searchBudget}pcm`;
    onClose();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  if (!open) return null;

  return (
    <div className="tn-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tn-modal" role="dialog" aria-labelledby="tn-proptii-search" style={{ maxWidth: 512 }}>
        <div className="tn-modal-head">
          <div className="tn-drawer-head-main">
            <span className="tn-sp-search-modal-ico">
              <Search size={16} />
            </span>
            <div>
              <h3 id="tn-proptii-search">Proptii Property Search</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                Discover residential lettings across the UK
              </p>
            </div>
          </div>
          <button type="button" className="tn-modal-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="tn-modal-body">
          <label className="tn-sp-field" htmlFor="tn-sp-city">Target UK City or Postcode</label>
          <input
            id="tn-sp-city"
            className="tn-sp-input"
            placeholder="e.g. Manchester, M1 4BT, or Leeds City Centre"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
          />
          <div className="tn-sp-form-grid" style={{ marginTop: 16 }}>
            <div>
              <label className="tn-sp-field" htmlFor="tn-sp-budget">Max Budget (£/month)</label>
              <input
                id="tn-sp-budget"
                className="tn-sp-input"
                type="number"
                value={searchBudget}
                onChange={(e) => setSearchBudget(e.target.value)}
              />
            </div>
            <div>
              <label className="tn-sp-field" htmlFor="tn-sp-beds">Min Bedrooms</label>
              <select
                id="tn-sp-beds"
                className="tn-sp-input"
                value={searchBeds}
                onChange={(e) => setSearchBeds(e.target.value)}
              >
                <option value="1">1+ Beds</option>
                <option value="2">2+ Beds</option>
                <option value="3">3+ Beds</option>
                <option value="4">4+ Beds</option>
              </select>
            </div>
          </div>
        </div>
        <div className="tn-modal-foot">
          <button type="button" className="tn-modal-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="tn-modal-primary" onClick={runProptiiSearch}>Search Available Listings</button>
        </div>
      </div>
    </div>
  );
};

export default ProptiiSearchModal;
