import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  ArrowLeft, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  PoundSterling,
  Target,
  Zap,
  CheckCircle,
  Edit3,
  Sparkles,
  BarChart3,
  MapPin,
  Clock
} from 'lucide-react';
import { VacancyRiskAlert, AIMarketingAssets } from '../App';

interface VacancyPreventionProps {
  alert: VacancyRiskAlert;
  onBack: () => void;
  onInitiatePreMarketing: (alert: VacancyRiskAlert, assets: AIMarketingAssets) => void;
}

export function VacancyPrevention({ alert, onBack, onInitiatePreMarketing }: VacancyPreventionProps) {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [marketingAssets, setMarketingAssets] = useState<AIMarketingAssets>({
    optimalRentPrice: alert.recommendations.optimalRentPrice,
    marketingCopy: `Stunning ${alert.propertyAddress.includes('bed') ? alert.propertyAddress.split(' ')[0] : '2'} bedroom property in a prime location. Recently renovated with modern fixtures and fittings. Close to transport links and local amenities. Available from ${alert.predictedVacancyDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Professional landlord with excellent references.`,
    virtualStagingImages: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaXZpbmclMjByb29tJTIwc3RhZ2luZ3xlbnwxfHx8fDE3MzE0MjM3Njl8MA&ixlib=rb-4.1.0&q=80&w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwc3RhZ2luZ3xlbnwxfHx8fDE3MzE0MjM3Njl8MA&ixlib=rb-4.1.0&q=80&w=800',
      'https://images.unsplash.com/photo-1540932239986-30128078f3c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwc3RhZ2luZ3xlbnwxfHx8fDE3MzE0MjM3Njl8MA&ixlib=rb-4.1.0&q=80&w=800'
    ],
    marketData: {
      comparableProperties: [
        { address: '15 Victoria Park Road', rent: 2400, distance: '0.2 miles' },
        { address: '42 Richmond Street', rent: 2650, distance: '0.4 miles' },
        { address: '8 Maple Gardens', rent: 2300, distance: '0.3 miles' }
      ],
      demandScore: 85,
      competitionLevel: 'medium'
    }
  });

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'HIGH';
    if (score >= 60) return 'MEDIUM';
    return 'LOW';
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      default: return 'bg-yellow-500';
    }
  };

  const handleInitiatePreMarketing = () => {
    onInitiatePreMarketing(alert, marketingAssets);
    setShowAIAssistant(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <div>
                  <h1 className="mb-1">Vacancy Risk Alert</h1>
                  <p className="text-muted-foreground">{alert.propertyAddress}</p>
                </div>
              </div>
            </div>
            <Badge className={`${getRiskColor(alert.riskScore)} border`}>
              {getRiskLevel(alert.riskScore)} RISK
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Dates Section - Visible per user request */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Key Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Current Lease End</span>
                    </div>
                    <span className="font-medium">
                      {alert.currentTenantEndDate.toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Predicted Vacancy</span>
                    </div>
                    <span className="font-medium text-orange-600">
                      {alert.predictedVacancyDate.toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Start Marketing</span>
                    </div>
                    <span className="font-medium text-green-600">
                      {alert.recommendations.marketingStartDate.toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vacancy Risk Analysis - Hidden per user request (except Key Dates above) */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Vacancy Risk Analysis
                </CardTitle>
                <CardDescription>
                  AI-powered analysis of vacancy probability and contributing factors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white mb-4">
                    <span className="text-2xl font-bold">{alert.riskScore}%</span>
                  </div>
                  <h3 className="mb-2">Vacancy Risk Score</h3>
                  <p className="text-muted-foreground">
                    Based on market data, seasonality, and tenant patterns
                  </p>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4>Risk Factors</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Market Trend</span>
                          <span>{alert.factors.marketTrend}%</span>
                        </div>
                        <Progress value={alert.factors.marketTrend} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Seasonality Impact</span>
                          <span>{alert.factors.seasonality}%</span>
                        </div>
                        <Progress value={alert.factors.seasonality} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Tenant History</span>
                          <span>{alert.factors.tenantHistory}%</span>
                        </div>
                        <Progress value={alert.factors.tenantHistory} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Property Condition</span>
                          <span>{alert.factors.propertyCondition}%</span>
                        </div>
                        <Progress value={alert.factors.propertyCondition} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card> */}

            {/* AI Recommendations - Hidden per user request */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>
                  Proactive strategies to minimize vacancy period and maximize rental income
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <PoundSterling className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-600">Optimal Rent Price</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      £{alert.recommendations.optimalRentPrice.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      12% above current market average
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">Marketing Window</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.ceil((alert.recommendations.marketingStartDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Until optimal marketing start
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full">
                        <Zap className="h-4 w-4 mr-2" />
                        Initiate Pre-Marketing
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <AIMarketingAssistant
                        alert={alert}
                        assets={marketingAssets}
                        onAssetsChange={setMarketingAssets}
                        onApprove={handleInitiatePreMarketing}
                        onCancel={() => setShowAIAssistant(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{alert.propertyAddress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Rent</span>
                  <span className="font-medium">£2,400/month</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Market Average</span>
                  <span className="font-medium">£2,150/month</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Urgency Level</span>
                  <Badge className={`${getUrgencyColor(alert.recommendations.urgencyLevel)} text-white border-0`}>
                    {alert.recommendations.urgencyLevel.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Action Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Risk Identified</p>
                      <p className="text-sm text-muted-foreground">Today</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 opacity-60">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Pre-Marketing Phase</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.recommendations.marketingStartDate.toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 opacity-40">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Active Marketing</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(alert.recommendations.marketingStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
                      </p>
                    </div>
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

interface AIMarketingAssistantProps {
  alert: VacancyRiskAlert;
  assets: AIMarketingAssets;
  onAssetsChange: (assets: AIMarketingAssets) => void;
  onApprove: () => void;
  onCancel: () => void;
}

function AIMarketingAssistant({ alert, assets, onAssetsChange, onApprove, onCancel }: AIMarketingAssistantProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([assets.virtualStagingImages[0]]);

  const updateAssets = (updates: Partial<AIMarketingAssets>) => {
    onAssetsChange({ ...assets, ...updates });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2" />
          AI Marketing Assistant
        </DialogTitle>
        <DialogDescription>
          Review and approve AI-generated marketing assets for {alert.propertyAddress}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 mt-6">
        {/* Optimal Rent Price */}
        <div>
          <Label htmlFor="rent-price" className="text-base mb-3 block">Optimal Rental Price</Label>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">AI Recommended</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <Input
                  id="rent-price"
                  type="number"
                  value={assets.optimalRentPrice}
                  onChange={(e) => updateAssets({ optimalRentPrice: parseInt(e.target.value) })}
                  className="text-lg font-semibold"
                />
                <p className="text-sm text-green-600">
                  15% above local average - high demand area
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="mb-3">Market Comparisons</h4>
              <div className="space-y-2">
                {assets.marketData.comparableProperties.map((prop, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="truncate flex-1 mr-2">{prop.address}</span>
                    <span className="font-medium">£{prop.rent}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Marketing Copy */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label htmlFor="marketing-copy" className="text-base">Marketing Copy</Label>
            <Button variant="outline" size="sm">
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
          <Textarea
            id="marketing-copy"
            value={assets.marketingCopy}
            onChange={(e) => updateAssets({ marketingCopy: e.target.value })}
            rows={4}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground mt-2">
            AI-optimized for maximum engagement and local search terms
          </p>
        </div>

        {/* Virtual Staging */}
        <div>
          <Label className="text-base mb-3 block">Virtual Staging Images</Label>
          <div className="grid grid-cols-3 gap-4">
            {assets.virtualStagingImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Virtual staging ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-primary transition-colors"
                  onClick={() => {
                    if (selectedImages.includes(image)) {
                      setSelectedImages(selectedImages.filter(img => img !== image));
                    } else {
                      setSelectedImages([...selectedImages, image]);
                    }
                  }}
                />
                {selectedImages.includes(image) && (
                  <div className="absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Select images to include in marketing materials ({selectedImages.length} selected)
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onApprove}>
            <Zap className="h-4 w-4 mr-2" />
            Start Pre-Marketing
          </Button>
        </div>
      </div>
    </>
  );
}