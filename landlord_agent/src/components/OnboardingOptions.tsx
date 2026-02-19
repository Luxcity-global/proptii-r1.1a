import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Building2,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface OnboardingOptionsProps {
  onGoToDashboard: () => void;
  onAddProperty: () => void;
  onSetupCompanyProfile: () => void;
  userHasCompanyInfo?: boolean;
}

export function OnboardingOptions({ 
  onGoToDashboard, 
  onAddProperty, 
  onSetupCompanyProfile,
  userHasCompanyInfo = false
}: OnboardingOptionsProps) {
  const options = [
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      description: 'Explore your property management dashboard',
      icon: LayoutDashboard,
      action: onGoToDashboard,
      buttonText: 'View Dashboard',
      buttonVariant: 'outline' as const,
      recommended: false,
      iconColor: '#3B82F6', // Blue
      iconBgColor: '#EBF4FF' // Light blue background
    },
    {
      id: 'property',
      title: 'Add a Property',
      description: 'Get started by adding a property to your portfolio',
      icon: PlusCircle,
      action: onAddProperty,
      buttonText: 'Add Property',
      buttonVariant: 'default' as const,
      recommended: true,
      iconColor: '#8B5CF6', // Purple
      iconBgColor: '#F3E8FF' // Light purple background
    },
    {
      id: 'company',
      title: 'Setup Company Profile',
      description: userHasCompanyInfo 
        ? 'Complete your company information and branding'
        : 'Add company details, logo, and professional settings',
      icon: Building2,
      action: onSetupCompanyProfile,
      buttonText: userHasCompanyInfo ? 'Complete Setup' : 'Setup Company',
      buttonVariant: 'outline' as const,
      recommended: false,
      completed: userHasCompanyInfo,
      iconColor: '#06B6D4', // Teal
      iconBgColor: '#E6FFFA' // Light teal background
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>What would you like to do next?</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Choose how you'd like to continue setting up your property management system. 
            You can always access these options later from your dashboard.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Card 
                key={option.id} 
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  option.recommended ? 'ring-1 shadow-md' : ''
                }`}
                style={option.recommended ? { borderColor: '#136C9E', ringColor: '#136C9E' } : {}}
              >
                {option.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: '#136C9E' }}
                    >
                      Recommended
                    </span>
                  </div>
                )}
                
                {option.completed && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-green-500 text-white rounded-full p-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div 
                    className="mx-auto mb-4 p-3 rounded-full w-fit"
                    style={{ backgroundColor: option.iconBgColor }}
                  >
                    <Icon 
                      className="h-8 w-8" 
                      style={{ color: option.iconColor }}
                    />
                  </div>
                  <CardTitle className="text-xl" style={{ fontFamily: 'Archivo, sans-serif' }}>{option.title}</CardTitle>
                  <CardDescription className="text-center" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    {option.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <Button 
                    onClick={option.action}
                    variant={option.buttonVariant}
                    className="w-full"
                    size="lg"
                    style={{ fontFamily: 'Archivo, sans-serif' }}
                  >
                    {option.buttonText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Don't worry - you can access all of these features anytime from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}