import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { KPICard } from "./kpi-card";
import { KPICardSkeleton, TableRowSkeleton } from "./skeleton-loader";
import { Plus, MoreHorizontal, Play, Pause, Copy, Eye, Zap, Upload, Filter, X, Calendar, Sparkles, ArrowLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { toast } from "sonner@2.0.3";

interface Campaign {
  id: string;
  name: string;
  property: string;
  channels: string[];
  status: "Active" | "Paused" | "Draft";
  spend: string;
  leads: number;
  cpl: string;
  cplTarget: number;
  lastUpdated: string;
  health: "Good" | "Fair" | "Poor";
}

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "Shoreditch Premium Campaign",
    property: "2-bed flat in Shoreditch",
    channels: ["Facebook", "Instagram", "Google"],
    status: "Active",
    spend: "£47.20",
    leads: 8,
    cpl: "£5.90",
    cplTarget: 7.00,
    lastUpdated: "2 hours ago",
    health: "Good"
  },
  {
    id: "2", 
    name: "Canary Wharf Luxury Suite",
    property: "1-bed luxury suite, Canary Wharf",
    channels: ["Facebook", "Google"],
    status: "Active",
    spend: "£32.50",
    leads: 5,
    cpl: "£6.50",
    cplTarget: 6.00,
    lastUpdated: "4 hours ago",
    health: "Fair"
  },
  {
    id: "3",
    name: "Camden Modern Living",
    property: "3-bed house in Camden",
    channels: ["Instagram", "Google"],
    status: "Paused",
    spend: "£0.00",
    leads: 12,
    cpl: "£4.20",
    cplTarget: 5.00,
    lastUpdated: "1 day ago",
    health: "Good"
  },
  {
    id: "4",
    name: "Hackney Creative Space",
    property: "2-bed loft in Hackney",
    channels: ["Facebook"],
    status: "Draft",
    spend: "£0.00",
    leads: 0,
    cpl: "—",
    cplTarget: 8.00,
    lastUpdated: "3 days ago",
    health: "Poor"
  }
];

const topCreatives = [
  { name: "FB-Ad-A-01", performance: "+23%", thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=40&h=40&fit=crop&crop=center" },
  { name: "IG-Story-B-02", performance: "+18%", thumbnail: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=40&h=40&fit=crop&crop=center" },
  { name: "Google-Search-C-01", performance: "+15%", thumbnail: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=40&h=40&fit=crop&crop=center" }
];

const underPerformers = [
  { name: "FB-Video-D-03", issue: "Low CTR", type: "warning" },
  { name: "IG-Carousel-E-01", issue: "High CPC", type: "info" }
];

const recommendations = [
  { 
    text: "Increase budget for Shoreditch Premium Campaign by 20%",
    expectedImpact: "+12-15 leads/week",
    confidence: "High"
  },
  { 
    text: "Update creative assets for Camden Modern Living",
    expectedImpact: "Reduce CPL by £1.50",
    confidence: "Medium"
  },
  { 
    text: "Expand targeting for Canary Wharf campaign",
    expectedImpact: "+20% reach",
    confidence: "Medium"
  }
];

type FilterType = "All" | "Active" | "Paused" | "Draft";
type ChannelFilter = "All Channels" | "Facebook" | "Instagram" | "Google";

export function Dashboard({ 
  onNavigateToProperty, 
  onOpenCopilot,
  onBackToHub
}: { 
  onNavigateToProperty: () => void;
  onOpenCopilot: () => void;
  onBackToHub?: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<FilterType>("All");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("All Channels");
  const [isLoading, setIsLoading] = useState(false);
  const [insightsTab, setInsightsTab] = useState("top");

  const getStatusBadge = (status: Campaign["status"]) => {
    if (status === "Active") return <Badge className="bg-lux-green-100 text-lux-green-700 hover:bg-lux-green-100">Active</Badge>;
    if (status === "Paused") return <Badge className="bg-lux-cream-200 text-lux-cream-600 hover:bg-lux-cream-200">Paused</Badge>;
    return <Badge variant="outline">Draft</Badge>;
  };

  const getHealthPill = (health: Campaign["health"]) => {
    if (health === "Good") return <div className="w-2 h-2 bg-lux-green-500 rounded-full" />;
    if (health === "Fair") return <div className="w-2 h-2 bg-lux-orange-500 rounded-full" />;
    return <div className="w-2 h-2 bg-destructive rounded-full" />;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const statusMatch = statusFilter === "All" || campaign.status === statusFilter;
    const channelMatch = channelFilter === "All Channels" || campaign.channels.includes(channelFilter as string);
    return statusMatch && channelMatch;
  });

  const handleKPIClick = (metric: string) => {
    // Filter table based on KPI clicked
    toast.success(`Filtered by ${metric}`);
  };

  const handleApplyRecommendation = (recommendation: any) => {
    toast.success("Recommendation applied successfully", {
      description: recommendation.expectedImpact
    });
  };

  return (
    <div className="flex-1 bg-background p-6">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBackToHub && (
              <>
                <Button variant="ghost" size="sm" onClick={onBackToHub} className="focus:ring-2 focus:ring-lux-blue-400">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Front Page
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-lux-blue-900">Marketing Hub</h1>
              <p className="text-muted-foreground">Manage your property marketing campaigns and content</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Upload className="w-4 h-4 mr-2" />
              Import Property
            </Button>
            <Button 
              variant="outline" 
              className="border-lux-orange-300 text-lux-orange-700 hover:bg-lux-orange-50 focus:ring-2 focus:ring-lux-blue-400"
              onClick={onOpenCopilot}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Content Package
            </Button>
            <Button className="bg-lux-blue-600 hover:bg-lux-blue-700 focus:ring-2 focus:ring-lux-blue-400">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6">
          {isLoading ? (
            <>
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
            </>
          ) : (
            <>
              <KPICard
                title="Total Campaigns"
                value="24"
                delta="+2 this week"
                deltaType="positive"
                sparklineData={[12, 18, 15, 22, 19, 24, 20]}
                onClick={() => handleKPIClick("Total Campaigns")}
                tooltip="Total active, paused, and draft campaigns"
                timeWindow="Last 7 days"
              />
              <KPICard
                title="Total Leads"
                value="387"
                delta="+18.20%"
                deltaType="positive"
                sparklineData={[45, 52, 48, 61, 58, 67, 63]}
                onClick={() => handleKPIClick("Total Leads")}
                tooltip="Qualified leads generated across all campaigns"
                timeWindow="Last 30 days"
              />
              <KPICard
                title="Avg CPL"
                value="£9.80"
                delta="-12.50%"
                deltaType="positive"
                sparklineData={[15, 12, 14, 11, 10, 9, 8]}
                onClick={() => handleKPIClick("Avg CPL")}
                tooltip="Average cost per lead across all active campaigns"
                timeWindow="Last 30 days"
              />
              <KPICard
                title="LP Conversion"
                value="17.30%"
                delta="+2.10%"
                deltaType="positive"
                sparklineData={[12, 15, 14, 16, 17, 18, 17]}
                onClick={() => handleKPIClick("LP Conversion")}
                tooltip="Landing page conversion rate (visits to leads)"
                timeWindow="Last 30 days"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Active Campaigns Table */}
          <div className="col-span-3">
            <Card className="rounded-lg border-border shadow-sm">
              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lux-blue-900">Active Campaigns</CardTitle>
                  {filteredCampaigns.length === 0 && statusFilter === "All" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-lux-orange-300 text-lux-orange-700 hover:bg-lux-orange-50"
                      onClick={onOpenCopilot}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content Package
                    </Button>
                  )}
                </div>
                
                {/* Filter Chips */}
                <div className="flex items-center space-x-2 mt-4">
                  <div className="flex items-center space-x-1">
                    {(["All", "Active", "Paused", "Draft"] as FilterType[]).map((status) => (
                      <Button
                        key={status}
                        variant={statusFilter === status ? "default" : "outline"}
                        size="sm"
                        className={`h-8 px-3 text-xs ${
                          statusFilter === status 
                            ? "bg-lux-blue-600 text-white hover:bg-lux-blue-700" 
                            : "hover:bg-lux-cream-100"
                        }`}
                        onClick={() => setStatusFilter(status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-4">
                    {(["All Channels", "Facebook", "Instagram", "Google"] as ChannelFilter[]).map((channel) => (
                      <Button
                        key={channel}
                        variant={channelFilter === channel ? "default" : "outline"}
                        size="sm"
                        className={`h-8 px-3 text-xs ${
                          channelFilter === channel 
                            ? "bg-lux-blue-600 text-white hover:bg-lux-blue-700" 
                            : "hover:bg-lux-cream-100"
                        }`}
                        onClick={() => setChannelFilter(channel)}
                      >
                        {channel}
                      </Button>
                    ))}
                  </div>

                  {(statusFilter !== "All" || channelFilter !== "All Channels") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setStatusFilter("All");
                        setChannelFilter("All Channels");
                      }}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {filteredCampaigns.length === 0 && statusFilter === "All" ? (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-4">
                      <Zap className="w-12 h-12 mx-auto mb-4 text-lux-cream-400" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No campaigns yet</h3>
                      <p>Create your first marketing campaign to get started</p>
                    </div>
                    <Button 
                      className="bg-lux-blue-600 hover:bg-lux-blue-700"
                      onClick={onOpenCopilot}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content Package
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-lux-cream-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-lux-cream-50 sticky top-0">
                        <TableRow className="hover:bg-lux-cream-50">
                          <TableHead className="font-medium text-lux-blue-900 py-4">Campaign</TableHead>
                          <TableHead className="font-medium text-lux-blue-900">Property</TableHead>
                          <TableHead className="font-medium text-lux-blue-900">Channels</TableHead>
                          <TableHead className="font-medium text-lux-blue-900">Status</TableHead>
                          <TableHead className="font-medium text-lux-blue-900">Spend (Today)</TableHead>
                          <TableHead className="font-medium text-lux-blue-900">Leads</TableHead>
                          <TableHead className="font-medium text-lux-blue-900">CPL</TableHead>
                          <TableHead className="font-medium text-lux-blue-900">Last Updated</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <>
                            <TableRowSkeleton />
                            <TableRowSkeleton />
                            <TableRowSkeleton />
                          </>
                        ) : (
                          filteredCampaigns.map((campaign, index) => (
                            <TableRow 
                              key={campaign.id} 
                              className={`hover:bg-lux-cream-50 ${index % 2 === 1 ? 'bg-lux-cream-25' : 'bg-white'}`}
                            >
                              <TableCell className="py-4">
                                <div className="flex items-center space-x-3">
                                  {getHealthPill(campaign.health)}
                                  <span className="font-medium">{campaign.name}</span>
                                </div>
                              </TableCell>
                              <TableCell 
                                className="text-lux-blue-700 cursor-pointer hover:underline focus:outline-none focus:ring-2 focus:ring-lux-blue-400 rounded"
                                onClick={onNavigateToProperty}
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && onNavigateToProperty()}
                              >
                                {campaign.property}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  {campaign.channels.map((channel) => (
                                    <Badge key={channel} variant="outline" className="text-xs">
                                      {channel}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                              <TableCell className="font-medium">{campaign.spend}</TableCell>
                              <TableCell className="font-medium">{campaign.leads}</TableCell>
                              <TableCell className="font-medium">{campaign.cpl}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{campaign.lastUpdated}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 focus:ring-2 focus:ring-lux-blue-400">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={onNavigateToProperty}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      {campaign.status === "Active" ? (
                                        <>
                                          <Pause className="w-4 h-4 mr-2" />
                                          Pause Campaign
                                        </>
                                      ) : (
                                        <>
                                          <Play className="w-4 h-4 mr-2" />
                                          Resume Campaign
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onOpenCopilot}>
                                      <Sparkles className="w-4 h-4 mr-2" />
                                      Open Copilot
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Insights Panel */}
          <div className="space-y-6">
            <Card className="rounded-lg border-border shadow-sm">
              <CardHeader className="pb-4 pt-6 px-6">
                <CardTitle className="text-lux-blue-900">Insights</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <Tabs value={insightsTab} onValueChange={setInsightsTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="top" className="text-xs">Top</TabsTrigger>
                    <TabsTrigger value="under" className="text-xs">Under-performers</TabsTrigger>
                    <TabsTrigger value="recs" className="text-xs">Recommendations</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="top" className="space-y-3 mt-4">
                    <h4 className="text-sm font-medium text-lux-blue-900 mb-3">Top-performing creatives</h4>
                    <div className="space-y-3">
                      {topCreatives.map((creative, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={creative.thumbnail} 
                              alt={creative.name}
                              className="w-10 h-10 rounded object-cover border border-lux-cream-300"
                            />
                            <span className="text-sm text-muted-foreground">{creative.name}</span>
                          </div>
                          <Badge className="bg-lux-green-100 text-lux-green-700 hover:bg-lux-green-100 text-xs">
                            {creative.performance}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="under" className="space-y-3 mt-4">
                    <h4 className="text-sm font-medium text-lux-blue-900 mb-3">Under-performers</h4>
                    <div className="space-y-3">
                      {underPerformers.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{item.name}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              item.type === "warning" 
                                ? "text-lux-orange-600 border-lux-orange-300" 
                                : "text-lux-blue-600 border-lux-blue-300"
                            }`}
                          >
                            {item.issue}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="recs" className="space-y-3 mt-4">
                    <h4 className="text-sm font-medium text-lux-blue-900 mb-3">Recommendations</h4>
                    <div className="space-y-4">
                      {recommendations.map((recommendation, index) => (
                        <div key={index} className="space-y-2">
                          <p className="text-sm text-muted-foreground">{recommendation.text}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">{recommendation.expectedImpact}</span>
                              <span className="ml-2">• {recommendation.confidence} confidence</span>
                            </div>
                            <Button 
                              size="sm" 
                              className="h-6 px-3 text-xs bg-lux-blue-600 hover:bg-lux-blue-700 focus:ring-2 focus:ring-lux-blue-400"
                              onClick={() => handleApplyRecommendation(recommendation)}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}