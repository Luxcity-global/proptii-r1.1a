import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Building2, Users, HelpCircle, Check } from 'lucide-react';
import { UserRole } from '../types';

interface RoleSelectionProps {
  selectedRole: UserRole;
  onRoleSelect: (role: UserRole) => void;
  onContinue: () => void;
}

export function RoleSelection({ selectedRole, onRoleSelect, onContinue }: RoleSelectionProps) {
  const roles = [
    {
      id: 'landlord' as const,
      title: 'Landlord',
      description: 'I own and manage my own properties',
      icon: Building2,
      features: [
        'Personal property portfolio',
        'Direct tenant management',
        'Individual compliance tracking',
        'Simple financial reporting'
      ],
      badge: 'Popular'
    },
    {
      id: 'agent' as const,
      title: 'Property Agent',
      description: 'I manage properties for multiple clients',
      icon: Users,
      features: [
        'Multi-client property management',
        'Advanced reporting tools',
        'Team collaboration features',
        'White-label options'
      ],
      badge: 'Professional'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
      <div className="max-w-6xl mx-auto w-full">
        {/* Header Section - Centered */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="font-bold mb-4 leading-tight" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif', fontSize: '2rem' }}>
              What best describes you?
            </h1>
            <p className="text-xl mb-4" style={{ color: '#374957' }}>
              Help us customize your experience by selecting your role
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className="p-1 h-auto">
                    <HelpCircle className="w-5 h-5" style={{ color: '#374957' }} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="text-sm">
                      <strong>Landlord:</strong> Individual property owners managing their own rentals
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Agent:</strong> Professional property managers handling multiple clients
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg bg-white ${
                selectedRole === role.id
                  ? 'ring-1 shadow-lg'
                  : 'border-border hover:border-primary/50'
              }`}
              style={selectedRole === role.id ? { borderColor: '#136C9E', borderWidth: '2px' } : {}}
              onClick={() => onRoleSelect(role.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFE5D9' }}>
                    <role.icon className="w-6 h-6" style={{ color: '#DC5F12' }} />
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2">
                      {role.title}
                      <Badge variant="secondary" className="text-xs">
                        {role.badge}
                      </Badge>
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {role.description}
                    </p>
                  </div>
                </div>
                {selectedRole === role.id && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'transparent', border: '1px solid #136C9E' }}
                  >
                    <Check className="w-4 h-4" style={{ color: '#136C9E' }} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm">Key features:</p>
                <ul className="space-y-1">
                  {role.features.map((feature, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center space-x-2">
                      <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={onContinue}
            className="flex items-center space-x-2 px-12 py-3 min-h-[3.5rem] rounded-full transition-all duration-300 flex-shrink-0 w-auto" 
            style={{ 
              backgroundColor: '#DC5F12', 
              borderColor: '#DC5F12', 
              minWidth: '250px',
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            Continue as {selectedRole === 'landlord' ? 'Landlord' : 'Property Agent'}
          </Button>
        </div>
      </div>
    </div>
  );
}