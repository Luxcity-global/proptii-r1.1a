import React, { useState } from 'react';
import { Building2, Briefcase, Search } from 'lucide-react';
import type { AccountType } from '../utils/accountType';

interface AccountTypePickerModalProps {
  isOpen: boolean;
  onSelect: (type: AccountType) => void;
}

const OPTIONS: {
  id: AccountType;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'renter',
    title: 'Renter / Buyer',
    description: 'Search homes, book viewings, complete referencing, and sign contracts.',
    icon: <Search className="w-6 h-6" style={{ color: '#136C9E' }} />,
  },
  {
    id: 'landlord',
    title: 'Landlord',
    description: 'List and manage your own properties, tenants, and documents.',
    icon: <Building2 className="w-6 h-6" style={{ color: '#DC5F12' }} />,
  },
  {
    id: 'agent',
    title: 'Agent',
    description: 'Manage properties for clients, landlords, and your agency portfolio.',
    icon: <Briefcase className="w-6 h-6" style={{ color: '#136C9E' }} />,
  },
];

export function AccountTypePickerModal({ isOpen, onSelect }: AccountTypePickerModalProps) {
  const [selected, setSelected] = useState<AccountType | null>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-type-title"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto p-6 md:p-10"
        style={{ fontFamily: 'Archivo, sans-serif' }}
      >
        <div className="text-center mb-8">
          <h2
            id="account-type-title"
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ color: '#374957' }}
          >
            What best describes you?
          </h2>
          <p className="text-base md:text-lg" style={{ color: '#6B7280' }}>
            Choose how you want to use Proptii. You can switch later from settings if you need to.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelected(option.id)}
                className="text-left rounded-xl p-5 transition-all border bg-white"
                style={{
                  borderColor: isSelected ? '#136C9E' : '#E5E7EB',
                  borderWidth: isSelected ? 2 : 1,
                  boxShadow: isSelected
                    ? '0 10px 15px -3px rgba(19, 108, 158, 0.15)'
                    : '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#F0F6FB' }}
                >
                  {option.icon}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#374957' }}>
                  {option.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
            className="px-8 py-3 rounded-full text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#E65D24' }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
