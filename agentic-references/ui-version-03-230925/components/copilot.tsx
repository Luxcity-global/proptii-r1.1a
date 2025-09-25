import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { 
  X, 
  Target, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  MapPin,
  Sparkles,
  Play,
  TestTube2,
  Clock,
  Image as ImageIcon,
  Video,
  FileText,
  Share2,
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  RefreshCw,
  BarChart3,
  ExternalLink,
  Megaphone,
  Info,
  ChevronRight,
  Settings,
  Activity,
  Globe,
  PoundSterling,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Crown,
  MessageCircle,
  Heart,
  Edit3
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface CopilotProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  propertyContext?: {
    name?: string;
    type?: string;
    location?: string;
  };
}

const objectives = [
  { id: "leads", label: "Generate Leads", description: "Capture contact information from interested prospects" },
  { id: "viewings", label: "Book Viewings", description: "Schedule property viewings with qualified tenants" },
  { id: "applications", label: "Drive Applications", description: "Convert visitors into rental applications" }
];

const channelOptions = [
  { id: "facebook", name: "Facebook", recommended: true, icon: "📘" },
  { id: "instagram", name: "Instagram", recommended: true, icon: "📷" },
  { id: "google", name: "Google Ads", recommended: true, icon: "🔎" },
  { id: "rightmove", name: "Rightmove", recommended: false, icon: "🏠" },
  { id: "zoopla", name: "Zoopla", recommended: false, icon: "🏡" }
];

const audiencePresets = [
  { id: "young-professionals", label: "Young Professionals", description: "Ages 25-35, £30k+ income, career-focused" },
  { id: "families", label: "Young Families", description: "Ages 28-40, household income £45k+, seeking stability" },
  { id: "students", label: "Graduate Students", description: "Ages 22-28, postgraduate studies, shared living" },
  { id: "downsizers", label: "Downsizers", description: "Ages 50+, seeking smaller properties, comfortable budget" }
];

const toneOptions = [
  { id: "professional", label: "Professional & Trustworthy", description: "Authoritative, credible, business-focused" },
  { id: "luxury", label: "Premium & Sophisticated", description: "Elegant, exclusive, high-end positioning" },
  { id: "friendly", label: "Friendly & Approachable", description: "Warm, welcoming, conversational" },
  { id: "casual", label: "Casual & Relaxed", description: "Informal, laid-back, lifestyle-focused" }
];

const assetManifest = {
  copy: [
    {
      id: "copy-1",
      name: "Primary Listing Description",
      preview: "Stunning 2-bedroom flat in the heart of Shoreditch featuring modern amenities, excellent transport links, and vibrant neighborhood lifestyle. Perfect for young professionals seeking urban convenience.",
      status: "approved" as const,
      lastUpdated: "2 hours ago",
      version: 3,
      compliance: { flag: false, issues: [] }
    },
    {
      id: "copy-2",
      name: "Facebook Ad Copy - Variant A",
      preview: "🏠 Your Shoreditch lifestyle awaits! Modern 2-bed flat, £2,400/month. 5 mins to Old Street station. Book viewing today! #ShoreditchLiving #ModernFlat",
      status: "needs-review" as const,
      lastUpdated: "4 hours ago",
      version: 2,
      compliance: { flag: true, issues: ["Missing deposit information", "Emoji usage may need review"] }
    },
    {
      id: "copy-3",
      name: "Google Search Ad Headlines",
      preview: "Luxury Shoreditch Flat | Available Now | £2,400/month | Modern 2-Bed Apartment | Prime Location",
      status: "draft" as const,
      lastUpdated: "6 hours ago",
      version: 1,
      compliance: { flag: false, issues: [] }
    },
    {
      id: "copy-4",
      name: "Instagram Caption Template",
      preview: "Life in Shoreditch hits different ✨ This 2-bed flat combines modern living with historic charm. Swipe to see more → #ShoreditchLife #PropertyGoals",
      status: "approved" as const,
      lastUpdated: "1 day ago",
      version: 1,
      compliance: { flag: false, issues: [] }
    }
  ],
  visuals: [
    {
      id: "visual-1",
      name: "Hero Photography Set (12 images)",
      preview: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=120&fit=crop",
      status: "approved" as const,
      lastUpdated: "1 day ago",
      version: 2,
      compliance: { flag: false, issues: [] }
    },
    {
      id: "visual-2",
      name: "Facebook Marketing Images",
      preview: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=120&fit=crop",
      status: "needs-review" as const,
      lastUpdated: "2 days ago",
      version: 1,
      compliance: { flag: true, issues: ["Branding consistency needed", "Resolution requirements"] }
    },
    {
      id: "visual-3",
      name: "Instagram Story Templates",
      preview: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=200&h=120&fit=crop",
      status: "approved" as const,
      lastUpdated: "3 hours ago",
      version: 1,
      compliance: { flag: false, issues: [] }
    },
    {
      id: "visual-4",
      name: "Google Display Banners",
      preview: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=120&fit=crop",
      status: "draft" as const,
      lastUpdated: "5 hours ago",
      version: 1,
      compliance: { flag: false, issues: [] }
    }
  ],
  social: [
    {
      id: "social-1",
      name: "Instagram Stories Pack (15 templates)",
      preview: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=200&h=120&fit=crop",
      status: "approved" as const,
      lastUpdated: "3 hours ago",
      version: 1,
      compliance: { flag: false, issues: [] }
    },
    {
      id: "social-2",
      name: "Facebook Carousel Assets",
      preview: "https://images.unsplash.com/photo-1600607688960-7bb8f0dc5d64?w=200&h=120&fit=crop",
      status: "needs-review" as const,
      lastUpdated: "1 day ago",
      version: 2,
      compliance: { flag: false, issues: [] }
    },
    {
      id: "social-3",
      name: "LinkedIn Property Post Graphics",
      preview: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=200&h=120&fit=crop",
      status: "draft" as const,
      lastUpdated: "2 days ago",
      version: 1,
      compliance: { flag: false, issues: [] }
    }
  ],
  video: [
    {
      id: "video-1",
      name: "Property Tour Script & Storyboard",
      preview: "Welcome to this stunning 2-bedroom apartment in the heart of Shoreditch. Let me show you what makes this place special...",
      status: "needs-review" as const,
      lastUpdated: "5 hours ago",
      version: 1,
      compliance: { flag: true, issues: ["Accessibility requirements for video content"] }
    },
    {
      id: "video-2",
      name: "15s Social Media Video Template",
      preview: "https://images.unsplash.com/photo-1600607688960-7bb8f0dc5d64?w=200&h=120&fit=crop",
      status: "approved" as const,
      lastUpdated: "2 days ago",
      version: 1,
      compliance: { flag: false, issues: [] }
    },
    {
      id: "video-3",
      name: "Virtual Tour Walkthrough",
      preview: "https://images.unsplash.com/photo-1600566752734-5ac3e54a3fe9?w=200&h=120&fit=crop",
      status: "draft" as const,
      lastUpdated: "3 days ago",
      version: 1,
      compliance: { flag: false, issues: [] }
    }
  ]
};

export function Copilot({ isOpen, onClose, onComplete, propertyContext }: CopilotProps) {
  const [activeTab, setActiveTab] = useState("plan");
  const [objective, setObjective] = useState("leads");
  const [selectedChannels, setSelectedChannels] = useState(["facebook", "instagram", "google"]);
  const [dailyBudget, setDailyBudget] = useState([25]);
  const [totalBudget, setTotalBudget] = useState("750");
  const [audience, setAudience] = useState("young-professionals");
  const [tone, setTone] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentGenerated, setContentGenerated] = useState(false);
  const [activeAssetTab, setActiveAssetTab] = useState("copy");
  const [isLaunching, setIsLaunching] = useState(false);
  const [campaignLaunched, setCampaignLaunched] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  // Pre-flight checklist states
  const [preflightChecks, setPreflightChecks] = useState({
    content: true,
    compliance: false,
    channels: true,
    budget: true,
    landing: false
  });

  const selectedObjective = objectives.find(obj => obj.id === objective);
  const selectedAudience = audiencePresets.find(aud => aud.id === audience);
  const selectedTone = toneOptions.find(t => t.id === tone);

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    
    // Simulate content generation with progress
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsGenerating(false);
    setContentGenerated(true);
    setActiveTab("create");
    toast.success("Content package generated successfully! Review your assets in the Create tab.");
  };

  const handleAssetApprove = (assetId: string) => {
    toast.success("Asset approved successfully");
  };

  const handleAssetReject = (assetId: string) => {
    toast.error("Asset rejected - please review feedback");
  };

  const handleLaunchCampaign = async () => {
    setIsLaunching(true);
    
    // Simulate campaign launch
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLaunching(false);
    setCampaignLaunched(true);
    setShowSuccessScreen(true);
    toast.success("Campaign launched successfully!");
  };

  const handleTestCampaign = () => {
    toast.info("Test campaign initiated - monitoring for 24 hours");
  };

  const getStatusIcon = (status: "approved" | "needs-review" | "draft") => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-lux-green-600" />;
      case "needs-review":
        return <Clock className="w-4 h-4 text-lux-orange-600" />;
      case "draft":
        return <Edit3 className="w-4 h-4 text-lux-cream-600" />;
    }
  };

  const getStatusBadge = (status: "approved" | "needs-review" | "draft") => {
    switch (status) {
      case "approved":
        return <Badge className="bg-lux-green-100 text-lux-green-700 hover:bg-lux-green-100">Approved</Badge>;
      case "needs-review":
        return <Badge className="bg-lux-orange-100 text-lux-orange-700 hover:bg-lux-orange-100">Needs Review</Badge>;
      case "draft":
        return <Badge variant="outline" className="text-lux-cream-600">Draft</Badge>;
    }
  };

  const AssetCard = ({ asset, type }: { asset: any; type: string }) => (
    <Card className="rounded-lg border-lux-cream-300 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            {(type === "visuals" || type === "social" || type === "video") && asset.preview.startsWith("http") ? (
              <img 
                src={asset.preview} 
                alt={asset.name}
                className="w-16 h-10 object-cover rounded border border-lux-cream-300"
              />
            ) : (
              <div className="w-16 h-10 bg-lux-cream-200 rounded border border-lux-cream-300 flex items-center justify-center">
                {type === "copy" && <FileText className="w-4 h-4 text-lux-cream-500" />}
                {type === "visuals" && <ImageIcon className="w-4 h-4 text-lux-cream-500" />}
                {type === "social" && <Share2 className="w-4 h-4 text-lux-cream-500" />}
                {type === "video" && <Video className="w-4 h-4 text-lux-cream-500" />}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {getStatusIcon(asset.status)}
                <h4 className="font-medium text-lux-blue-900 truncate">{asset.name}</h4>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {asset.preview}
              </p>
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <span>Updated {asset.lastUpdated}</span>
                <span>•</span>
                <span>Version {asset.version}</span>
              </div>
              
              {asset.compliance.flag && (
                <div className="mt-2">
                  <div className="flex items-center space-x-1 mb-1">
                    <AlertTriangle className="w-3 h-3 text-lux-orange-500" />
                    <span className="text-xs font-medium text-lux-orange-700">Compliance Issues</span>
                  </div>
                  <div className="space-y-1">
                    {asset.compliance.issues.map((issue: string, index: number) => (
                      <div key={index} className="text-xs text-lux-orange-600">• {issue}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="ml-2">
            {getStatusBadge(asset.status)}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-lux-cream-200">
          <div className="flex items-center space-x-2">
            {asset.status === "needs-review" ? (
              <>
                <Button 
                  size="sm" 
                  className="h-7 bg-lux-blue-600 hover:bg-lux-blue-700 focus:ring-2 focus:ring-lux-blue-400"
                  onClick={() => handleAssetApprove(asset.id)}
                >
                  Approve
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 focus:ring-2 focus:ring-lux-blue-400"
                  onClick={() => handleAssetReject(asset.id)}
                >
                  Reject
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="h-7 focus:ring-2 focus:ring-lux-blue-400">
                <Eye className="w-3 h-3 mr-1" />
                Review
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-lux-blue-600 hover:text-lux-blue-700">
            Regenerate with reason...
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (showSuccessScreen) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-[90vw] max-w-[1000px] min-w-[600px] p-0">
          <div className="h-full flex flex-col">
            <SheetHeader className="px-6 py-4 border-b border-lux-cream-300">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-lux-green-600" />
                  <span>Campaign Launched Successfully!</span>
                </SheetTitle>
                <Button variant="ghost" size="sm" onClick={onClose} className="focus:ring-2 focus:ring-lux-blue-400">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </SheetHeader>

            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="max-w-md text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-lux-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-lux-green-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-medium text-lux-blue-900 mb-2">
                    Your campaign is now live!
                  </h3>
                  <p className="text-muted-foreground">
                    Your marketing campaign for {propertyContext?.name || "2-bed flat in Shoreditch"} is now running across 
                    {selectedChannels.length} channels with a daily budget of £{dailyBudget[0]}.
                  </p>
                </div>

                <div className="bg-lux-cream-100 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-lux-blue-900 mb-3">Campaign Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Channels:</span>
                      <span className="font-medium">{selectedChannels.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily Budget:</span>
                      <span className="font-medium">£{dailyBudget[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Leads/Week:</span>
                      <span className="font-medium text-lux-green-600">28-35</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. CPL:</span>
                      <span className="font-medium text-lux-green-600">£6.20</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full bg-lux-blue-600 hover:bg-lux-blue-700 focus:ring-2 focus:ring-lux-blue-400"
                    onClick={() => {
                      onComplete();
                      onClose();
                    }}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Open Dashboard
                  </Button>
                  
                  <div className="flex space-x-3">
                    <Button variant="outline" className="flex-1 focus:ring-2 focus:ring-lux-blue-400">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Campaign
                    </Button>
                    <Button variant="outline" className="flex-1 focus:ring-2 focus:ring-lux-blue-400">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[90vw] max-w-[1200px] min-w-[800px] p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="px-6 py-4 border-b border-lux-cream-300">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-lux-blue-600" />
                  <span>Marketing Copilot</span>
                </SheetTitle>
                <SheetDescription>
                  AI-powered campaign planning, content creation, and launch assistant
                </SheetDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="focus:ring-2 focus:ring-lux-blue-400">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="plan" className="flex items-center space-x-2 focus:ring-2 focus:ring-lux-blue-400">
                    <Target className="w-4 h-4" />
                    <span>Plan</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="create" 
                    className="flex items-center space-x-2 focus:ring-2 focus:ring-lux-blue-400"
                    disabled={!contentGenerated}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Create</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="launch" 
                    className="flex items-center space-x-2 focus:ring-2 focus:ring-lux-blue-400"
                    disabled={!contentGenerated}
                  >
                    <Play className="w-4 h-4" />
                    <span>Launch</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto">
                {/* PLAN TAB */}
                <TabsContent value="plan" className="mt-0 p-6">
                  <div className="grid grid-cols-12 gap-6 h-full">
                    {/* Left Panel - AI Proposal */}
                    <div className="col-span-5">
                      <Card className="h-full border-lux-blue-200 shadow-sm">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-lux-blue-900">
                            <Lightbulb className="w-5 h-5 mr-2" />
                            AI Proposal
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Objective Display */}
                          <div className="p-4 bg-lux-blue-50 rounded-lg border border-lux-blue-200">
                            <div className="flex items-center space-x-2 mb-3">
                              <Target className="w-5 h-5 text-lux-blue-600" />
                              <h4 className="font-medium text-lux-blue-800">
                                {selectedObjective?.label}
                              </h4>
                            </div>
                            <p className="text-sm text-lux-blue-700 mb-4">
                              Multi-channel campaign targeting {selectedAudience?.description.toLowerCase()} within 5km of Shoreditch. 
                              Optimized for {selectedObjective?.description.toLowerCase()} using {selectedTone?.description.toLowerCase()} messaging.
                            </p>
                            
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-lux-blue-600">Channel Mix:</span>
                                </div>
                                <div className="text-xs space-y-1">
                                  <div className="flex justify-between">
                                    <span>Facebook</span>
                                    <span className="font-medium">40%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Instagram</span>
                                    <span className="font-medium">35%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Google</span>
                                    <span className="font-medium">25%</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-lux-blue-600">Budget Split:</span>
                                </div>
                                <div className="text-xs space-y-1">
                                  <div className="flex justify-between">
                                    <span>Facebook</span>
                                    <span className="font-medium">£{Math.round(dailyBudget[0] * 0.4)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Instagram</span>
                                    <span className="font-medium">£{Math.round(dailyBudget[0] * 0.35)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Google</span>
                                    <span className="font-medium">£{Math.round(dailyBudget[0] * 0.25)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex justify-between">
                                <span className="text-lux-blue-600">Expected CPL:</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="font-medium text-lux-green-600 cursor-help">£6.20</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cost per lead based on historical data for similar properties</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-lux-blue-600">Est. Leads/Week:</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="font-medium text-lux-green-600 cursor-help">28-35</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Estimated lead volume based on budget and audience targeting</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>

                          {/* Key Reasons */}
                          <div>
                            <h4 className="font-medium text-lux-blue-900 mb-3">Key Rationale</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-lux-blue-400 mt-2 flex-shrink-0" />
                                <span>High engagement from 25-35 age group in Shoreditch area</span>
                              </li>
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-lux-blue-400 mt-2 flex-shrink-0" />
                                <span>Instagram Stories perform 23% better for property content</span>
                              </li>
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-lux-blue-400 mt-2 flex-shrink-0" />
                                <span>Google Search captures high-intent rental prospects</span>
                              </li>
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-lux-blue-400 mt-2 flex-shrink-0" />
                                <span>Optimal budget allocation based on historical performance</span>
                              </li>
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-lux-blue-400 mt-2 flex-shrink-0" />
                                <span>{selectedTone?.label} tone resonates with target demographic</span>
                              </li>
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Panel - Controls */}
                    <div className="col-span-7 space-y-6">
                      <Card className="border-lux-cream-300 shadow-sm">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lux-blue-900">Campaign Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Objective Selector */}
                          <div>
                            <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
                              Campaign Objective
                            </Label>
                            <Select value={objective} onValueChange={setObjective}>
                              <SelectTrigger className="focus:ring-2 focus:ring-lux-blue-400">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {objectives.map((obj) => (
                                  <SelectItem key={obj.id} value={obj.id}>
                                    <div>
                                      <div className="font-medium">{obj.label}</div>
                                      <div className="text-xs text-muted-foreground">{obj.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Channel Toggles */}
                          <div>
                            <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
                              Marketing Channels
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              {channelOptions.map((channel) => (
                                <div key={channel.id} className="flex items-center space-x-3">
                                  <Checkbox
                                    id={channel.id}
                                    checked={selectedChannels.includes(channel.id)}
                                    onCheckedChange={() => handleChannelToggle(channel.id)}
                                    className="focus:ring-2 focus:ring-lux-blue-400"
                                  />
                                  <Label
                                    htmlFor={channel.id}
                                    className={`flex items-center space-x-2 cursor-pointer text-sm ${
                                      selectedChannels.includes(channel.id) ? "text-lux-blue-900" : "text-muted-foreground"
                                    }`}
                                  >
                                    <span>{channel.icon}</span>
                                    <span>{channel.name}</span>
                                    {channel.recommended && (
                                      <Badge variant="outline" className="text-xs h-4 px-1">Recommended</Badge>
                                    )}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Budget Controls */}
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
                                Daily Budget: £{dailyBudget[0]}
                              </Label>
                              <Slider
                                value={dailyBudget}
                                onValueChange={setDailyBudget}
                                max={100}
                                min={10}
                                step={5}
                                className="mb-2"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>£10</span>
                                <span>£100</span>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="total-budget" className="text-sm font-medium text-lux-blue-900 mb-3 block">
                                Total Campaign Budget
                              </Label>
                              <div className="flex items-center space-x-2">
                                <PoundSterling className="w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="total-budget"
                                  type="number"
                                  value={totalBudget}
                                  onChange={(e) => setTotalBudget(e.target.value)}
                                  className="focus:ring-2 focus:ring-lux-blue-400"
                                  placeholder="750.00"
                                  step="0.01"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Audience Presets */}
                          <div>
                            <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
                              Target Audience
                            </Label>
                            <Select value={audience} onValueChange={setAudience}>
                              <SelectTrigger className="focus:ring-2 focus:ring-lux-blue-400">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {audiencePresets.map((preset) => (
                                  <SelectItem key={preset.id} value={preset.id}>
                                    <div>
                                      <div className="font-medium">{preset.label}</div>
                                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Tone Selector */}
                          <div>
                            <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
                              Brand Voice & Tone
                            </Label>
                            <Select value={tone} onValueChange={setTone}>
                              <SelectTrigger className="focus:ring-2 focus:ring-lux-blue-400">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {toneOptions.map((option) => (
                                  <SelectItem key={option.id} value={option.id}>
                                    <div>
                                      <div className="font-medium">{option.label}</div>
                                      <div className="text-xs text-muted-foreground">{option.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pre-flight Notice */}
                      <Alert className="border-lux-cream-400 bg-lux-cream-50">
                        <Info className="h-4 w-4 text-lux-blue-600" />
                        <AlertDescription className="text-sm">
                          <strong>Before we continue:</strong> This tool will generate marketing content for your property. 
                          Please ensure you have appropriate permissions to market this property and comply with local advertising regulations. 
                          Review our <a href="#" className="text-lux-blue-600 hover:underline">content policy</a> and 
                          <a href="#" className="ml-1 text-lux-blue-600 hover:underline">privacy guidelines</a>.
                        </AlertDescription>
                      </Alert>

                      {/* Generate Button */}
                      <Button 
                        className="w-full bg-lux-blue-600 hover:bg-lux-blue-700 focus:ring-2 focus:ring-lux-blue-400 h-12"
                        onClick={handleGenerateContent}
                        disabled={isGenerating || selectedChannels.length === 0}
                      >
                        {isGenerating ? (
                          <>
                            <Clock className="w-5 h-5 mr-2 animate-spin" />
                            Generating Content Package...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Generate Content Package
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* CREATE TAB */}
                <TabsContent value="create" className="mt-0 p-6">
                  <div className="space-y-6">
                    {/* Compliance Badges Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-lux-orange-600" />
                        <span className="font-medium text-lux-orange-800">Compliance Review Required</span>
                        <Badge className="bg-lux-orange-100 text-lux-orange-700 hover:bg-lux-orange-100 cursor-pointer" 
                               onClick={() => setActiveAssetTab("copy")}>
                          2 Copy Issues
                        </Badge>
                        <Badge className="bg-lux-orange-100 text-lux-orange-700 hover:bg-lux-orange-100 cursor-pointer"
                               onClick={() => setActiveAssetTab("visuals")}>
                          1 Visual Issue
                        </Badge>
                        <Badge className="bg-lux-orange-100 text-lux-orange-700 hover:bg-lux-orange-100 cursor-pointer"
                               onClick={() => setActiveAssetTab("video")}>
                          1 Video Issue
                        </Badge>
                      </div>
                      <Button size="sm" className="bg-lux-blue-600 hover:bg-lux-blue-700">
                        Auto-fix Issues
                      </Button>
                    </div>

                    {/* Asset Sub-tabs */}
                    <Tabs value={activeAssetTab} onValueChange={setActiveAssetTab}>
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="copy" className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>Copy</span>
                          <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">4</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="visuals" className="flex items-center space-x-2">
                          <ImageIcon className="w-4 h-4" />
                          <span>Visuals</span>
                          <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">4</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="social" className="flex items-center space-x-2">
                          <Share2 className="w-4 h-4" />
                          <span>Social</span>
                          <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">3</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="video" className="flex items-center space-x-2">
                          <Video className="w-4 h-4" />
                          <span>Video</span>
                          <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">3</Badge>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="copy" className="space-y-4 mt-6">
                        {isGenerating ? (
                          <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                              <Card key={i} className="rounded-lg">
                                <CardContent className="p-4">
                                  <div className="flex items-start space-x-3">
                                    <Skeleton className="w-16 h-10 rounded" />
                                    <div className="flex-1 space-y-2">
                                      <Skeleton className="h-4 w-3/4" />
                                      <Skeleton className="h-3 w-full" />
                                      <Skeleton className="h-3 w-2/3" />
                                    </div>
                                    <Skeleton className="w-16 h-6 rounded-full" />
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {assetManifest.copy.map((asset) => (
                              <AssetCard key={asset.id} asset={asset} type="copy" />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="visuals" className="space-y-4 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {assetManifest.visuals.map((asset) => (
                            <AssetCard key={asset.id} asset={asset} type="visuals" />
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="social" className="space-y-4 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {assetManifest.social.map((asset) => (
                            <AssetCard key={asset.id} asset={asset} type="social" />
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="video" className="space-y-4 mt-6">
                        <div className="grid grid-cols-1 gap-4">
                          {assetManifest.video.map((asset) => (
                            <AssetCard key={asset.id} asset={asset} type="video" />
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </TabsContent>

                {/* LAUNCH TAB */}
                <TabsContent value="launch" className="mt-0 p-6">
                  <div className="space-y-6">
                    {/* Pre-flight Checklist */}
                    <Card className="border-lux-cream-300 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lux-blue-900">
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Pre-flight Checklist
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-lux-green-50 border border-lux-green-200">
                            <div className="flex items-center space-x-3">
                              <CheckCircle2 className="w-5 h-5 text-lux-green-600" />
                              <span className="text-sm font-medium">Content approval and compliance</span>
                            </div>
                            <Badge className="bg-lux-green-100 text-lux-green-700 hover:bg-lux-green-100">Complete</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-lg bg-lux-orange-50 border border-lux-orange-200">
                            <div className="flex items-center space-x-3">
                              <AlertCircle className="w-5 h-5 text-lux-orange-600" />
                              <span className="text-sm font-medium">Policy checks and consent summary</span>
                            </div>
                            <Badge className="bg-lux-orange-100 text-lux-orange-700 hover:bg-lux-orange-100">Pending Review</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-lg bg-lux-green-50 border border-lux-green-200">
                            <div className="flex items-center space-x-3">
                              <CheckCircle2 className="w-5 h-5 text-lux-green-600" />
                              <span className="text-sm font-medium">Channel integrations verified</span>
                            </div>
                            <Badge className="bg-lux-green-100 text-lux-green-700 hover:bg-lux-green-100">Verified</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-lg bg-lux-green-50 border border-lux-green-200">
                            <div className="flex items-center space-x-3">
                              <CheckCircle2 className="w-5 h-5 text-lux-green-600" />
                              <span className="text-sm font-medium">Budget allocation and daily caps</span>
                            </div>
                            <Badge className="bg-lux-green-100 text-lux-green-700 hover:bg-lux-green-100">Confirmed</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-lg bg-lux-orange-50 border border-lux-orange-200">
                            <div className="flex items-center space-x-3">
                              <AlertCircle className="w-5 h-5 text-lux-orange-600" />
                              <span className="text-sm font-medium">Landing page final review</span>
                            </div>
                            <Badge className="bg-lux-orange-100 text-lux-orange-700 hover:bg-lux-orange-100">Needs Review</Badge>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-lux-cream-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-lux-blue-900">Overall Status</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={60} className="w-24 h-2" />
                              <span className="text-sm text-muted-foreground">3 of 5 complete</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Campaign Settings Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Schedule & Budget */}
                      <Card className="border-lux-cream-300 shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center text-lux-blue-900">
                            <CalendarIcon className="w-5 h-5 mr-2" />
                            Schedule & Budget
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
                              Campaign Schedule
                            </Label>
                            <div className="flex items-center space-x-2 p-3 bg-lux-cream-100 rounded-lg">
                              <Calendar className="w-4 h-4 text-lux-blue-600" />
                              <span className="text-sm">Start: Today • Duration: Open-ended</span>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
                              Daily Budget Cap
                            </Label>
                            <div className="flex items-center space-x-2 p-3 bg-lux-cream-100 rounded-lg">
                              <PoundSterling className="w-4 h-4 text-lux-blue-600" />
                              <span className="text-sm font-medium">£{dailyBudget[0]}.00 per day</span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
                              Geographic Targeting
                            </Label>
                            <div className="flex items-center space-x-2 mb-2">
                              <MapPin className="w-4 h-4 text-lux-blue-600" />
                              <span className="text-sm font-medium">London Area Targeting</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">5km radius</Badge>
                              <Badge variant="outline">Shoreditch</Badge>
                              <Badge variant="outline">Hackney</Badge>
                              <Badge variant="outline">Islington</Badge>
                              <Badge variant="outline">Tower Hamlets</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Final Confirmation */}
                      <Card className="border-lux-cream-300 shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center text-lux-blue-900">
                            <Settings className="w-5 h-5 mr-2" />
                            Campaign Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 bg-lux-blue-50 rounded-lg border border-lux-blue-200">
                            <h4 className="font-medium text-lux-blue-800 mb-3">Ready to Launch</h4>
                            <div className="space-y-2 text-sm text-lux-blue-700">
                              <div className="flex justify-between">
                                <span>Active Channels:</span>
                                <span className="font-medium">{selectedChannels.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Content Assets:</span>
                                <span className="font-medium">14 approved</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Daily Budget:</span>
                                <span className="font-medium">£{dailyBudget[0]}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Est. Monthly Spend:</span>
                                <span className="font-medium">£{dailyBudget[0] * 30}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Expected Leads/Month:</span>
                                <span className="font-medium text-lux-green-600">120-140</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Projected CPL:</span>
                                <span className="font-medium text-lux-green-600">£6.20</span>
                              </div>
                            </div>
                          </div>

                          <Alert className="border-lux-blue-200 bg-lux-blue-50">
                            <Info className="h-4 w-4 text-lux-blue-600" />
                            <AlertDescription className="text-sm text-lux-blue-800">
                              Campaign will be monitored for compliance and performance. 
                              You can pause or modify settings at any time from the dashboard.
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4 pt-6">
                      <Button 
                        variant="ghost" 
                        className="focus:ring-2 focus:ring-lux-blue-400"
                        onClick={handleTestCampaign}
                      >
                        <TestTube2 className="w-4 h-4 mr-2" />
                        Test Campaign
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            className="bg-lux-blue-600 hover:bg-lux-blue-700 focus:ring-2 focus:ring-lux-blue-400 px-8"
                            disabled={Object.values(preflightChecks).some(check => !check)}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Publish Campaign
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Campaign Launch</AlertDialogTitle>
                            <AlertDialogDescription>
                              You're about to launch a marketing campaign with a daily budget of £{dailyBudget[0]}. 
                              The campaign will run across {selectedChannels.length} channels and can be paused or modified at any time.
                              
                              <div className="mt-4 p-3 bg-lux-cream-100 rounded-lg text-sm">
                                <strong>Spend Protection:</strong> Daily spending is capped at £{dailyBudget[0]}. 
                                You'll receive notifications if performance deviates from expectations.
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleLaunchCampaign}
                              className="bg-lux-blue-600 hover:bg-lux-blue-700"
                              disabled={isLaunching}
                            >
                              {isLaunching ? "Launching..." : "Confirm Launch"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}