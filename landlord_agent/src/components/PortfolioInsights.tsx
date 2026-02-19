import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Download,
  AlertTriangle,
  MapPin,
  PoundSterling,
  BarChart3,
  Target,
  Lightbulb,
  Bell,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Home
} from 'lucide-react';
import { Property, UserProfile, MarketInsight } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface PortfolioInsightsProps {
  properties: Property[];
  userProfile: UserProfile | null;
  onBack: () => void;
  marketInsights: MarketInsight[];
}

export function PortfolioInsights({ properties, userProfile, onBack, marketInsights }: PortfolioInsightsProps) {
  const [timeframe, setTimeframe] = useState('1yr');
  const [comparison, setComparison] = useState('market');

  // Mock data for demonstration
  const mockMarketData = {
    portfolioValue: 850000,
    marketAverageValue: 720000,
    portfolioYield: 4.8,
    marketAverageYield: 4.2,
    totalRent: 4200,
    occupancyRate: 92,
    marketOccupancyRate: 85
  };

  const mockPriceHistory = [
    { month: 'Jan', portfolio: 820000, market: 700000 },
    { month: 'Feb', portfolio: 825000, market: 705000 },
    { month: 'Mar', portfolio: 830000, market: 710000 },
    { month: 'Apr', portfolio: 835000, market: 712000 },
    { month: 'May', portfolio: 840000, market: 715000 },
    { month: 'Jun', portfolio: 845000, market: 718000 },
    { month: 'Jul', portfolio: 850000, market: 720000 }
  ];

  const mockGrowthAreas = [
    { area: 'East London', growth: 12.5, properties: 2, avgPrice: 425000 },
    { area: 'South London', growth: 8.3, properties: 1, avgPrice: 380000 },
    { area: 'North London', growth: 6.2, properties: 1, avgPrice: 520000 }
  ];

  const mockRecommendations = [
    {
      id: '1',
      type: 'opportunity',
      title: 'High Demand Area Identified',
      description: 'Your East London properties are in a high-growth area. Consider adding similar properties.',
      confidence: 'high',
      impact: 'high'
    },
    {
      id: '2',
      type: 'risk',
      title: 'Insurance Review Recommended',
      description: 'Rising flood risk in your area. Review insurance coverage for riverside properties.',
      confidence: 'medium',
      impact: 'medium'
    },
    {
      id: '3',
      type: 'optimization',
      title: 'Rent Optimization Opportunity',
      description: 'Your South London property rent is 8% below market average. Consider gradual increase.',
      confidence: 'high',
      impact: 'medium'
    }
  ];

  const mockScenarios = [
    {
      scenario: 'Raise rent by 5%',
      currentRent: 4200,
      newRent: 4410,
      occupancyImpact: -3,
      netImpact: '+£2,280/year'
    },
    {
      scenario: 'Add 1 property (similar)',
      currentValue: 850000,
      newValue: 1270000,
      yieldImpact: +0.2,
      netImpact: '+£2,016/year'
    }
  ];

  const propertyTypeData = [
    { name: 'Flats', value: 2, color: '#8884d8' },
    { name: 'Houses', value: 1, color: '#82ca9d' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="w-4 h-4 text-green-600" />;
      case 'risk': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'optimization': return <Lightbulb className="w-4 h-4 text-blue-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[confidence as keyof typeof colors] || colors.medium}>
        {confidence.toUpperCase()} CONFIDENCE
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="mb-1">Portfolio Insights</h1>
                <p className="text-muted-foreground">
                  AI-powered analysis of your property portfolio
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1yr">1 Year</SelectItem>
                  <SelectItem value="3yr">3 Years</SelectItem>
                  <SelectItem value="5yr">5 Years</SelectItem>
                </SelectContent>
              </Select>

              <Select value={comparison} onValueChange={setComparison}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">vs Market</SelectItem>
                  <SelectItem value="region">vs Region</SelectItem>
                  <SelectItem value="similar">vs Similar</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="secondary">Portfolio</Badge>
            </div>
            <div>
              <p className="text-2xl font-semibold">{formatCurrency(mockMarketData.portfolioValue)}</p>
              <p className="text-muted-foreground">Total Value</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">
                  +{((mockMarketData.portfolioValue / mockMarketData.marketAverageValue - 1) * 100).toFixed(1)}% vs market
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <Badge variant="secondary">Yield</Badge>
            </div>
            <div>
              <p className="text-2xl font-semibold">{mockMarketData.portfolioYield}%</p>
              <p className="text-muted-foreground">Average Yield</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">
                  +{(mockMarketData.portfolioYield - mockMarketData.marketAverageYield).toFixed(1)}% vs market
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <PoundSterling className="w-6 h-6 text-purple-600" />
              </div>
              <Badge variant="secondary">Monthly</Badge>
            </div>
            <div>
              <p className="text-2xl font-semibold">{formatCurrency(mockMarketData.totalRent)}</p>
              <p className="text-muted-foreground">Total Rent</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">
                  +12% vs last year
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <Badge variant="secondary">Occupancy</Badge>
            </div>
            <div>
              <p className="text-2xl font-semibold">{mockMarketData.occupancyRate}%</p>
              <p className="text-muted-foreground">Occupancy Rate</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">
                  +{mockMarketData.occupancyRate - mockMarketData.marketOccupancyRate}% vs market
                </span>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
            <TabsTrigger value="scenarios">What-If</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Portfolio Value Trend */}
              <Card className="p-6">
                <h3 className="mb-4">Portfolio Value Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockPriceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                    <Line 
                      type="monotone" 
                      dataKey="portfolio" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Your Portfolio"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="market" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Market Average"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Property Distribution */}
              <Card className="p-6">
                <h3 className="mb-4">Property Distribution</h3>
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={propertyTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {propertyTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-2">
                    {propertyTypeData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Top Growth Areas */}
            <Card className="p-6">
              <h3 className="mb-4">Top Growth Areas in Your Portfolio</h3>
              <div className="space-y-4">
                {mockGrowthAreas.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{area.area}</h4>
                        <p className="text-sm text-muted-foreground">
                          {area.properties} propert{area.properties !== 1 ? 'ies' : 'y'} • Avg: {formatCurrency(area.avgPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-600">+{area.growth}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">12 months</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Yield Comparison */}
              <Card className="p-6">
                <h3 className="mb-4">Yield Performance</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Your Portfolio</span>
                      <span className="font-semibold">{mockMarketData.portfolioYield}%</span>
                    </div>
                    <Progress value={mockMarketData.portfolioYield * 20} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Market Average</span>
                      <span className="font-semibold">{mockMarketData.marketAverageYield}%</span>
                    </div>
                    <Progress value={mockMarketData.marketAverageYield * 20} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        {((mockMarketData.portfolioYield - mockMarketData.marketAverageYield) / mockMarketData.marketAverageYield * 100).toFixed(1)}% above market
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your portfolio is performing exceptionally well
                    </p>
                  </div>
                </div>
              </Card>

              {/* Occupancy Metrics */}
              <Card className="p-6">
                <h3 className="mb-4">Occupancy Analysis</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Current Occupancy Rate</span>
                    <span className="font-semibold">{mockMarketData.occupancyRate}%</span>
                  </div>
                  <Progress value={mockMarketData.occupancyRate} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Market Average</p>
                      <p className="font-semibold">{mockMarketData.marketOccupancyRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Your Advantage</p>
                      <p className="font-semibold text-green-600">
                        +{mockMarketData.occupancyRate - mockMarketData.marketOccupancyRate}%
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Monthly Revenue Breakdown */}
            <Card className="p-6">
              <h3 className="mb-4">Monthly Revenue Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { property: 'Regent Street', rent: 2500, market: 2400 },
                  { property: 'Victoria Park', rent: 0, market: 3200 },
                  { property: 'Camden Road', rent: 1700, market: 1650 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="property" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                  <Bar dataKey="rent" fill="#8884d8" name="Current Rent" />
                  <Bar dataKey="market" fill="#82ca9d" name="Market Average" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="space-y-4">
              {mockRecommendations.map((rec) => (
                <Card key={rec.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      {getRecommendationIcon(rec.type)}
                      <div>
                        <h4 className="font-medium mb-1">{rec.title}</h4>
                        <p className="text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                    {getConfidenceBadge(rec.confidence)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="text-xs">
                        {rec.impact.toUpperCase()} IMPACT
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <div className="space-y-6">
              {mockScenarios.map((scenario, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{scenario.scenario}</h4>
                    <Badge className="bg-blue-100 text-blue-800">AI Prediction</Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {'currentRent' in scenario && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Rent</p>
                          <p className="font-semibold">{formatCurrency(scenario.currentRent)}/month</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">New Rent</p>
                          <p className="font-semibold">{formatCurrency(scenario.newRent)}/month</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Occupancy Impact</p>
                          <p className="font-semibold text-orange-600">{scenario.occupancyImpact}%</p>
                        </div>
                      </>
                    )}
                    
                    {'currentValue' in scenario && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Value</p>
                          <p className="font-semibold">{formatCurrency(scenario.currentValue)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">New Value</p>
                          <p className="font-semibold">{formatCurrency(scenario.newValue)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Yield Impact</p>
                          <p className="font-semibold text-green-600">{scenario.yieldImpact}%</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Net Annual Impact</span>
                      <span className="font-semibold text-green-600">{scenario.netImpact}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}