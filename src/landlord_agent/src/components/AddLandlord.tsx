import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  PoundSterling, 
  Calendar, 
  Save,
  UserPlus,
  Shield,
  FileText,
  TrendingUp,
  Home,
  Briefcase,
  Users,
  CreditCard,
  Globe,
  Star,
  Target
} from 'lucide-react';

interface LandlordFormData {
  // Personal Information
  name: string;
  email: string;
  phone: string;
  
  // Company Information
  companyName: string;
  companyType: 'individual' | 'limited-company' | 'partnership' | 'trust' | 'other';
  vatNumber: string;
  registrationNumber: string;
  website: string;
  
  // Location & Address
  address: string;
  location: string;
  postcode: string;
  
  // Portfolio Information
  totalProperties: string;
  totalPortfolioValue: string;
  monthlyIncome: string;
  averageYield: string;
  
  // Investment Preferences
  preferredPropertyTypes: string[];
  investmentBudget: {
    min: string;
    max: string;
  };
  preferredLocations: string[];
  investmentStrategy: 'buy-and-hold' | 'flip' | 'commercial' | 'mixed' | 'other';
  
  // Status & Membership
  status: 'active' | 'inactive' | 'new' | 'premium' | 'suspended';
  membershipLevel: 'basic' | 'premium' | 'enterprise';
  joinDate: string;
  
  // Financial Information
  annualIncome: string;
  creditRating: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  bankName: string;
  accountNumber: string;
  sortCode: string;
  
  // Contact Preferences
  preferredContactMethod: 'email' | 'phone' | 'sms' | 'post';
  preferredContactTime: 'morning' | 'afternoon' | 'evening' | 'anytime';
  marketingOptIn: boolean;
  
  // References & Experience
  yearsInProperty: string;
  previousAgent: string;
  previousAgentReference: string;
  notableAchievements: string;
  
  // Additional Information
  notes: string;
  documentsUploaded: File[];
}

export function AddLandlord({ onSave, onBack }: { onSave: (landlord: any) => void; onBack: () => void }) {
  const [formData, setFormData] = useState<LandlordFormData>({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    companyType: 'individual',
    vatNumber: '',
    registrationNumber: '',
    website: '',
    address: '',
    location: '',
    postcode: '',
    totalProperties: '',
    totalPortfolioValue: '',
    monthlyIncome: '',
    averageYield: '',
    preferredPropertyTypes: [],
    investmentBudget: { min: '', max: '' },
    preferredLocations: [],
    investmentStrategy: 'buy-and-hold',
    status: 'new',
    membershipLevel: 'basic',
    joinDate: new Date().toISOString().split('T')[0],
    annualIncome: '',
    creditRating: 'unknown',
    bankName: '',
    accountNumber: '',
    sortCode: '',
    preferredContactMethod: 'email',
    preferredContactTime: 'anytime',
    marketingOptIn: false,
    yearsInProperty: '',
    previousAgent: '',
    previousAgentReference: '',
    notableAchievements: '',
    notes: '',
    documentsUploaded: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('personal');

  const propertyTypes = [
    'Residential Houses',
    'Flats/Apartments',
    'Commercial Properties',
    'Student Accommodation',
    'HMOs (Houses in Multiple Occupation)',
    'Short-term Rentals',
    'Industrial Properties',
    'Retail Properties',
    'Mixed-use Properties'
  ];

  const ukLocations = [
    'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh',
    'Liverpool', 'Bristol', 'Sheffield', 'Newcastle', 'Nottingham', 'Leicester',
    'Southampton', 'Portsmouth', 'Brighton', 'Oxford', 'Cambridge', 'York',
    'Bath', 'Canterbury', 'Norwich', 'Plymouth', 'Exeter', 'Cardiff',
    'Belfast', 'Derry', 'Aberdeen', 'Dundee', 'Inverness', 'Other'
  ];

  const handleInputChange = (field: keyof LandlordFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePropertyTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      preferredPropertyTypes: prev.preferredPropertyTypes.includes(type)
        ? prev.preferredPropertyTypes.filter(t => t !== type)
        : [...prev.preferredPropertyTypes, type]
    }));
  };

  const handleLocationToggle = (location: string) => {
    setFormData(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations.includes(location)
        ? prev.preferredLocations.filter(l => l !== location)
        : [...prev.preferredLocations, location]
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => ({
        ...prev,
        documentsUploaded: [...prev.documentsUploaded, ...newFiles]
      }));
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documentsUploaded: prev.documentsUploaded.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic UK format)
    const phoneRegex = /^(\+44|0)[0-9]{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid UK phone number';
    }

    // Portfolio validation
    if (formData.totalProperties && (isNaN(Number(formData.totalProperties)) || Number(formData.totalProperties) < 0)) {
      newErrors.totalProperties = 'Please enter a valid number of properties';
    }

    if (formData.totalPortfolioValue && (isNaN(Number(formData.totalPortfolioValue)) || Number(formData.totalPortfolioValue) < 0)) {
      newErrors.totalPortfolioValue = 'Please enter a valid portfolio value';
    }

    if (formData.monthlyIncome && (isNaN(Number(formData.monthlyIncome)) || Number(formData.monthlyIncome) < 0)) {
      newErrors.monthlyIncome = 'Please enter a valid monthly income';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const landlord = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      companyName: formData.companyName || undefined,
      companyType: formData.companyType,
      location: formData.location,
      status: formData.status,
      membershipLevel: formData.membershipLevel,
      joinDate: new Date(formData.joinDate),
      lastContact: new Date(),
      portfolio: {
        totalProperties: Number(formData.totalProperties) || 0,
        totalValue: Number(formData.totalPortfolioValue) || 0,
        monthlyIncome: Number(formData.monthlyIncome) || 0
      },
      investmentPreferences: {
        propertyTypes: formData.preferredPropertyTypes,
        budget: {
          min: Number(formData.investmentBudget.min) || 0,
          max: Number(formData.investmentBudget.max) || 0
        },
        locations: formData.preferredLocations,
        strategy: formData.investmentStrategy
      },
      financialInfo: {
        annualIncome: Number(formData.annualIncome) || undefined,
        creditRating: formData.creditRating,
        bankDetails: {
          bankName: formData.bankName || undefined,
          accountNumber: formData.accountNumber || undefined,
          sortCode: formData.sortCode || undefined
        }
      },
      contactPreferences: {
        method: formData.preferredContactMethod,
        time: formData.preferredContactTime,
        marketingOptIn: formData.marketingOptIn
      },
      experience: {
        yearsInProperty: Number(formData.yearsInProperty) || undefined,
        previousAgent: formData.previousAgent || undefined,
        previousAgentReference: formData.previousAgentReference || undefined,
        notableAchievements: formData.notableAchievements || undefined
      },
      notes: formData.notes || undefined,
      documents: formData.documentsUploaded.map((file, index) => ({
        id: `doc-${index}`,
        name: file.name,
        type: 'other' as const,
        url: URL.createObjectURL(file),
        issueDate: new Date(),
        status: 'valid' as const
      }))
    };

    onSave(landlord);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Add New Landlord</h1>
                <p className="text-muted-foreground">Enter landlord information and investment preferences</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onBack}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" />
                Save Landlord
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="investment">Investment</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+44 7700 900123"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City or region"
                      className={errors.location ? 'border-red-500' : ''}
                    />
                    {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={formData.postcode}
                      onChange={(e) => handleInputChange('postcode', e.target.value)}
                      placeholder="SW1A 1AA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Company or business name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyType">Company Type</Label>
                    <Select value={formData.companyType} onValueChange={(value: any) => handleInputChange('companyType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="limited-company">Limited Company</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="trust">Trust</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">VAT Number</Label>
                    <Input
                      id="vatNumber"
                      value={formData.vatNumber}
                      onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                      placeholder="GB123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                      placeholder="12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Portfolio Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalProperties">Total Properties</Label>
                    <Input
                      id="totalProperties"
                      type="number"
                      value={formData.totalProperties}
                      onChange={(e) => handleInputChange('totalProperties', e.target.value)}
                      placeholder="0"
                      className={errors.totalProperties ? 'border-red-500' : ''}
                    />
                    {errors.totalProperties && <p className="text-sm text-red-500">{errors.totalProperties}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalPortfolioValue">Total Portfolio Value (£)</Label>
                    <Input
                      id="totalPortfolioValue"
                      type="number"
                      value={formData.totalPortfolioValue}
                      onChange={(e) => handleInputChange('totalPortfolioValue', e.target.value)}
                      placeholder="0"
                      className={errors.totalPortfolioValue ? 'border-red-500' : ''}
                    />
                    {errors.totalPortfolioValue && <p className="text-sm text-red-500">{errors.totalPortfolioValue}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">Monthly Rental Income (£)</Label>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                      placeholder="0"
                      className={errors.monthlyIncome ? 'border-red-500' : ''}
                    />
                    {errors.monthlyIncome && <p className="text-sm text-red-500">{errors.monthlyIncome}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="averageYield">Average Yield (%)</Label>
                    <Input
                      id="averageYield"
                      type="number"
                      step="0.1"
                      value={formData.averageYield}
                      onChange={(e) => handleInputChange('averageYield', e.target.value)}
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearsInProperty">Years in Property Investment</Label>
                    <Input
                      id="yearsInProperty"
                      type="number"
                      value={formData.yearsInProperty}
                      onChange={(e) => handleInputChange('yearsInProperty', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annualIncome">Annual Income (£)</Label>
                    <Input
                      id="annualIncome"
                      type="number"
                      value={formData.annualIncome}
                      onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notableAchievements">Notable Achievements</Label>
                  <Textarea
                    id="notableAchievements"
                    value={formData.notableAchievements}
                    onChange={(e) => handleInputChange('notableAchievements', e.target.value)}
                    placeholder="Any notable achievements in property investment..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investment Tab */}
          <TabsContent value="investment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Investment Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Preferred Property Types</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {propertyTypes.map((type) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.preferredPropertyTypes.includes(type)}
                          onChange={() => handlePropertyTypeToggle(type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investmentBudgetMin">Investment Budget Min (£)</Label>
                    <Input
                      id="investmentBudgetMin"
                      type="number"
                      value={formData.investmentBudget.min}
                      onChange={(e) => handleInputChange('investmentBudget', { ...formData.investmentBudget, min: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="investmentBudgetMax">Investment Budget Max (£)</Label>
                    <Input
                      id="investmentBudgetMax"
                      type="number"
                      value={formData.investmentBudget.max}
                      onChange={(e) => handleInputChange('investmentBudget', { ...formData.investmentBudget, max: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Locations</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {ukLocations.map((location) => (
                      <label key={location} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.preferredLocations.includes(location)}
                          onChange={() => handleLocationToggle(location)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investmentStrategy">Investment Strategy</Label>
                  <Select value={formData.investmentStrategy} onValueChange={(value: any) => handleInputChange('investmentStrategy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy-and-hold">Buy and Hold</SelectItem>
                      <SelectItem value="flip">Property Flipping</SelectItem>
                      <SelectItem value="commercial">Commercial Investment</SelectItem>
                      <SelectItem value="mixed">Mixed Strategy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="creditRating">Credit Rating</Label>
                  <Select value={formData.creditRating} onValueChange={(value: any) => handleInputChange('creditRating', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      placeholder="Bank name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      placeholder="12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortCode">Sort Code</Label>
                    <Input
                      id="sortCode"
                      value={formData.sortCode}
                      onChange={(e) => handleInputChange('sortCode', e.target.value)}
                      placeholder="12-34-56"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Contact & Service Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                    <Select value={formData.preferredContactMethod} onValueChange={(value: any) => handleInputChange('preferredContactMethod', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="post">Post</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredContactTime">Preferred Contact Time</Label>
                    <Select value={formData.preferredContactTime} onValueChange={(value: any) => handleInputChange('preferredContactTime', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9-12)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12-17)</SelectItem>
                        <SelectItem value="evening">Evening (17-20)</SelectItem>
                        <SelectItem value="anytime">Anytime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="membershipLevel">Membership Level</Label>
                    <Select value={formData.membershipLevel} onValueChange={(value: any) => handleInputChange('membershipLevel', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joinDate">Join Date</Label>
                    <Input
                      id="joinDate"
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => handleInputChange('joinDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="marketingOptIn"
                    checked={formData.marketingOptIn}
                    onChange={(e) => handleInputChange('marketingOptIn', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="marketingOptIn">Opt-in to marketing communications</Label>
                </div>
              </CardContent>
            </Card>

            {/* References */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  References & Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="previousAgent">Previous Agent/Property Manager</Label>
                    <Input
                      id="previousAgent"
                      value={formData.previousAgent}
                      onChange={(e) => handleInputChange('previousAgent', e.target.value)}
                      placeholder="Previous agent or property management company"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previousAgentReference">Previous Agent Reference</Label>
                    <Input
                      id="previousAgentReference"
                      value={formData.previousAgentReference}
                      onChange={(e) => handleInputChange('previousAgentReference', e.target.value)}
                      placeholder="Contact details or reference number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional information about the landlord..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Document Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Upload landlord documents</p>
                  <p className="text-gray-500 mb-4">Company certificates, ID, bank statements, insurance documents, etc.</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="document-upload"
                  />
                  <label
                    htmlFor="document-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Choose Files
                  </label>
                </div>

                {formData.documentsUploaded.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Uploaded Documents:</h4>
                    {formData.documentsUploaded.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Landlord Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium">{formData.name || 'No name entered'}</p>
                <p className="text-sm text-gray-600">Landlord Name</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Building className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium">{formData.companyName || 'Individual'}</p>
                <p className="text-sm text-gray-600">Company</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium">{formData.totalProperties || '0'} properties</p>
                <p className="text-sm text-gray-600">Portfolio Size</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <PoundSterling className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="font-medium">£{formData.totalPortfolioValue || '0'}</p>
                <p className="text-sm text-gray-600">Portfolio Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
