import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  Bath, 
  Download, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Share2,
  TrendingUp,
  Clock,
  Edit3,
  Sparkles,
  Calendar,
  Target,
  History,
  Play,
  Image as ImageIcon,
  FileText,
  Video,
  Zap,
  ChevronRight,
  Filter,
  Plus
} from "lucide-react";
import { toast } from "sonner@2.0.3";

const propertyData = {
  address: "Luxury 2-Bed Flat in Shoreditch",
  location: "15 Brick Lane, Shoreditch, E2 7JD",
  rent: "£2,400",
  period: "month",
  beds: 2,
  baths: 1,
  status: "Available",
  heroImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=675&fit=crop&crop=center"
};

const contentPackages = [
  {
    id: "1",
    name: "Q4 2024 Premium Package",
    createdDate: "Dec 5, 2024",
    status: "Approved" as const,
    channels: ["Facebook", "Instagram", "Google"],
    assets: 24,
    description: "Complete marketing suite for winter campaign"
  },
  {
    id: "2", 
    name: "Holiday Special Campaign",
    createdDate: "Dec 3, 2024", 
    status: "Needs Review" as const,
    channels: ["Facebook", "Instagram"],
    assets: 18,
    description: "Limited-time holiday promotion materials"
  },
  {
    id: "3",
    name: "Winter Promotion Assets",
    createdDate: "Nov 28, 2024",
    status: "Approved" as const,
    channels: ["Google", "Facebook"],
    assets: 12,
    description: "Seasonal content for winter months"
  }
];

const assetManifest = {
  copy: [
    {
      id: "copy-1",
      name: "Listing Description - Primary",
      preview: "Stunning 2-bedroom flat in the heart of Shoreditch...",
      status: "approved" as const,
      lastUpdated: "2 hours ago",
      version: 3
    },
    {
      id: "copy-2",
      name: "Facebook Ad Copy Variants (5)",
      preview: "Discover your new home in vibrant Shoreditch...",
      status: "needs-review" as const,
      lastUpdated: "4 hours ago",
      version: 2
    },
    {
      id: "copy-3",
      name: "Google Search Ad Headlines",
      preview: "Luxury Shoreditch Flat | Available Now | £2,400/month",
      status: "approved" as const,
      lastUpdated: "1 day ago",
      version: 1
    }
  ],
  visuals: [
    {
      id: "visual-1",
      name: "Hero Photography Set",
      preview: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100&h=60&fit=crop",
      status: "approved" as const,
      lastUpdated: "1 day ago",
      version: 2
    },
    {
      id: "visual-2",
      name: "Marketing Images - Facebook",
      preview: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=100&h=60&fit=crop",
      status: "needs-review" as const,
      lastUpdated: "2 days ago",
      version: 1
    },
    {
      id: "visual-3",
      name: "Instagram Story Templates",
      preview: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=100&h=60&fit=crop",
      status: "approved" as const,
      lastUpdated: "3 hours ago",
      version: 1
    }
  ],
  social: [
    {
      id: "social-1",
      name: "Instagram Stories Pack (12)",
      preview: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100&h=60&fit=crop",
      status: "approved" as const,
      lastUpdated: "3 hours ago",
      version: 1
    },
    {
      id: "social-2",
      name: "Facebook Carousel Assets",
      preview: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=100&h=60&fit=crop",
      status: "needs-review" as const,
      lastUpdated: "1 day ago",
      version: 2
    }
  ],
  video: [
    {
      id: "video-1",
      name: "Property Tour Script",
      preview: "Welcome to this stunning 2-bedroom apartment...",
      status: "needs-review" as const,
      lastUpdated: "5 hours ago",
      version: 1
    },
    {
      id: "video-2",
      name: "15s Social Video Template",
      preview: "https://images.unsplash.com/photo-1600607688960-7bb8f0dc5d64?w=100&h=60&fit=crop",
      status: "approved" as const,
      lastUpdated: "2 days ago",
      version: 1
    }
  ]
};

const complianceFlags = [
  { issue: "Missing EPC rating in listing description", severity: "high" as const },
  { issue: "Deposit terms need clarification", severity: "medium" as const },
  { issue: "Property photos missing accessibility features", severity: "low" as const }
];

const channelData = [
  { id: "facebook", name: "Facebook", selected: true },
  { id: "instagram", name: "Instagram", selected: true },
  { id: "google", name: "Google", selected: false },
  { id: "rightmove", name: "Rightmove", selected: false },
  { id: "zoopla", name: "Zoopla", selected: false }
];

const campaignHistory = [
  { date: "Dec 5, 2024", event: "Q4 Package Generated", status: "success" },
  { date: "Dec 3, 2024", event: "Holiday Campaign Created", status: "pending" },
  { date: "Nov 28, 2024", event: "Winter Assets Approved", status: "success" },
  { date: "Nov 20, 2024", event: "Channel Setup Updated", status: "success" }
];

interface PropertyMarketingProps {
  onBack: () => void;
  onOpenCopilot: () => void;
}

export function PropertyMarketing({ onBack, onOpenCopilot }: PropertyMarketingProps) {
  const [activeTab, setActiveTab] = useState("marketing");
  const [assetTab, setAssetTab] = useState("copy");
  const [selectedChannels, setSelectedChannels] = useState(channelData);
  const [dailyBudget, setDailyBudget] = useState("25.00");
  const [totalBudget, setTotalBudget] = useState("750.00");
  const [isLoading, setIsLoading] = useState(false);

  const getStatusBadge = (status: "Approved" | "Needs Review") => {
    if (status === "Approved") {
      return <Badge className="bg-lux-green-100 text-lux-green-700 hover:bg-lux-green-100">Approved</Badge>;
    }
    return <Badge className="bg-lux-orange-100 text-lux-orange-700 hover:bg-lux-orange-100">Needs Review</Badge>;
  };

  const getAssetStatusIcon = (status: "approved" | "needs-review") => {
    if (status === "approved") {
      return <CheckCircle className="w-4 h-4 text-lux-green-600" />;
    }
    return <Clock className="w-4 h-4 text-lux-orange-600" />;
  };

  const getSeverityBadge = (severity: "high" | "medium" | "low") => {
    if (severity === "high") {
      return <Badge variant="destructive" className="text-xs">High</Badge>;
    }
    if (severity === "medium") {
      return <Badge className="bg-lux-orange-100 text-lux-orange-700 hover:bg-lux-orange-100 text-xs">Medium</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Low</Badge>;
  };

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, selected: !channel.selected }
          : channel
      )
    );
  };

  const handleApprove = (assetId: string) => {
    toast.success("Asset approved successfully");
  };

  const handleReject = (assetId: string) => {
    toast.error("Asset rejected");
  };

  const handleSaveSetup = () => {
    toast.success("Channel setup saved successfully");
  };

  const handleAutoFix = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Compliance issues auto-fixed successfully");
    }, 2000);
  };

  const handleGeneratePackage = () => {
    onOpenCopilot();
  };

  const ContentPackageCard = ({ pkg }: { pkg: typeof contentPackages[0] }) => (
    <Card className="rounded-lg border-border shadow-sm bg-lux-cream-50 p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-lux-blue-900 mb-1">{pkg.name}</h4>
            <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Created {pkg.createdDate}</span>
              <span>•</span>
              <span>{pkg.assets} assets</span>
            </div>
          </div>
          {getStatusBadge(pkg.status)}
        </div>
        
        <div className="flex items-center space-x-2">
          {pkg.channels.map((channel) => (
            <Badge key={channel} variant="outline" className="text-xs">
              {channel}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-lux-cream-200">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-8">
              <Eye className="w-3 h-3 mr-1" />
              Review
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              <RefreshCw className="w-3 h-3 mr-1" />
              Regenerate
            </Button>
          </div>
          <Button variant="outline" size="sm" className="h-8">
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </Card>
  );

  const AssetItem = ({ asset, type }: { asset: any; type: string }) => (
    <div className="p-4 border border-lux-cream-200 rounded-lg hover:bg-lux-cream-50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          {type === "visuals" || type === "social" || type === "video" ? (
            <img 
              src={asset.preview} 
              alt={asset.name}
              className="w-12 h-8 object-cover rounded border border-lux-cream-300"
            />
          ) : (
            <div className="w-12 h-8 bg-lux-cream-200 rounded border border-lux-cream-300 flex items-center justify-center">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              {getAssetStatusIcon(asset.status)}
              <h4 className="font-medium text-lux-blue-900 truncate">{asset.name}</h4>
            </div>
            <p className="text-sm text-muted-foreground truncate mb-1">
              {type === "copy" ? asset.preview : `Version ${asset.version}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Updated {asset.lastUpdated}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {asset.status === "needs-review" ? (
            <>
              <Button 
                size="sm" 
                className="h-7 bg-lux-green-600 hover:bg-lux-green-700"
                onClick={() => handleApprove(asset.id)}
              >
                Approve
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7"
                onClick={() => handleReject(asset.id)}
              >
                Reject
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="h-7">
              <Edit3 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-lux-blue-600">
          Regenerate with reason...
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-background">
      {/* Property Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="focus:ring-2 focus:ring-lux-blue-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="grid grid-cols-12 gap-6">
            {/* Hero Image */}
            <div className="col-span-4">
              <div className="aspect-video rounded-lg overflow-hidden border border-lux-cream-300">
                <img 
                  src={propertyData.heroImage}
                  alt="Property"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Property Details */}
            <div className="col-span-6">
              <h1 className="text-2xl font-semibold text-lux-blue-900 mb-2">{propertyData.address}</h1>
              <div className="flex items-center space-x-1 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{propertyData.location}</span>
              </div>
              
              <div className="flex items-center space-x-6 mb-4">
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    {propertyData.beds} beds
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    {propertyData.baths} bath
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-semibold text-lux-blue-700">£{propertyData.rent}</span>
                  <span className="text-sm text-muted-foreground">/{propertyData.period}</span>
                </div>
                <Badge className="bg-lux-green-100 text-lux-green-700 hover:bg-lux-green-100">
                  {propertyData.status}
                </Badge>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="col-span-2 flex flex-col space-y-3">
              <Button 
                variant="outline" 
                className="w-full focus:ring-2 focus:ring-lux-blue-400"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Listing
              </Button>
              <Button 
                variant="outline" 
                className="w-full focus:ring-2 focus:ring-lux-blue-400"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-[1440px] mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger 
                value="marketing" 
                className="data-[state=active]:bg-lux-blue-100 data-[state=active]:text-lux-blue-900"
              >
                Marketing
              </TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="marketing" className="space-y-8">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-9 space-y-8">
                  {/* Content Packages */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-lux-blue-900">Content Packages</h2>
                      <Button 
                        className="bg-lux-blue-600 hover:bg-lux-blue-700 focus:ring-2 focus:ring-lux-blue-400"
                        onClick={handleGeneratePackage}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate New Package
                      </Button>
                    </div>
                    
                    {contentPackages.length === 0 ? (
                      <Card className="rounded-lg border-dashed border-2 border-lux-cream-300 p-12 text-center">
                        <div className="max-w-md mx-auto">
                          <Zap className="w-12 h-12 mx-auto mb-4 text-lux-cream-400" />
                          <h3 className="text-lg font-medium text-lux-blue-900 mb-2">No content packages yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Generate your first content package to get started with marketing this property.
                          </p>
                          <Button onClick={handleGeneratePackage}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Content Package
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {isLoading ? (
                          <>
                            <Skeleton className="h-48 rounded-lg" />
                            <Skeleton className="h-48 rounded-lg" />
                          </>
                        ) : (
                          contentPackages.map((pkg) => (
                            <ContentPackageCard key={pkg.id} pkg={pkg} />
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Asset Review Grid */}
                  <div>
                    <h2 className="text-xl font-semibold text-lux-blue-900 mb-6">Asset Review</h2>
                    
                    {/* Compliance Flags */}
                    {complianceFlags.length > 0 && (
                      <Card className="border-lux-orange-200 bg-lux-orange-50 mb-6">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-5 h-5 text-lux-orange-600" />
                              <h3 className="font-medium text-lux-orange-800">Compliance Flags</h3>
                            </div>
                            <Button 
                              size="sm" 
                              className="bg-lux-blue-600 hover:bg-lux-blue-700"
                              onClick={handleAutoFix}
                              disabled={isLoading}
                            >
                              {isLoading ? "Auto-fixing..." : "Auto-fix"}
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {complianceFlags.map((flag, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Badge 
                                  variant="outline" 
                                  className="bg-white text-lux-orange-700 border-lux-orange-300"
                                >
                                  {flag.issue}
                                </Badge>
                                {getSeverityBadge(flag.severity)}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    <Card className="rounded-lg border-border shadow-sm">
                      <CardContent className="p-6">
                        <Tabs value={assetTab} onValueChange={setAssetTab}>
                          <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="copy">Copy</TabsTrigger>
                            <TabsTrigger value="visuals">Visuals</TabsTrigger>
                            <TabsTrigger value="social">Social</TabsTrigger>
                            <TabsTrigger value="video">Video</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="copy" className="space-y-4 mt-0">
                            {assetManifest.copy.map((asset) => (
                              <AssetItem key={asset.id} asset={asset} type="copy" />
                            ))}
                          </TabsContent>
                          
                          <TabsContent value="visuals" className="space-y-4 mt-0">
                            {assetManifest.visuals.map((asset) => (
                              <AssetItem key={asset.id} asset={asset} type="visuals" />
                            ))}
                          </TabsContent>
                          
                          <TabsContent value="social" className="space-y-4 mt-0">
                            {assetManifest.social.map((asset) => (
                              <AssetItem key={asset.id} asset={asset} type="social" />
                            ))}
                          </TabsContent>
                          
                          <TabsContent value="video" className="space-y-4 mt-0">
                            {assetManifest.video.map((asset) => (
                              <AssetItem key={asset.id} asset={asset} type="video" />
                            ))}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Channel Setup */}
                  <div>
                    <h2 className="text-xl font-semibold text-lux-blue-900 mb-6">Channel Setup</h2>
                    
                    <Card className="rounded-lg border-border shadow-sm">
                      <CardContent className="p-6 space-y-6">
                        {/* Channel Selection */}
                        <div>
                          <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
                            Select Channels
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedChannels.map((channel) => (
                              <div key={channel.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={channel.id}
                                  checked={channel.selected}
                                  onCheckedChange={() => handleChannelToggle(channel.id)}
                                />
                                <Label
                                  htmlFor={channel.id}
                                  className={`px-3 py-1 rounded-full border text-sm cursor-pointer transition-colors ${
                                    channel.selected
                                      ? "border-lux-blue-300 bg-lux-blue-50 text-lux-blue-700"
                                      : "border-lux-cream-300 bg-white text-muted-foreground hover:border-lux-blue-300"
                                  }`}
                                >
                                  {channel.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Budget and Schedule */}
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Label className="text-sm font-medium text-lux-blue-900">
                                    Daily Budget
                                  </Label>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Maximum amount to spend per day across all channels</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-sm text-muted-foreground">£</span>
                              <Input
                                type="number"
                                value={dailyBudget}
                                onChange={(e) => setDailyBudget(e.target.value)}
                                className="flex-1"
                                step="0.01"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Label className="text-sm font-medium text-lux-blue-900">
                                    Total Budget
                                  </Label>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Maximum total amount for the entire campaign</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-sm text-muted-foreground">£</span>
                              <Input
                                type="number"
                                value={totalBudget}
                                onChange={(e) => setTotalBudget(e.target.value)}
                                className="flex-1"
                                step="0.01"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-lux-blue-900">
                              Schedule
                            </Label>
                            <Select defaultValue="always-on">
                              <SelectTrigger className="mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="always-on">Always On</SelectItem>
                                <SelectItem value="business-hours">Business Hours</SelectItem>
                                <SelectItem value="weekends">Weekends Only</SelectItem>
                                <SelectItem value="custom">Custom Schedule</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
                            Geographic Targeting
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">5km radius</Badge>
                            <Badge variant="outline">Tower Hamlets</Badge>
                            <Badge variant="outline">Hackney</Badge>
                            <Badge variant="outline">Islington</Badge>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-lux-blue-600">
                              <Plus className="w-3 h-3 mr-1" />
                              Add location
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-lux-cream-200">
                          <Button 
                            variant="outline"
                            className="border-lux-orange-300 text-lux-orange-700 hover:bg-lux-orange-50 focus:ring-2 focus:ring-lux-blue-400"
                            onClick={handleSaveSetup}
                          >
                            Save Setup
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Right Rail */}
                <div className="col-span-3 space-y-6">
                  {/* Campaign History Timeline */}
                  <Card className="rounded-lg border-border shadow-sm">
                    <CardHeader className="pb-4 pt-6 px-6">
                      <CardTitle className="text-lux-blue-900 flex items-center">
                        <History className="w-4 h-4 mr-2" />
                        Campaign History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <div className="space-y-4">
                        {campaignHistory.map((item, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              item.status === "success" ? "bg-lux-green-500" : 
                              item.status === "pending" ? "bg-lux-orange-500" : "bg-lux-cream-400"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-lux-blue-900">{item.event}</p>
                              <p className="text-xs text-muted-foreground">{item.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Property KPIs */}
                  <Card className="rounded-lg border-border shadow-sm">
                    <CardHeader className="pb-4 pt-6 px-6">
                      <CardTitle className="text-lux-blue-900">Property KPIs</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Leads (30 days)</span>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-lux-blue-900">25</span>
                            <TrendingUp className="w-3 h-3 text-lux-green-600" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Avg CPL</span>
                          <span className="font-medium text-lux-blue-900">£5.90</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Conversion Rate</span>
                          <span className="font-medium text-lux-blue-900">17.30%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Spend</span>
                          <span className="font-medium text-lux-blue-900">£247.80</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Links */}
                  <Card className="rounded-lg border-border shadow-sm">
                    <CardHeader className="pb-4 pt-6 px-6">
                      <CardTitle className="text-lux-blue-900">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start focus:ring-2 focus:ring-lux-blue-400"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Landing Page
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start focus:ring-2 focus:ring-lux-blue-400"
                        onClick={onOpenCopilot}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Open Copilot
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start focus:ring-2 focus:ring-lux-blue-400"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}