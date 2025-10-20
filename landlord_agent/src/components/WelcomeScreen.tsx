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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome to PropertyPro
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            The complete property management solution for modern landlords and agents. 
            Streamline your workflow, stay compliant, and grow your portfolio with confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            onClick={onGetStarted} 
            size="lg" 
            className="px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Get Started
          </Button>
          <p className="text-muted-foreground mt-4">
            Join thousands of landlords already using PropertyPro
          </p>
        </div>
      </div>
    </div>
  );
}