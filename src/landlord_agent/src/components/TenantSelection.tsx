import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, UserPlus, Mail, Users, Home } from 'lucide-react';

interface TenantSelectionProps {
  onManualInput: () => void;
  onInviteEmail: () => void;
  onSelectExisting: () => void;
  onBack: () => void;
}

export function TenantSelection({ onManualInput, onInviteEmail, onSelectExisting, onBack }: TenantSelectionProps) {
  // Define distinct colors for each icon
  const iconColorSets = [
    { bg: '#E0F7FA', icon: '#06B6D4' }, // Light cyan background, cyan icon - Manual Input
    { bg: '#EBF4FF', icon: '#2563EB' }, // Light blue background, blue icon - Invite via Email
    { bg: '#F3E8FF', icon: '#7C3AED' }, // Light purple background, purple icon - Select Existing User
  ];

  const options = [
    {
      id: 'manual',
      title: 'Manual Input',
      description: 'Add tenant details directly when you have all their information',
      icon: UserPlus,
      features: [
        'Complete tenant profile setup',
        'Direct property assignment',
        'Immediate tenant creation'
      ],
      buttonText: 'Add Manually',
      onClick: onManualInput,
      recommended: true,
      buttonVariant: 'default' as const
    },
    {
      id: 'invite',
      title: 'Invite via Email',
      description: 'Send an invitation email when you have limited tenant details',
      icon: Mail,
      features: [
        'Email invitation sent to tenant',
        'Tenant completes their own profile',
        'Property verification required'
      ],
      buttonText: 'Send Invitation',
      onClick: onInviteEmail,
      recommended: false,
      buttonVariant: 'outline' as const
    },
    {
      id: 'existing',
      title: 'Select Existing User',
      description: 'Assign an existing tenant from your database to a property',
      icon: Users,
      features: [
        'Search existing tenant database',
        'Quick property assignment',
        'Verification request sent'
      ],
      buttonText: 'Select Tenant',
      onClick: onSelectExisting,
      recommended: false,
      buttonVariant: 'outline' as const
    }
  ];

  return (
    <div className="min-h-screen flex flex-col px-4" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-4 pt-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img 
              src="./images/proptii-logo.png" 
              alt="Proptii Logo" 
              className="h-8 w-auto"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 py-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5FFE5' }}>
                <UserPlus className="w-8 h-8" style={{ color: '#00AA00' }} />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#374957' }}>
              Add New Tenant
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose how you'd like to add a tenant to your property
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {options.map((option, index) => {
              const IconComponent = option.icon;
              const iconColors = iconColorSets[index];
              return (
                <Card
                  key={option.id}
                  className={`relative cursor-pointer transition-all duration-300 ${
                    option.recommended ? 'ring-1 shadow-lg' : 'hover:shadow-md'
                  }`}
                  style={{
                    ...(option.recommended ? { borderColor: '#136C9E', borderWidth: '1px' } : {}),
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(231, 242, 255, 0.8), 0 8px 16px rgba(231, 242, 255, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                  onClick={option.onClick}
                >
                  {option.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="text-white text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: '#136C9E' }}>
                        Recommended
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconColors.bg }}>
                      <IconComponent className="w-6 h-6" style={{ color: iconColors.icon }} />
                    </div>
                    <CardTitle className="text-xl font-semibold" style={{ color: '#374957' }}>
                      {option.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {option.description}
                    </p>
                    
                    <div className="space-y-2 mb-6 text-center">
                      <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                      {option.features.map((feature, index) => (
                        <div key={index} className="flex items-center justify-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: '#DC5F12' }} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant={option.buttonVariant}
                      className="w-full"
                      size="lg"
                      style={{ fontFamily: 'Archivo, sans-serif' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        option.onClick();
                      }}
                    >
                      {option.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="max-w-4xl mx-auto" style={{ marginTop: '60px' }}>
            <Card
              className="relative border rounded-xl overflow-hidden"
              style={{
                borderColor: '#BFDBFE',
                background: 'linear-gradient(180deg, rgba(239,246,255,0.9) 0%, rgba(219,234,254,0.9) 100%)'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 25px rgba(191,219,254,0.6), 0 6px 12px rgba(0,0,0,0.08)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#DBEAFE' }}>
                    <Home className="w-5 h-5" style={{ color: '#2563EB' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: '#1E3A8A' }}>Property Assignment</h3>
                    <p className="text-sm" style={{ color: '#1D4ED8' }}>
                      All tenants will need to verify they are occupying the assigned property before being fully added
                      to your tenant list. This ensures accurate property management.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantSelection;
