import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import {
  Plus,
  Building2,
  Users,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Edit3,
  FileText,
  Image,
  MoreHorizontal,
  PoundSterling,
  Calendar,
  MapPin,
  BarChart3,
  TrendingUp,
  Bell,
  X,
  Home,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
} from "lucide-react";
import { Property, UserProfile, MarketInsight, Tenant } from "../App";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface DashboardProps {
  properties: Property[];
  tenants?: Tenant[];
  userProfile: UserProfile | null;
  onAddProperty: () => void;
  onViewProperty: (property: Property) => void;
  onManageDocuments: (property: Property) => void;
  onManagePhotos: (property: Property) => void;
  onViewInsights: () => void;
  onViewVacancyAlert?: (alertId: string) => void;
  onViewArrearsAlert?: (alertId: string) => void;
  marketInsights: MarketInsight[];
  vacancyAlerts?: any[];
  arrearsAlerts?: any[];
}

export function Dashboard({
  properties,
  tenants = [],
  userProfile,
  onAddProperty,
  onViewProperty,
  onManageDocuments,
  onManagePhotos,
  onViewInsights,
  onViewVacancyAlert,
  onViewArrearsAlert,
  marketInsights,
  vacancyAlerts = [],
  arrearsAlerts = [],
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] =
    useState("all");
  const [dismissedInsights, setDismissedInsights] = useState<
    string[]
  >([]);
  const [currentChartIndex, setCurrentChartIndex] = useState(0);

  // Mock data for demonstration
  const mockProperties: Property[] =
    properties.length === 0
      ? [
          {
            id: "1",
            address: "123 Regent Street, London W1B 4EA",
            type: "Flat/Apartment",
            bedrooms: 2,
            rent: 2500,
            status: "occupied",
            amenities: [
              "Parking",
              "Central Heating",
              "Furnished",
            ],
            notes: "Recently renovated with modern fixtures",
            photos: [
              {
                id: "1",
                url: "https://images.unsplash.com/photo-1662454419622-a41092ecd245?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc1NzM5Njc5N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
                filename: "living-room.jpg",
                room: "Living Room",
                isCover: true,
              },
            ],
            documents: [
              {
                id: "1",
                name: "Gas Safety Certificate",
                type: "gas-cert",
                url: "#",
                issueDate: new Date("2024-01-15"),
                expiryDate: new Date("2025-01-15"),
                status: "valid",
              },
              {
                id: "2",
                name: "EPC Certificate",
                type: "epc",
                url: "#",
                issueDate: new Date("2023-06-01"),
                expiryDate: new Date("2025-01-01"),
                status: "expiring-soon",
              },
            ],
            createdAt: new Date("2024-01-01"),
          },
          {
            id: "2",
            address: "45 Victoria Park Road, London E9 7JN",
            type: "House",
            bedrooms: 3,
            rent: 3200,
            status: "vacant",
            amenities: ["Garden", "Parking", "Pet-friendly"],
            notes: "Victorian terrace with garden",
            photos: [
              {
                id: "2",
                url: "https://images.unsplash.com/photo-1565480401286-ea5dceac02a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMGJ1aWxkaW5nJTIwZXh0ZXJpb3J8ZW58MXx8fHwxNzU3Mzk2ODAyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
                filename: "exterior.jpg",
                room: "Exterior",
                isCover: true,
              },
            ],
            documents: [
              {
                id: "3",
                name: "Insurance Policy",
                type: "insurance",
                url: "#",
                issueDate: new Date("2024-03-01"),
                expiryDate: new Date("2025-03-01"),
                status: "valid",
              },
            ],
            createdAt: new Date("2024-02-15"),
          },
        ]
      : (
        properties
      );

  const displayProperties = mockProperties.filter(
    (property) => {
      const matchesSearch =
        property.address
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        property.type
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        property.status === statusFilter;
      const matchesCompliance =
        complianceFilter === "all" ||
        (complianceFilter === "expiring" &&
          property.documents.some(
            (d) => d.status === "expiring-soon",
          )) ||
        (complianceFilter === "expired" &&
          property.documents.some(
            (d) => d.status === "expired",
          ));

      return (
        matchesSearch && matchesStatus && matchesCompliance
      );
    },
  );

  const totalProperties = mockProperties.length;
  // Derive occupancy from tenants if available; else use stored status
  const tenantOccupiedIds = new Set((tenants || []).map(t => t.propertyId));
  const occupiedProperties = (tenants && tenants.length > 0)
    ? mockProperties.filter(p => tenantOccupiedIds.has(p.id)).length
    : mockProperties.filter(p => p.status === 'occupied').length;
  const renovatingCount = mockProperties.filter(p => p.status === 'under-renovation').length;
  const vacantProperties = Math.max(totalProperties - occupiedProperties - renovatingCount, 0);
  const expiringDocuments = mockProperties.reduce(
    (count, p) =>
      count +
      p.documents.filter(
        (d) =>
          d.status === "expiring-soon" ||
          d.status === "expired",
      ).length,
    0,
  );

  const totalRent = (tenants && tenants.length > 0)
    ? mockProperties.filter(p => tenantOccupiedIds.has(p.id)).reduce((sum, p) => sum + p.rent, 0)
    : mockProperties.filter((p) => p.status === 'occupied').reduce((sum, p) => sum + p.rent, 0);

  // Chart data processing
  const getOccupancyData = () => {
    const data = [
      { name: "Occupied", value: occupiedProperties, color: "#22c55e" },
      { name: "Vacant", value: vacantProperties, color: "#ef4444" },
      {
        name: "Renovating",
        value: mockProperties.filter(p => p.status === 'under-renovation').length,
        color: "#f59e0b"
      }
    ].filter(item => item.value > 0); // Only include non-zero values
    
    return data.length > 0 ? data : [{ name: 'No Data', value: 1, color: '#e5e7eb' }];
  };

  const getRentData = () => {
    const occupiedList = (tenants && tenants.length > 0)
      ? mockProperties.filter(p => tenantOccupiedIds.has(p.id))
      : mockProperties.filter(p => p.status === 'occupied');
    const rentData = occupiedList
      .map(p => ({
        name: p.address.split(',')[0].slice(0, 20) + (p.address.split(',')[0].length > 20 ? '...' : ''),
        rent: p.rent,
        type: p.type
      }))
      .sort((a, b) => b.rent - a.rent)
      .slice(0, 4);
    
    return rentData.length > 0 ? rentData : [{ name: 'No Data', rent: 0, type: '' }];
  };

  const getPropertyTypeData = () => {
    if (mockProperties.length === 0) {
      return [{ name: 'No Properties', value: 1, color: '#e5e7eb' }];
    }

    const normalizeType = (raw: string) => {
      const t = (raw || '').toLowerCase();
      if (t.includes('apartment') || t.includes('flat')) return 'Apartment';
      if (t.includes('house')) return 'House';
      if (t.includes('studio')) return 'Studio';
      if (t.includes('shared')) return 'Shared';
      if (t.includes('commercial')) return 'Commercial';
      if (t.includes('bungalow')) return 'Bungalow';
      return 'Other';
    };

    const typeCount = mockProperties.reduce((acc, p) => {
      const key = normalizeType(p.type);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colorMap: Record<string, string> = {
      Apartment: '#8b5cf6',
      House: '#3b82f6',
      Studio: '#06b6d4',
      Shared: '#10b981',
      Commercial: '#f97316',
      Bungalow: '#84cc16',
      Other: '#f59e0b',
    };

    return Object.entries(typeCount).map(([name, value]) => ({
      name,
      value,
      color: colorMap[name] || colorMap.Other,
    }));
  };

  const getRevenueData = () => {
    if (totalRent === 0) {
      return Array.from({ length: 6 }, (_, i) => ({
        month: new Date(new Date().setMonth(new Date().getMonth() - (5 - i))).toLocaleDateString('en-GB', { month: 'short' }),
        revenue: 0
      }));
    }
    
    const monthlyData: { month: string; revenue: number }[] = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-GB', { month: 'short' });
      // Mock revenue data with some variation
      const baseRevenue = totalRent;
      const variation = (Math.sin(i) * 0.1 + 1); // Add some realistic variation
      monthlyData.push({
        month: monthName,
        revenue: Math.round(baseRevenue * variation)
      });
    }
    return monthlyData;
  };

  const chartData = [
    {
      title: "Property Occupancy",
      type: "pie",
      data: getOccupancyData()
    },
    {
      title: "Top Performing Properties",
      type: "bar",
      data: getRentData()
    },
    {
      title: "Portfolio Composition",
      type: "donut",
      data: getPropertyTypeData()
    },
    {
      title: "Revenue Trend",
      type: "line",
      data: getRevenueData()
    }
  ];

  // Ensure currentChartIndex is valid
  const safeCurrentIndex = Math.max(0, Math.min(currentChartIndex, chartData.length - 1));
  const currentChart = chartData[safeCurrentIndex];

  // Mock market insights
  const mockInsights: MarketInsight[] = [
    {
      id: "1",
      type: "market-trend",
      title: "Rental demand increased 12% in your area",
      description:
        "East London properties showing strong growth. Consider reviewing rent prices.",
      severity: "medium",
      actionRequired: false,
      date: new Date("2024-06-01"),
      area: "East London"
    },
    {
      id: "2",
      type: "regulatory-change",
      title: "New EPC requirements coming 2025",
      description:
        "Properties must achieve minimum grade C by April 2025. Review your compliance status.",
      severity: "high",
      actionRequired: true,
      date: new Date("2024-06-15")
    },
    {
      id: "3",
      type: "price-change",
      title: "Property values up 8.5% this quarter",
      description:
        "Your portfolio value has increased significantly. Great time to review insurance coverage.",
      severity: "low",
      actionRequired: false,
      date: new Date("2024-06-20")
    }
  ];

  const activeInsights = mockInsights.filter(
    (insight) => !dismissedInsights.includes(insight.id)
  );

  const dismissInsight = (insightId: string) => {
    setDismissedInsights((prev) => [...prev, insightId]);
  };

  const getInsightIcon = (type: MarketInsight["type"]) => {
    switch (type) {
      case "market-trend":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "regulatory-change":
        return (
          <AlertTriangle className="w-4 h-4 text-red-600" />
        );
      case "demand-shift":
        return <Users className="w-4 h-4 text-green-600" />;
      case "price-change":
        return (
          <PoundSterling className="w-4 h-4 text-purple-600" />
        );
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (
    severity: MarketInsight["severity"]
  ) => {
    switch (severity) {
      case "high":
        return "border-red-200 bg-red-50";
      case "medium":
        return "border-orange-200 bg-orange-50";
      case "low":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getStatusColor = (status: Property["status"]) => {
    switch (status) {
      case "occupied":
        return "bg-green-500";
      case "vacant":
        return "bg-red-500";
      case "under-renovation":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: Property["status"]) => {
    switch (status) {
      case "occupied":
        return "Occupied";
      case "vacant":
        return "Vacant";
      case "under-renovation":
        return "Renovating";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F7' }}>
      {/* Clean Header */}
      <div className="sticky top-8 z-50 mt-8 max-w-7xl mx-auto bg-white shadow-lg rounded-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center space-x-6 flex-1 min-w-0">
              {/* Avatar Circle */}
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-lg flex-shrink-0">
                {(userProfile?.name || "Tosin Lanipekun").charAt(0).toUpperCase()}
              </div>
              
              <div className="min-w-0">
                <h1 className="text-xl font-semibold mb-1 truncate" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                  Welcome <span style={{ color: '#136C9E' }}>{userProfile?.name || "Tosin Lanipekun"}</span> <span className="inline-flex items-center ml-2"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span><span className="text-sm font-normal text-green-600">Verified</span></span>
              </h1>
                <p className="text-sm text-gray-500 truncate">
                Here's what's happening with your property portfolio
              </p>
            </div>

              {/* Contacts Section - Moved closer to welcome */}
              <div className="flex flex-col space-y-2 flex-shrink-0">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F7F7F7' }}>
                  <Phone className="w-4 h-4" style={{ color: '#374957' }} />
                  <span className="text-sm" style={{ color: '#374957' }}>{userProfile?.phone || '+44 7911 123456'}</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F7F7F7' }}>
                  <Mail className="w-4 h-4" style={{ color: '#374957' }} />
                  <span className="text-sm" style={{ color: '#374957' }}>{userProfile?.email || 'TosinLanipekun@Luxcity.omnimicrosoft'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 flex-shrink-0">
              {/* Portfolio Insights Card */}
                <Card
                className="px-4 py-3 cursor-pointer transition-all duration-300 min-h-[3.5rem] flex items-center justify-center flex-shrink-0"
                  onClick={onViewInsights}
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 248, 220, 0.6), 0 4px 10px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #F3FFDD 0%, #EEFFFF 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.background = 'white';
                }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-left">
                      <p className="text-sm leading-tight">Portfolio Insights</p>
                      <p className="text-xs text-muted-foreground leading-tight">AI Powered</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#136C9E' }}>
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </Card>
              
              {/* Add Property Button */}
              <Button 
                onClick={onAddProperty} 
                className="flex items-center space-x-0 px-12 py-3 min-h-[3.5rem] rounded-lg transition-all duration-300 flex-shrink-0 w-auto" 
                style={{ 
                  backgroundColor: '#DC5F12', 
                  borderColor: '#DC5F12', 
                  minWidth: '180px',
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
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Add Property</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-6">
        {/* Overview Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
            Overview
          </h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">
                  Total Properties
                </p>
                <p className="text-lg font-semibold">
                  {totalProperties}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 flex-1">
                <div className="text-center">
                  <p className="text-muted-foreground mb-1 text-sm">
                  Occupied
                </p>
                <p className="text-lg font-semibold text-green-600">
                  {occupiedProperties}
                </p>
                </div>
                
                <div className="w-px h-12 bg-gray-200"></div>
                
                <div className="text-center">
                  <p className="text-muted-foreground mb-1 text-sm">
                    Vacant
                  </p>
                  <p className="text-lg font-semibold text-orange-600">
                    {vacantProperties}
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">
                  Monthly rental revenue
                </p>
                <p className="text-lg font-semibold">
                  £{totalRent.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <PoundSterling className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">
                  Document Alerts
                </p>
                <p className="text-lg font-semibold text-orange-600">
                  {expiringDocuments}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Market Insights Section */}
        {activeInsights.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <BarChart3 className="w-5 h-5 mr-3 text-[#374957]" />
              <h2 className="text-[16px] font-medium text-[#374957]">
                Market Insights
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {activeInsights
                .slice(0, 3)
                .map((insight, index) => {
                  // Define colors for each insight type to match the image
                  const getInsightStyling = (
                    insightIndex: number
                  ) => {
                    const styles = [
                      {
                        bg: "bg-[#fef3e2]",
                        border: "border-[#f4c430]",
                        icon: "text-[#b8860b]"
                      }, // Yellow/orange
                      {
                        bg: "bg-[#fef0f0]",
                        border: "border-[#f87171]",
                        icon: "text-[#dc2626]"
                      }, // Red/pink
                      {
                        bg: "bg-[#f0f4ff]",
                        border: "border-[#93c5fd]",
                        icon: "text-[#3b82f6]"
                      } // Blue
                    ];
                    return styles[insightIndex] || styles[0];
                  };

                  const styling = getInsightStyling(index);

                  return (
                    <Card
                      key={insight.id}
                      className={`p-4 ${styling.bg} ${styling.border} border rounded-xl hover:shadow-lg transition-shadow relative`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div
                            className={`${styling.icon} mt-1`}
                          >
                            {index === 0 && (
                              <TrendingUp className="w-4 h-4" />
                            )}
                            {index === 1 && (
                              <AlertTriangle className="w-4 h-4" />
                            )}
                            {index === 2 && (
                              <PoundSterling className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium mb-2 text-[14px] leading-tight" style={{ color: '#374957' }}>
                              {insight.title}
                            </h4>
                            <p className="text-[12px] text-gray-600 mb-3 leading-relaxed">
                              {insight.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {insight.area && (
                                  <span className="text-[10px] font-medium text-gray-700 bg-white/60 px-2 py-1 rounded">
                                    {insight.area}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={onViewInsights}
                                className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer bg-white/60 px-3 py-1 rounded hover:bg-white/80 transition-colors"
                              >
                                Details
                              </button>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-6 w-6 absolute top-2 right-2 hover:bg-white/60"
                          onClick={() =>
                            dismissInsight(insight.id)
                          }
                        >
                          <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Priority Alerts */}
          <div>
            {/* Priority Alerts Section - Redesigned */}
            {(vacancyAlerts.length > 0 || arrearsAlerts.length > 0) && (
              <div className="shadow-sm overflow-hidden" style={{ 
                background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)', 
                border: '1px solid #80B2FF', 
                height: '320px',
                borderRadius: '20px'
              }}>
                <div className="flex h-full">
                  {/* Left Blue Panel */}
                  <div className="p-6 flex flex-col items-start min-w-[200px] rounded-l-xl" style={{ 
                    background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)', 
                    color: '#374957', 
                    fontFamily: 'Archivo, sans-serif'
                  }}>
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mb-3">
                      <AlertTriangle className="w-5 h-5" style={{ color: '#374957' }} />
                    </div>
                    <h2 className="text-lg font-semibold">Priority<br />Alerts</h2>
                    <div className="flex-1"></div>
                    <div className="mt-auto">
                      <div className="font-bold block mb-1" style={{ fontSize: '32px', lineHeight: '1' }}>
                        {vacancyAlerts.length + arrearsAlerts.length}
                      </div>
                      <div className="text-sm opacity-90 mb-2 block">Alerts</div>
                      <div className="text-xs opacity-75">
                        As of {new Date().toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}
                      </div>
                    </div>
                </div>

                  {/* Right White Panel */}
                  <div className="flex-1 p-4 bg-white relative z-10" style={{ borderRadius: '20px', boxShadow: '-4px 0 24px rgba(70, 95, 194, 0.4)' }}>
                    <div className="space-y-3">
                  {vacancyAlerts.slice(0, 2).map((alert) => (
                    <Card
                      key={alert.id}
                      className="p-6 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() =>
                        onViewVacancyAlert?.(alert.id)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <AlertTriangle className="w-4 h-4 text-[#ca390c] mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium mb-1 text-[#ca390c] text-[14px]">
                              High Vacancy Risk
                            </h4>
                            <p className="text-[12px] text-[#374957] mb-3">
                              {alert.propertyAddress}
                            </p>
                            <div className="flex items-baseline space-x-3">
                              <span className="text-[12px] font-bold text-[#ca390c]">
                                {alert.riskScore}% Risk Score
                              </span>
                              <span className="text-[12px] text-[#374957]">
                                Predicted:{" "}
                                {alert.predictedVacancyDate.toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="border border-[#ffbc73] rounded-[6px] px-4 py-1 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-[#ca390c]">
                            View Details
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {vacancyAlerts.length > 0 && arrearsAlerts.length > 0 && (
                    <div className="border-t border-gray-200"></div>
                  )}

                  {arrearsAlerts.slice(0, 2).map((alert) => (
                    <Card
                      key={alert.id}
                      className="p-6 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() =>
                        onViewArrearsAlert?.(alert.id)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <PoundSterling className="w-4 h-4 text-[#b8585e] mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium mb-1 text-[#b44d53] text-[14px]">
                              Rent Arrears
                            </h4>
                            <p className="text-[12px] text-[#374957] mb-3">
                              {alert.tenantName}<br />
                              {alert.propertyAddress}
                            </p>
                            <div className="flex items-baseline space-x-3">
                              <span className="text-[12px] font-bold text-[#b44d53]">
                                £
                                {alert.overdueAmount?.toLocaleString() ||
                                  "2,400"}{" "}
                                overdue
                              </span>
                              <span className="text-[12px] text-[#374957]">
                                {alert.daysPastDue} days past
                                due
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="border border-[#ffacac] rounded-[6px] px-4 py-1 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-[#c61626]">
                            Manage
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Stats */}
          <div>
            <div className="shadow-sm overflow-hidden" style={{ 
              background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)', 
              border: '1px solid #80B2FF', 
              height: '320px',
              borderRadius: '20px'
            }}>
              <div className="flex h-full">
                {/* Left Blue Panel */}
                <div className="px-6 py-4 flex flex-col items-start min-w-[200px] rounded-l-xl" style={{ background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)', color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mb-3">
                    <BarChart3 className="w-5 h-5" style={{ color: '#374957' }} />
                  </div>
                  <h2 className="text-lg font-semibold">Quick<br />Stats</h2>
                  <div className="flex-1"></div>
                  <div className="mt-auto">
                    <div className="font-bold block mb-1" style={{ fontSize: '32px', lineHeight: '1' }}>
                      {chartData.length}
                    </div>
                    <div className="text-sm opacity-90 mb-2 block">Charts</div>
                    <div className="text-xs opacity-75">
                      As of {new Date().toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>

                {/* Right White Panel */}
                <div className="flex-1 p-4 flex flex-col bg-white relative z-10" style={{ borderRadius: '20px', boxShadow: '-4px 0 24px rgba(70, 95, 194, 0.4)', fontFamily: 'Archivo, sans-serif' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-normal text-[#374957]">
                  {currentChart.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6"
                    onClick={() => setCurrentChartIndex((prev) => (prev - 1 + chartData.length) % chartData.length)}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {safeCurrentIndex + 1} / {chartData.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6"
                    onClick={() => setCurrentChartIndex((prev) => (prev + 1) % chartData.length)}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0">
                {currentChart && currentChart.data && currentChart.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {/* Pie Chart */}
                    {currentChart.type === "pie" && (
                      <PieChart>
                        <Pie
                          data={currentChart.data}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {currentChart.data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                    
                    {/* Bar Chart */}
                    {currentChart.type === "bar" && (
                      <BarChart data={currentChart.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`£${value}`, 'Rent']} />
                        <Bar dataKey="rent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                    
                    {/* Donut Chart */}
                    {currentChart.type === "donut" && (
                      <PieChart>
                        <Pie
                          data={currentChart.data}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {currentChart.data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                    
                    {/* Line Chart */}
                    {currentChart.type === "line" && (
                      <LineChart data={currentChart.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                                    stroke="#22c55e"
                          strokeWidth={3}
                          dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
            </div>


      <div className="max-w-7xl mx-auto px-3 pb-6">
        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties by address or type..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Status
                  </SelectItem>
                  <SelectItem value="occupied">
                    Occupied
                  </SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="under-renovation">
                    Under Renovation
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={complianceFilter}
                onValueChange={setComplianceFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Compliance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Properties
                  </SelectItem>
                  <SelectItem value="expiring">
                    Expiring Soon
                  </SelectItem>
                  <SelectItem value="expired">
                    Expired
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Properties Grid */}
        {displayProperties.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2" style={{ color: '#374957' }}>No properties found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ||
              statusFilter !== "all" ||
              complianceFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first property"}
            </p>
            <Button 
              onClick={onAddProperty} 
              className="flex items-center space-x-0 px-12 py-3 min-h-[3.5rem] rounded-full transition-all duration-300 flex-shrink-0 w-auto" 
              style={{ 
                backgroundColor: '#DC5F12', 
                borderColor: '#DC5F12', 
                minWidth: '180px',
                background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
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
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>Add Property</span>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayProperties.map((property) => {
              const hasTenant = tenants?.some(t => t.propertyId === property.id);
              const displayStatus = hasTenant ? 'occupied' : property.status;
              return (
              <Card
                key={property.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Property Image */}
                <div className="aspect-video relative overflow-hidden">
                  {property.photos.length > 0 ? (
                    <img
                      src={
                        property.photos.find((p) => p.isCover)
                          ?.url || property.photos[0].url
                      }
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge
                      className={`${getStatusColor(displayStatus)} text-white border-0`}
                    >
                      {getStatusText(displayStatus)}
                    </Badge>
                  </div>

                  {/* Document Alert */}
                  {property.documents.some(
                    (d) =>
                      d.status === "expiring-soon" ||
                      d.status === "expired",
                  ) && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Alert
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 whitespace-normal break-words" style={{ color: '#374957' }}>
                        {property.address}
                      </h3>
                      <p className="text-muted-foreground flex items-center flex-wrap">
                        <MapPin className="w-3 h-3 mr-1" />
                        {property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : ''} • {property.bedrooms}{" "}
                        bed{property.bedrooms !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            onViewProperty(property)
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onManageDocuments(property)
                          }
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Documents
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onManagePhotos(property)
                          }
                        >
                          <Image className="w-4 h-4 mr-2" />
                          Photos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-lg font-semibold">
                      <PoundSterling className="w-4 h-4 mr-1" />
                      {property.rent.toLocaleString()}
                      <span className="text-sm text-muted-foreground ml-1">
                        /month
                      </span>
                    </div>
                  </div>

                  {/* Amenities */}
                  {property.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 mb-1">
                      {property.amenities
                        .slice(0, 3)
                        .map((amenity) => (
                          <Badge
                            key={amenity}
                            variant="secondary"
                            className="text-xs"
                          >
                            {amenity ? amenity.charAt(0).toUpperCase() + amenity.slice(1) : ''}
                          </Badge>
                        ))}
                      {property.amenities.length > 3 && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          +{property.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onViewProperty(property)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onManageDocuments(property)
                      }
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManagePhotos(property)}
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );})}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}