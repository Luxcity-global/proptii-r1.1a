import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  MapPin,
  Users,
  Home,
  PoundSterling,
  AlertTriangle,
  Target,
  Lightbulb,
  BarChart3,
  Calendar,
  Info,
  Star,
  Building
} from 'lucide-react';
import { Property, PropertyMarketData } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { usePropertyMarketData } from '../hooks/usePropertyMarketData';

interface PropertyInsightsProps {
  property: Property | null;
  onBack: () => void;
}

export function PropertyInsights({ property, onBack }: PropertyInsightsProps) {
  const [timeframe, setTimeframe] = useState('1yr');
  const { marketData, isLoading, error } = usePropertyMarketData(property?.id);

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4">Property not found</h2>
          <Button onClick={onBack}>Back to Property</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Aggregating market insights...</p>
        </div>
      </div>
    );
  }

  if (error || !marketData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="mb-2">Unable to load insights</h2>
          <p className="text-muted-foreground mb-4">{error || 'Market data unavailable'}</p>
          <Button onClick={onBack}>Back to Property</Button>
        </div>
      </div>
    );
  }

  const priceHistoryData = marketData.priceHistory || [];  const demandData = [
    { category: 'Students', percentage: 35, color: '#8884d8' },
    { category: 'Young Professionals', percentage: 40, color: '#82ca9d' },
    { category: 'Families', percentage: 15, color: '#ffc658' },
    { category: 'Others', percentage: 10, color: '#ff7300' }
  ];

  const recommendations = [
    {
      type: 'pricing',
      title: 'Rent Optimization Opportunity',
      description: `Your rent is ${property.rentAmount > marketData.averagePrice ? 'above' : 'below'} market average. ${property.rentAmount > marketData.averagePrice ? 'Great positioning!' : 'Consider gradual increase.'}`,
      impact: property.rentAmount > marketData.averagePrice ? 'positive' : 'opportunity',
      confidence: marketData.confidenceLevel
    },
    {
      type: 'market',
      title: 'Strong Rental Demand',
      description: `Rental demand index is ${marketData.rentalDemandIndex}/100 in this area. High tenant interest expected.`,
      impact: marketData.rentalDemandIndex > 80 ? 'positive' : 'neutral',
      confidence: marketData.confidenceLevel
    },
    {
      type: 'demographics',
      title: 'Target Demographic Insights',
      description: `Area attracts young professionals (avg age ${marketData.demographics.averageAge}). Consider modern amenities.`,
      impact: 'neutral',
      confidence: 'high'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'opportunity': return <Target className="w-4 h-4 text-blue-600" />;
      case 'neutral': return <Info className="w-4 h-4 text-gray-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPostcode = (address: string) => {
    // Extract postcode from address
    const parts = address.split(' ');
    return parts.slice(-2).join(' ');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="mb-1">Property Insights</h1>
                <p className="text-muted-foreground flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.address}
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
              
              {getConfidenceBadge(marketData.confidenceLevel)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="secondary">Market Value</Badge>
            </div>
            <div>
              <p className="text-2xl font-semibold">{formatCurrency(marketData.averagePrice)}</p>
              <p className="text-muted-foreground">Average Price</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">
                  +{marketData.priceChange12Months}% this year
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <Badge variant="secondary">Demand</Badge>
            </div>
            <div>
              <p className="text-2xl font-semibold">{marketData.rentalDemandIndex}</p>
              <p className="text-muted-foreground">Demand Index</p>
              <div className="flex items-center mt-2">
                {marketData.rentalDemandIndex > 80 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">High demand</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-orange-600 mr-1" />
                    <span className="text-sm text-orange-600">Moderate demand</span>
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <PoundSterling className="w-6 h-6 text-purple-600" />
              </div>
              <Badge variant="secondary">Rental</Badge>
            </div>
            <div>
              <p className="text-2xl font-semibold">{formatCurrency(marketData.averagePrice)}</p>
              <p className="text-muted-foreground">Market Rent</p>
              <div className="flex items-center mt-2">
                {property.rentAmount > marketData.averagePrice ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">
                      +{((property.rentAmount / marketData.averagePrice - 1) * 100).toFixed(0)}% vs market
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-orange-600 mr-1" />
                    <span className="text-sm text-orange-600">
                      {((property.rentAmount / marketData.averagePrice - 1) * 100).toFixed(0)}% vs market
                    </span>
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
              <Badge variant="secondary">Growth Score</Badge>
            </div>
            <div>
              <p className="text-2xl font-semibold">82</p>
              <p className="text-muted-foreground">AI Growth Score</p>
              <div className="flex items-center mt-2">
                <Progress value={82} className="w-16 h-2 mr-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                <span className="text-sm text-muted-foreground">
                  Excellent
                </span>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="location" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="market">Market Trends</TabsTrigger>
            <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Location Overview */}
              <Card className="p-6">
                <h3 className="mb-4">Location Snapshot</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Postcode</span>
                    <Badge variant="outline">{getPostcode(property.address)}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Area Occupancy Rate</span>
                    <span className="font-medium">92%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Transport Rating</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Safety Score</span>
                    <Badge className="bg-green-100 text-green-800">Good</Badge>
                  </div>
                </div>
              </Card>

              {/* Nearby Developments */}
              <Card className="p-6">
                <h3 className="mb-4">Upcoming Developments</h3>
                <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                      <Building className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">New Transport Link</p>
                        <p className="text-xs text-muted-foreground">Expected to increase property value</p>
                      </div>
                    </div>
                </div>
              </Card>
            </div>

            {/* Price History */}
            <Card className="p-6">
              <h3 className="mb-4">Price History - {getPostcode(property.address)}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Average Price']} />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Nearby Comparisons */}
            <Card className="p-6">
              <h3 className="mb-4">Similar Properties Nearby</h3>
              <div className="space-y-3">
                <div className="text-muted-foreground text-center">No comparisons available</div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Demographics Overview */}
              <Card className="p-6">
                <h3 className="mb-4">Area Demographics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Age</span>
                    <span className="font-semibold">{marketData.demographics.averageAge} years</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Average Income</span>
                    <span className="font-semibold">{formatCurrency(45000)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Household Size</span>
                    <span className="font-semibold">{marketData.demographics.familyHouseholds}% families</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Renters vs Owners</span>
                    <span className="font-semibold">
                      65% renters
                    </span>
                  </div>
                </div>
              </Card>

              {/* Tenant Demand Breakdown */}
              <Card className="p-6">
                <h3 className="mb-4">Tenant Demand Profile</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={demandData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="percentage"
                    >
                      {demandData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-2 mt-4">
                  {demandData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <span className="text-sm font-medium">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Lifestyle Insights */}
            <Card className="p-6">
              <h3 className="mb-4">Lifestyle & Preferences</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Most Valued Amenities</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• High-speed internet (89%)</li>
                    <li>• Public transport access (84%)</li>
                    <li>• Modern kitchen (78%)</li>
                    <li>• Parking space (65%)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Average Tenancy</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Duration: 18 months</li>
                    <li>• Renewal rate: 72%</li>
                    <li>• Notice period: 1 month</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Peak Interest</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Spring (Mar-May)</li>
                    <li>• Early autumn (Sep-Oct)</li>
                    <li>• Weekends: +40% views</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            {/* Market Dynamics */}
            <Card className="p-6">
              <h3 className="mb-4">Market Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { month: 'Jan', sales: 12, rentals: 8 },
                  { month: 'Feb', sales: 15, rentals: 12 },
                  { month: 'Mar', sales: 18, rentals: 15 },
                  { month: 'Apr', sales: 22, rentals: 18 },
                  { month: 'May', sales: 25, rentals: 20 },
                  { month: 'Jun', sales: 20, rentals: 16 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#8884d8" name="Property Sales" />
                  <Bar dataKey="rentals" fill="#82ca9d" name="New Rentals" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Market Trends */}
              <Card className="p-6">
                <h3 className="mb-4">Key Market Trends</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <p className="font-medium">Rising Demand</p>
                      <p className="text-sm text-muted-foreground">
                        Rental inquiries up 23% compared to last year
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium">Demographic Shift</p>
                      <p className="text-sm text-muted-foreground">
                        More young professionals moving to the area
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Building className="w-5 h-5 text-orange-600 mt-1" />
                    <div>
                      <p className="font-medium">Infrastructure Investment</p>
                      <p className="text-sm text-muted-foreground">
                        £2.3M invested in local transport improvements
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Future Predictions */}
              <Card className="p-6">
                <h3 className="mb-4">12-Month Predictions</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Price Growth</span>
                      <span className="font-semibold text-green-600">+6-8%</span>
                    </div>
                    <Progress value={75} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                    <p className="text-xs text-muted-foreground mt-1">High confidence</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Rental Demand</span>
                      <span className="font-semibold text-blue-600">Increasing</span>
                    </div>
                    <Progress value={85} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                    <p className="text-xs text-muted-foreground mt-1">Very high confidence</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Vacancy Risk</span>
                      <span className="font-semibold text-green-600">Low</span>
                    </div>
                    <Progress value={20} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                    <p className="text-xs text-muted-foreground mt-1">Medium confidence</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      {getImpactIcon(rec.impact)}
                      <div>
                        <h4 className="font-medium mb-1">{rec.title}</h4>
                        <p className="text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                    {getConfidenceBadge(rec.confidence)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {rec.type.toUpperCase()}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Action Plan
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Custom Scenarios */}
            <Card className="p-6">
              <h3 className="mb-4">What-If Scenarios</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Scenario: Increase rent by 3%</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">New Monthly Rent</p>
                      <p className="font-semibold">{formatCurrency(Math.round(property.rentAmount * 1.03))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tenant Retention Risk</p>
                      <p className="font-semibold text-green-600">Low (15%)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Annual Impact</p>
                      <p className="font-semibold text-green-600">+{formatCurrency(property.rentAmount * 0.03 * 12)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Scenario: Add premium amenities</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Investment Required</p>
                      <p className="font-semibold">{formatCurrency(5000)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rent Increase Potential</p>
                      <p className="font-semibold text-green-600">+{formatCurrency(150)}/month</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ROI Timeline</p>
                      <p className="font-semibold text-blue-600">2.8 years</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}