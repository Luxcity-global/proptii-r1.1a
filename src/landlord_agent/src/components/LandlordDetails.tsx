import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  ArrowLeft, 
  Edit3, 
  MapPin, 
  Mail,
  Phone,
  PoundSterling,
  Calendar,
  User,
  Home,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  UserCheck,
  Shield,
  CreditCard,
  MoreHorizontal,
  TrendingUp,
  Building,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  Star,
  Users,
  Briefcase,
  Activity,
  Zap
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Progress } from './ui/progress';

interface Landlord {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'new' | 'premium' | 'suspended';
  portfolio: {
    totalProperties: number;
    totalValue: number;
    monthlyIncome: number;
  };
  properties: string[];
  notes: string;
  avatar?: string;
  lastContact: Date;
  joinDate: Date;
  location: string;
  company?: string;
}

interface LandlordDetailsProps {
  landlord: Landlord | null;
  onBack: () => void;
  onEdit?: (landlord: Landlord) => void;
}

export function LandlordDetails({ landlord, onBack, onEdit }: LandlordDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!landlord) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4">Landlord not found</h2>
          <Button onClick={onBack}>Back to Clients</Button>
        </div>
      </div>
    );
  }

  // Mock additional data for demonstration
  const mockLandlord: Landlord = {
    ...landlord,
    portfolio: {
      totalProperties: 12,
      totalValue: 3250000,
      monthlyIncome: 28500
    },
    properties: [
      '123 Regent Street, London W1B 4EA',
      '456 Oxford Road, London W1D 8QW',
      '789 King Street, London SW1A 1AA',
      '321 Baker Street, London NW1 6XE'
    ],
    notes: 'High-value landlord with excellent payment history. Prefers quarterly reports and proactive maintenance updates.',
    lastContact: new Date('2024-07-15'),
    joinDate: new Date('2022-03-10'),
    location: 'London, UK',
    company: 'Property Investment Group Ltd'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'premium':
        return 'bg-green-100 text-green-800';
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Mock portfolio metrics
  const portfolioMetrics = {
    occupancyRate: 95,
    averageRent: 2375,
    yieldPercentage: 6.2,
    growthRate: 8.5,
    maintenanceScore: 92,
    tenantSatisfaction: 4.6
  };

  // Mock recent activity
  const recentActivity = [
    { type: 'payment', description: 'Monthly rent received for 123 Regent Street', amount: 2500, date: new Date('2024-07-01') },
    { type: 'maintenance', description: 'Kitchen renovation completed at 456 Oxford Road', amount: -8500, date: new Date('2024-06-28') },
    { type: 'new_tenant', description: 'New tenant signed for 789 King Street', amount: 0, date: new Date('2024-06-25') },
    { type: 'payment', description: 'Monthly rent received for 321 Baker Street', amount: 3200, date: new Date('2024-06-01') }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-4 h-4" style={{ color: '#DC5F12' }} />
              </Button>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  {mockLandlord.avatar && <AvatarImage src={mockLandlord.avatar} alt={mockLandlord.name} />}
                  <AvatarFallback>
                    <User className="h-8 w-8" style={{ color: '#DC5F12' }} />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="mb-1">{mockLandlord.name}</h1>
                  <div className="flex items-center space-x-3 flex-wrap gap-2">
                    <Badge className={getStatusColor(mockLandlord.status)}>
                      {mockLandlord.status}
                    </Badge>
                    <Badge variant="outline">
                      {formatCurrency(mockLandlord.portfolio.totalValue)} Portfolio
                    </Badge>
                    {mockLandlord.company && (
                      <Badge variant="secondary">
                        {mockLandlord.company}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button variant="outline" onClick={() => onEdit(mockLandlord)}>
                  <Edit3 className="w-4 h-4 mr-2" style={{ color: '#DC5F12' }} />
                  Edit
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="p-2">
                    <MoreHorizontal className="w-4 h-4" style={{ color: '#DC5F12' }} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Mail className="w-4 h-4 mr-2" style={{ color: '#DC5F12' }} />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Phone className="w-4 h-4 mr-2" style={{ color: '#DC5F12' }} />
                    Call Landlord
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" style={{ color: '#DC5F12' }} />
                    Generate Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" style={{ color: '#DC5F12' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(mockLandlord.portfolio.totalValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last quarter
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
                  <PoundSterling className="h-4 w-4 text-muted-foreground" style={{ color: '#DC5F12' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(mockLandlord.portfolio.monthlyIncome)}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Properties</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" style={{ color: '#DC5F12' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockLandlord.portfolio.totalProperties}</div>
                  <p className="text-xs text-muted-foreground">
                    {portfolioMetrics.occupancyRate}% occupancy
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Yield</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" style={{ color: '#DC5F12' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{portfolioMetrics.yieldPercentage}%</div>
                  <p className="text-xs text-muted-foreground">
                    +0.3% from last quarter
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{mockLandlord.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{mockLandlord.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{mockLandlord.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>Client since {formatDate(mockLandlord.joinDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>Last contact: {formatDate(mockLandlord.lastContact)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Occupancy Rate</span>
                      <span className="font-medium">{portfolioMetrics.occupancyRate}%</span>
                    </div>
                    <Progress 
                      value={portfolioMetrics.occupancyRate} 
                      className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" 
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Maintenance Score</span>
                      <span className="font-medium">{portfolioMetrics.maintenanceScore}/100</span>
                    </div>
                    <Progress 
                      value={portfolioMetrics.maintenanceScore} 
                      className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" 
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tenant Satisfaction</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="ml-1 font-medium">{portfolioMetrics.tenantSatisfaction}</span>
                      </div>
                    </div>
                    <Progress 
                      value={(portfolioMetrics.tenantSatisfaction / 5) * 100} 
                      className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Property List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                    Properties ({mockLandlord.properties.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockLandlord.properties.map((property, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Home className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{property}</span>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {mockLandlord.notes || 'No additional notes'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                    Portfolio Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Residential Properties</span>
                      <span className="font-medium">8 (67%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Commercial Properties</span>
                      <span className="font-medium">4 (33%)</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span>Total Value</span>
                      <span className="font-medium">{formatCurrency(mockLandlord.portfolio.totalValue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                    Growth Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Portfolio Growth</span>
                      <span className="font-medium text-green-600">+{portfolioMetrics.growthRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Rent</span>
                      <span className="font-medium">{formatCurrency(portfolioMetrics.averageRent)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Yield Performance</span>
                      <span className="font-medium">{portfolioMetrics.yieldPercentage}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                    Key Performance Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <Activity className="w-8 h-8 mx-auto mb-2" style={{ color: '#DC5F12' }} />
                      <h3 className="font-semibold">Cash Flow</h3>
                      <p className="text-2xl font-bold text-green-600">+{formatCurrency(mockLandlord.portfolio.monthlyIncome)}</p>
                      <p className="text-sm text-muted-foreground">Monthly</p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <Zap className="w-8 h-8 mx-auto mb-2" style={{ color: '#DC5F12' }} />
                      <h3 className="font-semibold">ROI</h3>
                      <p className="text-2xl font-bold text-blue-600">{portfolioMetrics.yieldPercentage}%</p>
                      <p className="text-sm text-muted-foreground">Annual</p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#DC5F12' }} />
                      <h3 className="font-semibold">Tenant Retention</h3>
                      <p className="text-2xl font-bold text-purple-600">94%</p>
                      <p className="text-sm text-muted-foreground">Last 12 months</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'payment' ? 'bg-green-100' :
                          activity.type === 'maintenance' ? 'bg-orange-100' :
                          'bg-blue-100'
                        }`}>
                          {activity.type === 'payment' && <PoundSterling className="w-5 h-5 text-green-600" />}
                          {activity.type === 'maintenance' && <Shield className="w-5 h-5 text-orange-600" />}
                          {activity.type === 'new_tenant' && <UserCheck className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(activity.date)}</p>
                        </div>
                      </div>
                      {activity.amount !== 0 && (
                        <span className={`font-semibold ${
                          activity.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {activity.amount > 0 ? '+' : ''}{formatCurrency(activity.amount)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
