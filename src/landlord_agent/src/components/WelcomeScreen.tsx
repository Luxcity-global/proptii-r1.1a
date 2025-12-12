import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Building2, FileCheck, BarChart3, Shield, Clock, Users } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const benefits = [
    {
      icon: Building2,
      title: 'Centralized Portfolio',
      description: 'Manage all your properties from one intuitive dashboard'
    },
    {
      icon: FileCheck,
      title: 'Easy Compliance',
      description: 'Never miss important document renewals with smart alerts'
    },
    {
      icon: BarChart3,
      title: 'Quick Insights',
      description: 'Get instant visibility into occupancy, rent, and performance'
    },
    {
      icon: Shield,
      title: 'Secure Document Storage',
      description: 'Keep all your important property documents safe and organized'
    },
    {
      icon: Clock,
      title: 'Time-Saving Automation',
      description: 'Streamline repetitive tasks and focus on what matters most'
    },
    {
      icon: Users,
      title: 'Tenant Management',
      description: 'Seamlessly manage tenant relationships and communications'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-6 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-2xl mb-4 sm:mb-6">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
          </div>
          <h1 className="mb-2 sm:mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent text-2xl sm:text-4xl md:text-5xl font-bold">
            Welcome to PropertyPro
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-8 text-sm sm:text-base md:text-lg px-4">
            The complete property management solution for modern landlords and agents. 
            Streamline your workflow, stay compliant, and grow your portfolio with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-4 sm:p-6 border-0 shadow-sm hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="mb-1 sm:mb-2 text-sm sm:text-base font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center px-4">
          <Button 
            onClick={onGetStarted} 
            size="lg" 
            className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto"
          >
            Get Started
          </Button>
          <p className="text-muted-foreground mt-3 sm:mt-4 text-xs sm:text-sm">
            Join thousands of landlords already using PropertyPro
          </p>
        </div>
      </div>
    </div>
  );
}