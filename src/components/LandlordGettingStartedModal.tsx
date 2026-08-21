import React from 'react';
import { ArrowRight, Building2, LayoutDashboard, PlusCircle } from 'lucide-react';

interface LandlordGettingStartedModalProps {
  isOpen: boolean;
  onGoToDashboard: () => void;
  onAddProperty: () => void;
  onSetupCompanyProfile: () => void;
}

const OPTIONS = [
  {
    id: 'dashboard',
    title: 'Go to Dashboard',
    description: 'Explore your property management dashboard.',
    buttonText: 'View Dashboard',
    recommended: false,
    icon: LayoutDashboard,
    iconColor: '#3B82F6',
    iconBgColor: '#EBF4FF',
    buttonClass: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50',
  },
  {
    id: 'property',
    title: 'Add a Property',
    description: 'Get started by adding a property to your portfolio.',
    buttonText: 'Add Property',
    recommended: true,
    icon: PlusCircle,
    iconColor: '#8B5CF6',
    iconBgColor: '#F3E8FF',
    buttonClass: 'text-white hover:opacity-90',
  },
  {
    id: 'company',
    title: 'Setup Company Profile',
    description: 'Add company details, logo, and professional settings.',
    buttonText: 'Setup Company',
    recommended: false,
    icon: Building2,
    iconColor: '#06B6D4',
    iconBgColor: '#E6FFFA',
    buttonClass: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50',
  },
] as const;

export function LandlordGettingStartedModal({
  isOpen,
  onGoToDashboard,
  onAddProperty,
  onSetupCompanyProfile,
}: LandlordGettingStartedModalProps) {
  if (!isOpen) return null;

  const handleClick = (id: (typeof OPTIONS)[number]['id']) => {
    if (id === 'dashboard') onGoToDashboard();
    if (id === 'property') onAddProperty();
    if (id === 'company') onSetupCompanyProfile();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="getting-started-title"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto p-6 md:p-10"
        style={{ fontFamily: 'Archivo, sans-serif' }}
      >
        <div className="text-center mb-8">
          <h2
            id="getting-started-title"
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ color: '#374957' }}
          >
            What would you like to do next?
          </h2>
          <p className="text-base md:text-lg" style={{ color: '#6B7280' }}>
            Choose how you would like to continue setting up your property management system.
            You can always access these options later from your dashboard.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <div
                key={option.id}
                className="relative rounded-xl border bg-white p-5 flex flex-col"
                style={{
                  borderColor: option.recommended ? '#136C9E' : '#E5E7EB',
                  borderWidth: option.recommended ? 2 : 1,
                }}
              >
                {option.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: '#136C9E' }}
                    >
                      Recommended
                    </span>
                  </div>
                )}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto"
                  style={{ backgroundColor: option.iconBgColor }}
                >
                  <Icon className="w-6 h-6" style={{ color: option.iconColor }} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-center" style={{ color: '#374957' }}>
                  {option.title}
                </h3>
                <p className="text-sm leading-relaxed text-center mb-5 flex-1" style={{ color: '#6B7280' }}>
                  {option.description}
                </p>
                <button
                  type="button"
                  onClick={() => handleClick(option.id)}
                  className={`w-full inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold ${option.buttonClass}`}
                  style={option.id === 'property' ? { backgroundColor: '#DC5F12' } : undefined}
                >
                  {option.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm mt-8" style={{ color: '#6B7280' }}>
          Don&apos;t worry - you can access all of these features anytime from your dashboard.
        </p>
      </div>
    </div>
  );
}
