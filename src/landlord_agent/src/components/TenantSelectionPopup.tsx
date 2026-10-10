import React, { useState, useMemo } from 'react';
import { UserPlus, Search, CheckCircle, X } from 'lucide-react';
import type { Tenant, Property } from '../App';

interface TenantSelectionPopupProps {
  existingTenants: Tenant[];
  onClose: () => void;
  onSelectExisting: (tenantId: string) => void;
  onAddNew: () => void;
}

export function TenantSelectionPopup({
  existingTenants,
  onClose,
  onSelectExisting,
  onAddNew
}: TenantSelectionPopupProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const eligibleTenants = useMemo(() => 
    existingTenants.filter(t => t.status === 'ended' || t.status === 'pending' || !t.propertyId),
  [existingTenants]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return eligibleTenants;
    return eligibleTenants.filter(t => 
      (t.name || '').toLowerCase().includes(q) || 
      (t.email || '').toLowerCase().includes(q)
    );
  }, [eligibleTenants, searchTerm]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '80vh', fontFamily: 'Nunito Sans, sans-serif' }}
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo, sans-serif' }}>Select a Tenant</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Add New Tenant Button - sticky-like behavior */}
          <button 
            onClick={onAddNew}
            className="w-full mb-6 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ background: '#136C9E', boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}
          >
            <UserPlus size={18} />
            Add New Tenant
          </button>
          
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Or select from existing tenants</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#136C9E] focus:outline-none"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">No matching tenants found.</p>
            ) : (
              filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => onSelectExisting(t.id)}
                  className="w-full text-left rounded-xl border-2 border-gray-100 p-3 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.email}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-gray-300" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantSelectionPopup;
