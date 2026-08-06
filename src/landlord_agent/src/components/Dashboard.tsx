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
  CheckCircle2,
} from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";
import { Property, UserProfile, MarketInsight, Tenant } from "../App";
import { trackEvent } from "../../../utils/analytics";
import { LandlordPageEmptyShell } from "./LandlordPageEmptyShell";
import { isNewPortfolioUser } from "../utils/portfolioStatus";
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
  isAuthenticated?: boolean;
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
  onSignIn?: () => void;
}

export function Dashboard({
  properties,
  tenants = [],
  userProfile,
  isAuthenticated,
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
  onSignIn,
}: DashboardProps) {
  const isUserAuthenticated = isAuthenticated ?? Boolean(userProfile);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] =
    useState("all");
  const [dismissedInsights, setDismissedInsights] = useState<
    string[]
  >([]);
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  const isMobile = useIsMobile();

  const uniqueVacancyAlerts = React.useMemo(() => {
    if (!vacancyAlerts) return [];
    const seen = new Set<string>();
    return vacancyAlerts.filter((alert) => {
      if (!alert) return false;
      const key =
        alert.id ||
        alert.propertyId ||
        `${alert.propertyAddress || "unknown"}-${alert.predictedVacancyDate || ""}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [vacancyAlerts]);

  const uniqueArrearsAlerts = React.useMemo(() => {
    if (!arrearsAlerts) return [];
    const byTenantOrAddress = new Map<string, (typeof arrearsAlerts)[number]>();

    arrearsAlerts.forEach((alert) => {
      if (!alert) return;
      const key =
        (alert.tenantId && alert.tenantId.toString()) ||
        (alert.propertyAddress && alert.propertyAddress.trim().toLowerCase()) ||
        alert.id;
      if (!key) return;

      const existing = byTenantOrAddress.get(key);
      if (!existing) {
        byTenantOrAddress.set(key, alert);
        return;
      }

      const existingAmount = existing.overdueAmount ?? 0;
      const currentAmount = alert.overdueAmount ?? 0;
      const existingDays = existing.daysPastDue ?? 0;
      const currentDays = alert.daysPastDue ?? 0;

      if (
        currentAmount > existingAmount ||
        (currentAmount === existingAmount && currentDays > existingDays)
      ) {
        byTenantOrAddress.set(key, alert);
      }
    });

    return Array.from(byTenantOrAddress.values());
  }, [arrearsAlerts]);

  const combinedAlerts = React.useMemo(
    () => [
      ...uniqueVacancyAlerts.map((alert) => ({
        type: "vacancy" as const,
        alert,
      })),
      ...uniqueArrearsAlerts.map((alert) => ({
        type: "arrears" as const,
        alert,
      })),
    ],
    [uniqueVacancyAlerts, uniqueArrearsAlerts]
  );

  const totalPriorityAlerts = combinedAlerts.length;

  // Use actual properties - start with empty array when no properties exist
  const mockProperties: Property[] = properties;

  React.useEffect(() => {
    trackEvent("landlord_dashboard_view", {
      total_properties: mockProperties.length,
      total_tenants: tenants.length,
    });
  }, [mockProperties.length, tenants.length]);

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
  // Derive occupancy: A property is occupied if it has a tenant OR if status is explicitly 'occupied'
  // A property is vacant if status is 'vacant' AND it has no tenant
  const tenantOccupiedIds = new Set((tenants || []).map(t => t.propertyId));
  const occupiedProperties = mockProperties.filter(p => {
    const hasTenant = tenantOccupiedIds.has(p.id);
    return p.status === 'occupied' || hasTenant;
  }).length;
  
  const renovatingCount = mockProperties.filter(p => p.status === 'under-renovation').length;
  
  const vacantProperties = mockProperties.filter(p => {
    const hasTenant = tenantOccupiedIds.has(p.id);
    return p.status === 'vacant' && !hasTenant;
  }).length;
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

  const totalRent = mockProperties
    .filter(p => {
      const hasTenant = tenantOccupiedIds.has(p.id);
      return p.status === 'occupied' || hasTenant;
    })
    .reduce((sum, p) => sum + (p.rent || 0), 0);

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
    const occupiedList = mockProperties.filter(p => {
      const hasTenant = tenantOccupiedIds.has(p.id);
      return p.status === 'occupied' || hasTenant;
    });
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
    const monthlyData: { month: string; revenue: number }[] = [];
    const currentDate = new Date();
    
    // Calculate revenue for each of the last 6 months
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);
      const monthName = monthStart.toLocaleDateString('en-GB', { month: 'short' });
      
      // Calculate revenue for this month based on properties with active leases
      let monthlyRevenue = 0;
      
      mockProperties.forEach((property) => {
        // Only count revenue if the property was added before or during this month
        // Default to now if createdAt is missing (shouldn't happen for real data)
        const propertyAddedDate = property.createdAt || new Date(); 
        
        if (propertyAddedDate > monthEnd) {
          // Property was added after this month, so no revenue for this month
          return;
        }
        
        // Check if property has a tenant with lease dates
        if (property.tenant) {
          const leaseStart = property.tenant.leaseStart;
          const leaseEnd = property.tenant.leaseEnd;
          
          // Only count if lease was active during this month AND property was already added
          // Lease is active if monthStart is before leaseEnd and monthEnd is after leaseStart
          if (leaseStart <= monthEnd && leaseEnd >= monthStart) {
            // Also check if tenant was added during or before this month
            // Only count from when the tenant's lease actually started or when property was added, whichever is later
            const revenueStartDate = leaseStart > propertyAddedDate ? leaseStart : propertyAddedDate;
            
            // If revenue started during or before this month, count it
            if (revenueStartDate <= monthEnd) {
              monthlyRevenue += property.rent;
            }
          }
        } else if (property.status === 'occupied') {
          // Property is marked as occupied but no tenant data available
          // Only count from when the property was added to the system
          if (propertyAddedDate <= monthEnd) {
            monthlyRevenue += property.rent;
          }
        }
        // Skip vacant/under-renovation properties without tenant info
      });
      
      monthlyData.push({
        month: monthName,
        revenue: monthlyRevenue
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

  // Filter insights that haven't been dismissed locally
  // Note: Real dismissals are handled via marketInsightService
  const activeInsights = marketInsights.filter(
    (insight) => !dismissedInsights.includes(insight.id)
  );
  
  // Debug logging
  React.useEffect(() => {
    console.log('📊 Dashboard: marketInsights prop:', marketInsights.length);
    console.log('📊 Dashboard: activeInsights after filtering:', activeInsights.length);
    if (marketInsights.length > 0) {
      console.log('📊 Dashboard: Sample insight:', marketInsights[0]);
    }
  }, [marketInsights, activeInsights]);

  const dismissInsight = async (insightId: string) => {
    // Add to local dismissed list for immediate UI update
    setDismissedInsights((prev) => [...prev, insightId]);
    
    // Also save dismissal to Firestore (if userId available)
    // This would require passing userId to Dashboard, or handling it in App.tsx
    // For now, we'll just handle local dismissal
    try {
      // If you have userId available, you can call:
      // await marketInsightService.dismissInsight(insightId, userId);
      console.log(`📌 Insight ${insightId} dismissed (local only)`);
    } catch (error) {
      console.error('Error dismissing insight:', error);
      // Revert local dismissal on error
      setDismissedInsights((prev) => prev.filter(id => id !== insightId));
    }
  };

  const getInsightIcon = (type: MarketInsight["type"]) => {
    switch (type) {
      case "market-trend":
      case "rental-demand":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "regulatory-change":
      case "epc-requirements":
        return (
          <AlertTriangle className="w-4 h-4 text-red-600" />
        );
      case "demand-shift":
        return <Users className="w-4 h-4 text-green-600" />;
      case "price-change":
      case "property-values":
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

  // For unauthenticated users: show header, 4 summary cards (all 0), and empty state mascot only.
  // Authenticated users can render with partial profile data while identity hydration finishes.
  if (!isUserAuthenticated) {
    return (
      <LandlordPageEmptyShell
        page="dashboard"
        variant="guest"
        onSignIn={onSignIn}
      />
    );
  }

  if (isNewPortfolioUser(properties)) {
    return (
      <LandlordPageEmptyShell
        page="dashboard"
        variant="new-user"
        onAddProperty={onAddProperty}
        userName={userProfile?.name}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F7' }}>
      {/* Clean Header */}
      <div className="max-w-7xl mx-auto mt-4 md:mt-8 px-4 md:px-0">
        <div 
          className="bg-white shadow-lg rounded-xl px-4 md:px-8 py-4 md:py-6"
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          {isMobile ? (
            // Mobile Header - Streamlined
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-base mr-3">
                    {(userProfile?.name || "").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 
                      className="text-lg font-semibold"
                      style={{ 
                        color: '#374957',
                        fontFamily: 'Archivo, sans-serif'
                      }}
                    >
                      Welcome <span style={{ color: '#136C9E' }}>{userProfile?.name || ""}</span>
                    </h1>
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      <span className="text-xs font-normal text-green-600">Verified</span>
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={onAddProperty} 
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg" 
                  style={{ 
                    backgroundColor: '#DC5F12', 
                    borderColor: '#DC5F12'
                  }}
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span className="text-sm">Add</span>
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="bg-white rounded-lg border border-gray-200 px-4 py-2 cursor-pointer transition-all duration-300 flex items-center justify-center flex-1"
                  onClick={onViewInsights}
                  style={{
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" style={{ color: '#136C9E' }} />
                    <span className="text-sm font-medium" style={{ color: '#374957' }}>Portfolio Insights</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Desktop Header
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Welcome Message */}
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-lg mr-3">
                {(userProfile?.name || "").charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 
                  className="text-xl font-semibold mb-1"
                  style={{ 
                    color: '#374957',
                    fontFamily: 'Archivo, sans-serif'
                  }}
                >
                  Welcome <span style={{ color: '#136C9E' }}>{userProfile?.name || ""}</span>
              </h1>
                <p 
                  className="text-sm"
                  style={{ color: '#717182' }}
                >
                Here's what's happening with your property portfolio
              </p>
                <span className="inline-flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  <span className="text-sm font-normal text-green-600">Verified</span>
                </span>
              </div>
            </div>

            {/* Middle Column - Contact Info */}
            <div className="flex flex-col justify-center space-y-2">
              <div 
                className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: '#F7F7F7', width: '280px' }}
              >
                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: '#374957' }} />
                <span className="text-sm" style={{ color: '#374957' }}>
                  {userProfile?.phone || 'Not provided'}
                </span>
                </div>
              
              <div 
                className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: '#F7F7F7', width: '280px' }}
              >
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#374957' }} />
                <span className="text-sm" style={{ color: '#374957' }}>
                  {userProfile?.email || 'Not provided'}
                </span>
              </div>
            </div>
            
            {/* Right Column - Portfolio Insights and Add Property Button */}
            <div className="flex justify-end items-center space-x-4">
              {/* Portfolio Insights Card */}
              <div
                className="bg-white rounded-2xl border border-gray-200 px-6 py-4 cursor-pointer transition-all duration-300 min-h-[3.5rem] flex items-center justify-center flex-shrink-0"
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
                    <p className="text-sm leading-tight font-medium" style={{ color: '#374957' }}>Portfolio Insights</p>
                    <p className="text-xs leading-tight" style={{ color: '#717182' }}>AI Powered</p>
                    </div>
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#136C9E' }}
                  >
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                  </div>
              </div>
              
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
          )}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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

        <div className={`grid ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-4 md:gap-8 mb-8`}>
          {/* Left Column - Priority Alerts */}
          <div>
            {/* Priority Alerts Section - Redesigned */}
            <div className="shadow-sm overflow-hidden" style={{ 
              background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)', 
              border: '1px solid #80B2FF', 
              height: isMobile ? 'auto' : '320px',
              minHeight: isMobile ? '280px' : '320px',
              borderRadius: '20px'
            }}>
              <div className={`flex ${isMobile ? 'flex-col' : 'h-full'}`}>
                {/* Left Blue Panel */}
                <div className={`${isMobile ? 'p-4 flex-row items-center justify-between' : 'p-6 flex-col items-start min-w-[200px] rounded-l-xl'} flex`} style={{ 
                  background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)', 
                  color: '#374957', 
                  fontFamily: 'Archivo, sans-serif'
                }}>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                    <AlertTriangle className="w-5 h-5" style={{ color: '#374957' }} />
                  </div>
                    <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                      {isMobile ? 'Priority Alerts' : <>Priority<br />Alerts</>}
                    </h2>
                  </div>
                  {!isMobile && <div className="flex-1"></div>}
                  <div className={isMobile ? '' : 'mt-auto'}>
                    <div className={`font-bold block mb-1 ${isMobile ? 'text-2xl' : ''}`} style={{ fontSize: isMobile ? '24px' : '32px', lineHeight: '1' }}>
                      {totalPriorityAlerts}
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
                <div className={`flex-1 p-4 bg-white relative z-10 overflow-hidden flex flex-col ${isMobile ? 'rounded-b-xl' : ''}`} style={{ borderRadius: isMobile ? '0 0 20px 20px' : '20px', boxShadow: isMobile ? 'none' : '-4px 0 24px rgba(70, 95, 194, 0.4)' }}>
                  {totalPriorityAlerts === 0 ? (
                    // Empty State
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>
                          All Clear!
                        </h3>
                        <p className="text-sm text-gray-500 max-w-xs" style={{ fontFamily: 'Archivo, sans-serif' }}>
                          You have no priority alerts at this time. Everything is running smoothly.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`space-y-3 overflow-y-auto flex-1 pr-2 ${isMobile ? '' : ''}`} 
                      style={{ 
                        maxHeight: isMobile && combinedAlerts.length > 2 ? '250px' : '100%'
                      }}
                    >
                  {combinedAlerts.map((item, index) => {
                    const isVacancy = item.type === "vacancy";
                    const alert = item.alert;
                    const predictedDate =
                      isVacancy && alert?.predictedVacancyDate
                        ? alert.predictedVacancyDate instanceof Date
                          ? alert.predictedVacancyDate
                          : new Date(alert.predictedVacancyDate)
                        : null;

                    return (
                      <React.Fragment key={alert.id}>
                        {index > 0 && (
                          <div className="border-t border-gray-200"></div>
                        )}
                        <Card
                          className="p-6 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() =>
                            isVacancy
                              ? onViewVacancyAlert?.(alert.id)
                              : onViewArrearsAlert?.(alert.id)
                          }
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              {isVacancy ? (
                                <AlertTriangle className="w-4 h-4 text-[#ca390c] mt-1" />
                              ) : (
                                <PoundSterling className="w-4 h-4 text-[#b8585e] mt-1" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={`font-medium mb-1 text-[14px] ${
                                    isVacancy
                                      ? "text-[#ca390c]"
                                      : "text-[#b44d53]"
                                  }`}
                                >
                                  {isVacancy ? "High Vacancy Risk" : "Rent Arrears"}
                                </h4>
                                <p className="text-[12px] text-[#374957] mb-3">
                                  {isVacancy ? (
                                    alert.propertyAddress
                                  ) : (
                                    <>
                                      {alert.tenantName}
                                      <br />
                                      {alert.propertyAddress}
                                    </>
                                  )}
                                </p>
                                <div className="flex items-baseline space-x-3">
                                  {isVacancy ? (
                                    <>
                                      <span className="text-[12px] font-bold text-[#ca390c]">
                                        {alert.riskScore}% Risk Score
                                      </span>
                                      <span className="text-[12px] text-[#374957]">
                                        Predicted:{" "}
                                        {predictedDate
                                          ? predictedDate.toLocaleDateString("en-GB", {
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "numeric",
                                            })
                                          : "Date TBC"}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-[12px] font-bold text-[#b44d53]">
                                        £{alert.overdueAmount?.toLocaleString() ?? "0"} overdue
                                      </span>
                                      <span className="text-[12px] text-[#374957]">
                                        {(alert.daysPastDue ?? 0)} days past due
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div
                              className={`border rounded-[6px] px-4 py-1 flex items-center justify-center ${
                                isVacancy
                                  ? "border-[#ffbc73]"
                                  : "border-[#ffacac]"
                              }`}
                            >
                              <span
                                className={`text-[10px] font-bold ${
                                  isVacancy ? "text-[#ca390c]" : "text-[#c61626]"
                                }`}
                              >
                                {isVacancy ? "View Details" : "Manage"}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </React.Fragment>
                    );
                  })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Stats */}
          <div>
            <div className="shadow-sm overflow-hidden" style={{ 
              background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)', 
              border: '1px solid #80B2FF', 
              height: isMobile ? 'auto' : '320px',
              minHeight: isMobile ? '280px' : '320px',
              borderRadius: '20px'
            }}>
              <div className={`flex ${isMobile ? 'flex-col' : 'h-full'}`}>
                {/* Left Blue Panel */}
                <div className={`${isMobile ? 'p-4 flex-row items-center justify-between' : 'px-6 py-4 flex-col items-start min-w-[200px] rounded-l-xl'} flex`} style={{ background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)', color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                    <BarChart3 className="w-5 h-5" style={{ color: '#374957' }} />
                  </div>
                    <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                      {isMobile ? 'Quick Stats' : <>Quick<br />Stats</>}
                    </h2>
                  </div>
                  {!isMobile && <div className="flex-1"></div>}
                  <div className={isMobile ? '' : 'mt-auto'}>
                    <div className={`font-bold block mb-1 ${isMobile ? 'text-2xl' : ''}`} style={{ fontSize: isMobile ? '24px' : '32px', lineHeight: '1' }}>
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
                <div className={`flex-1 p-4 flex flex-col bg-white relative z-10 ${isMobile ? 'rounded-b-xl' : ''}`} style={{ borderRadius: isMobile ? '0 0 20px 20px' : '20px', boxShadow: isMobile ? 'none' : '-4px 0 24px rgba(70, 95, 194, 0.4)', fontFamily: 'Archivo, sans-serif' }}>
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
              
              <div className="flex-1 min-h-0 relative">
                {currentChart && currentChart.data && currentChart.data.length > 0 ? (
                  <>
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
                    {currentChart.title === "Revenue Trend" && 
                      ((currentChart.data.every((d: any) => d.revenue === 0) || 
                       currentChart.data.filter((d: any) => d.revenue > 0).length < 2) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded z-10">
                          <div className="text-center px-4">
                            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm font-medium text-gray-700 mb-1">Building Your Revenue History</p>
                            <p className="text-xs text-gray-500">
                              {currentChart.data.every((d: any) => d.revenue === 0)
                                ? "Add properties and tenants to start tracking revenue"
                                : "This graph will show meaningful trends after 2+ months of usage"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </>
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


      <div className="max-w-7xl mx-auto px-3 md:px-3 pb-6">
        {/* Filters */}
        <Card className="p-4 md:p-6 mb-6">
          {isMobile ? (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  className="pl-10 focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none"
                  style={{
                    '--tw-ring-color': '#8FCDFF',
                    '--tw-ring-opacity': '0.5'
                  } as React.CSSProperties}
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                />
              </div>
              <div className="flex gap-3">
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="flex-1">
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
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All Properties" />
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
          ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties by address or type..."
                  className="pl-10 focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none"
                  style={{
                    '--tw-ring-color': '#8FCDFF',
                    '--tw-ring-opacity': '0.5'
                  } as React.CSSProperties}
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
          )}
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
                      style={{ borderColor: '#f3f3f3' }}
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
                      style={{ borderColor: '#f3f3f3' }}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManagePhotos(property)}
                      style={{ borderColor: '#f3f3f3' }}
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