import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Progress } from "./ui/progress";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { 
  ArrowLeft,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Video,
  Image as ImageIcon,
  FileText,
  Layout,
  Play,
  Sparkles,
  Wand2,
  Save,
  Download,
  Copy,
  Upload,
  RefreshCw,
  Eye,
  Edit3,
  Search,
  Filter,
  Trash2,
  MoreHorizontal,
  Layers,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Square,
  Circle,
  Triangle,
  Star,
  Heart,
  MapPin,
  Clock,
  TrendingUp,
  Users,
  Hash,
  Calendar,
  Zap,
  Target,
  BarChart3,
  Settings,
  Info,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Home,
  Building,
  Car,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface SocialMediaAssetsProps {
  onBack: () => void;
}

const platforms = [
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    bgColor: "bg-blue-500",
    assetTypes: [
      { id: "post", name: "Feed Post", dimensions: "1200×630" },
      { id: "story", name: "Story", dimensions: "1080×1920" },
      { id: "ad", name: "Ad", dimensions: "1200×628" },
      { id: "carousel", name: "Carousel", dimensions: "1080×1080" }
    ]
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "#E4405F",
    bgColor: "bg-pink-500",
    assetTypes: [
      { id: "feed", name: "Feed Post", dimensions: "1080×1080" },
      { id: "story", name: "Story", dimensions: "1080×1920" },
      { id: "reel", name: "Reel Cover", dimensions: "1080×1920" },
      { id: "igtv", name: "IGTV Cover", dimensions: "1080×1350" }
    ]
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    bgColor: "bg-blue-600",
    assetTypes: [
      { id: "post", name: "Single Image Post", dimensions: "1200×627" },
      { id: "article", name: "Article Header", dimensions: "1200×627" },
      { id: "company", name: "Company Update", dimensions: "1200×627" },
      { id: "carousel", name: "Carousel Post", dimensions: "1080×1080" }
    ]
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: Twitter,
    color: "#1DA1F2",
    bgColor: "bg-blue-400",
    assetTypes: [
      { id: "post", name: "Single Image", dimensions: "1200×675" },
      { id: "thread", name: "Thread Header", dimensions: "1200×675" },
      { id: "card", name: "Twitter Card", dimensions: "1200×628" }
    ]
  }
];

const templates = [
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    category: "modern",
    preview: "https://images.unsplash.com/photo-1662454419622-a41092ecd245?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc1NzM5Njc5N3ww&ixlib=rb-4.1.0&q=80&w=400",
    description: "Clean, contemporary design with minimalist elements"
  },
  {
    id: "luxury-elegant",
    name: "Luxury Elegant",
    category: "luxury",
    preview: "https://images.unsplash.com/photo-1625579002297-aeebbf69de89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWRyb29tJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzU3NDMwNjYxfDA&ixlib=rb-4.1.0&q=80&w=400",
    description: "Premium styling with sophisticated typography"
  },
  {
    id: "family-friendly",
    name: "Family Friendly",
    category: "family",
    preview: "https://images.unsplash.com/photo-1662454419622-a41092ecd245?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc1NzM5Njc5N3ww&ixlib=rb-4.1.0&q=80&w=400",
    description: "Warm, inviting design perfect for family properties"
  }
];

const savedAssets = [
  {
    id: "1",
    name: "Shoreditch Apartment - Instagram Post",
    platform: "Instagram",
    type: "Feed Post",
    lastModified: "2 hours ago",
    status: "published",
    thumbnail: "https://images.unsplash.com/photo-1662454419622-a41092ecd245?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc1NzM5Njc5N3ww&ixlib=rb-4.1.0&q=80&w=200"
  },
  {
    id: "2",
    name: "Hackney Studio - Facebook Ad",
    platform: "Facebook",
    type: "Ad",
    lastModified: "1 day ago",
    status: "draft",
    thumbnail: "https://images.unsplash.com/photo-1625579002297-aeebbf69de89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWRyb29tJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzU3NDMwNjYxfDA&ixlib=rb-4.1.0&q=80&w=200"
  },
  {
    id: "3",
    name: "Market Update - LinkedIn Post",
    platform: "LinkedIn",
    type: "Single Image Post",
    lastModified: "3 days ago",
    status: "scheduled",
    thumbnail: "https://images.unsplash.com/photo-1662454419622-a41092ecd245?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc1NzM5Njc5N3ww&ixlib=rb-4.1.0&q=80&w=200"
  }
];

const hashtagSuggestions = [
  "#LondonProperty", "#PropertyInvestment", "#RentalProperty", "#Shoreditch", "#ModernLiving",
  "#PropertyMarketing", "#LondonRentals", "#Investment", "#RealEstate", "#PropertyForRent"
];

const contentSuggestions = [
  "✨ Stunning 2-bed apartment in the heart of trendy Shoreditch",
  "🏠 Your next home awaits in this beautifully designed space",
  "📍 Prime location with excellent transport links",
  "💫 Modern living meets urban convenience"
];

export function SocialMediaAssets({ onBack }: SocialMediaAssetsProps) {
  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0]);
  const [selectedAssetType, setSelectedAssetType] = useState(platforms[0].assetTypes[0]);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [canvasZoom, setCanvasZoom] = useState([100]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collapsible tool trays state
  const [expandedTray, setExpandedTray] = useState<string | null>(null);

  const [layers, setLayers] = useState([
    { id: "background", name: "Background", type: "image", visible: true, locked: false },
    { id: "overlay", name: "Color Overlay", type: "shape", visible: true, locked: false },
    { id: "title", name: "Property Title", type: "text", visible: true, locked: false },
    { id: "price", name: "Price", type: "text", visible: true, locked: false },
    { id: "logo", name: "Proptii Logo", type: "image", visible: true, locked: false }
  ]);

  const handlePlatformChange = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (platform) {
      setSelectedPlatform(platform);
      setSelectedAssetType(platform.assetTypes[0]);
    }
  };

  const handleAssetTypeChange = (assetTypeId: string) => {
    const assetType = selectedPlatform.assetTypes.find(a => a.id === assetTypeId);
    if (assetType) {
      setSelectedAssetType(assetType);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success("Image uploaded successfully!");
    }
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsGenerating(false);
    toast.success("AI asset generated successfully! Multiple variations created.");
  };

  const handleSaveAsset = () => {
    toast.success("Asset saved to library");
  };

  const handleExportAsset = () => {
    toast.success("Asset exported successfully");
  };

  const handleAddToCaption = (text: string) => {
    setCaption(prev => prev ? `${prev} ${text}` : text);
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  };

  const toggleLayerLock = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, locked: !layer.locked }
        : layer
    ));
  };

  const toggleTray = (trayId: string) => {
    setExpandedTray(prev => prev === trayId ? null : trayId);
  };

  const getCanvasAspectRatio = () => {
    const [width, height] = selectedAssetType.dimensions.split('×').map(Number);
    return height / width;
  };

  const getCanvasDimensions = () => {
    const [width, height] = selectedAssetType.dimensions.split('×').map(Number);
    const aspectRatio = height / width;
    
    const maxWidth = 700;
    const maxHeight = 500;
    
    let baseWidth, baseHeight;
    
    if (aspectRatio > 1) {
      baseHeight = Math.min(maxHeight, 450);
      baseWidth = baseHeight / aspectRatio;
      
      if (baseWidth > maxWidth) {
        baseWidth = maxWidth;
        baseHeight = baseWidth * aspectRatio;
      }
    } else {
      baseWidth = Math.min(maxWidth, 600);
      baseHeight = baseWidth * aspectRatio;
      
      if (baseHeight > maxHeight) {
        baseHeight = maxHeight;
        baseWidth = baseHeight / aspectRatio;
      }
    }
    
    const zoomFactor = canvasZoom[0] / 100;
    
    return {
      width: baseWidth * zoomFactor,
      height: baseHeight * zoomFactor,
      aspectRatio
    };
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.icon || ImageIcon;
  };

  const toolTrays = [
    {
      id: "templates",
      name: "Templates",
      icon: Layout,
      color: "text-lux-blue-600"
    },
    {
      id: "images",
      name: "Images",
      icon: ImageIcon,
      color: "text-lux-green-600"
    },
    {
      id: "elements",
      name: "Elements",
      icon: Square,
      color: "text-lux-orange-600"
    },
    {
      id: "text",
      name: "Text",
      icon: Type,
      color: "text-lux-blue-700"
    },
    {
      id: "ai-tools",
      name: "AI Tools",
      icon: Sparkles,
      color: "text-lux-orange-500"
    },
    {
      id: "layers",
      name: "Layers",
      icon: Layers,
      color: "text-lux-blue-500"
    },
    {
      id: "assets",
      name: "Assets",
      icon: Save,
      color: "text-lux-green-700"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="focus:ring-2 focus:ring-lux-blue-400">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Hub
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold text-lux-blue-900">Create Social Media Assets</h1>
                <p className="text-sm text-muted-foreground">Design compelling visuals for your property marketing</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleSaveAsset} className="focus:ring-2 focus:ring-lux-blue-400">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleExportAsset} className="focus:ring-2 focus:ring-lux-blue-400">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                className="bg-lux-blue-600 hover:bg-lux-blue-700 focus:ring-2 focus:ring-lux-blue-400"
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform & Asset Type Selector */}
      <div className="bg-lux-cream-100 border-b border-border px-6 py-4">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center space-x-6">
            {/* Platform Tabs */}
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium text-lux-blue-900">Platform:</Label>
              <div className="flex space-x-1">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatform.id === platform.id;
                  
                  return (
                    <Button
                      key={platform.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`h-8 px-3 ${
                        isSelected 
                          ? "bg-lux-blue-600 hover:bg-lux-blue-700 text-white"
                          : "hover:bg-lux-blue-50 border-lux-cream-300"
                      }`}
                      onClick={() => handlePlatformChange(platform.id)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {platform.name}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Asset Type Selector */}
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium text-lux-blue-900">Type:</Label>
              <Select value={selectedAssetType.id} onValueChange={handleAssetTypeChange}>
                <SelectTrigger className="w-48 h-8 focus:ring-2 focus:ring-lux-blue-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedPlatform.assetTypes.map((assetType) => (
                    <SelectItem key={assetType.id} value={assetType.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{assetType.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {assetType.dimensions}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="max-w-[1600px] mx-auto">
        <div className="flex h-[calc(100vh-160px)]">
          {/* Left Sidebar - Tool Icons */}
          <div className="w-20 bg-card border-r border-border flex flex-col">
            <div className="flex-1 py-4">
              <div className="space-y-2">
                {toolTrays.map((tray) => {
                  const Icon = tray.icon;
                  const isSelected = expandedTray === tray.id;
                  
                  return (
                    <button
                      key={tray.id}
                      onClick={() => toggleTray(tray.id)}
                      className={`w-full flex flex-col items-center justify-center p-3 transition-all ${
                        isSelected
                          ? "bg-lux-blue-50 border-r-2 border-lux-blue-500"
                          : "hover:bg-lux-blue-25"
                      }`}
                      title={tray.name}
                    >
                      <Icon className={`w-6 h-6 mb-1 ${isSelected ? "text-lux-blue-600" : "text-lux-blue-500"}`} />
                      <span className={`text-xs font-medium ${isSelected ? "text-lux-blue-600" : "text-lux-blue-700"}`}>
                        {tray.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Panel - Tool Content (when expanded) */}
          {expandedTray && (
            <div className="w-80 bg-card border-r border-border flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-medium text-lux-blue-900">
                  {toolTrays.find(t => t.id === expandedTray)?.name}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setExpandedTray(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {/* Templates Content */}
                  {expandedTray === 'templates' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {templates.map((template) => (
                          <div
                            key={template.id}
                            className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                              selectedTemplate.id === template.id
                                ? "border-lux-blue-400 shadow-md"
                                : "border-lux-cream-300 hover:border-lux-blue-300"
                            }`}
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <div className="aspect-video bg-gradient-to-br from-lux-blue-100 to-lux-orange-100 flex items-center justify-center">
                              <ImageWithFallback
                                src={template.preview}
                                alt={template.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-2">
                              <h5 className="text-xs font-medium text-lux-blue-900">{template.name}</h5>
                              <p className="text-xs text-muted-foreground">{template.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Images Content */}
                  {expandedTray === 'images' && (
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        className="w-full h-20 border-dashed border-lux-cream-400 hover:border-lux-blue-400 hover:bg-lux-blue-50"
                        onClick={handleImageUpload}
                      >
                        <div className="text-center">
                          <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Upload Images</span>
                        </div>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Brand Colors</Label>
                        <div className="flex space-x-2">
                          <div className="w-8 h-8 rounded bg-lux-blue-600 cursor-pointer border border-lux-cream-300" />
                          <div className="w-8 h-8 rounded bg-lux-orange-500 cursor-pointer border border-lux-cream-300" />
                          <div className="w-8 h-8 rounded bg-lux-green-500 cursor-pointer border border-lux-cream-300" />
                          <div className="w-8 h-8 rounded bg-lux-cream-400 cursor-pointer border border-lux-cream-300" />
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <Palette className="w-3 h-3 mr-2" />
                        Proptii Logo
                      </Button>
                    </div>
                  )}

                  {/* Elements Content */}
                  {expandedTray === 'elements' && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">Shapes</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[Square, Circle, Triangle, Star, Heart].map((Icon, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="h-10 w-10 p-0 border-lux-cream-300 hover:border-lux-blue-400 hover:bg-lux-blue-50"
                            >
                              <Icon className="w-4 h-4 text-lux-blue-600" />
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">Icons</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[Home, Building, Car, MapPin, Clock, TrendingUp].map((Icon, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="h-10 w-10 p-0 border-lux-cream-300 hover:border-lux-blue-400 hover:bg-lux-blue-50"
                            >
                              <Icon className="w-4 h-4 text-lux-blue-600" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Text Content */}
                  {expandedTray === 'text' && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">Add Text</Label>
                        <Button variant="outline" className="w-full mb-3">
                          <Type className="w-4 h-4 mr-2" />
                          Add Heading
                        </Button>
                        <Button variant="outline" className="w-full">
                          <FileText className="w-4 h-4 mr-2" />
                          Add Subtext
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">Text Formatting</Label>
                        <div className="flex space-x-1 mb-3">
                          <Button variant="outline" size="sm" className="px-2">
                            <Bold className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="px-2">
                            <Italic className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="px-2">
                            <Underline className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" className="px-2">
                            <AlignLeft className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="px-2">
                            <AlignCenter className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="px-2">
                            <AlignRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">Content Suggestions</Label>
                        <div className="space-y-2">
                          {contentSuggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="w-full text-left text-xs p-2 h-auto whitespace-normal text-lux-blue-700 hover:bg-lux-blue-50"
                              onClick={() => handleAddToCaption(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Tools Content */}
                  {expandedTray === 'ai-tools' && (
                    <div className="space-y-4">
                      <div className="bg-lux-orange-50 p-3 rounded-lg border border-lux-orange-200">
                        <Button
                          className="w-full bg-lux-blue-600 hover:bg-lux-blue-700 mb-3"
                          onClick={handleGenerateWithAI}
                          disabled={isGenerating}
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Asset Variations
                        </Button>
                        
                        <Button variant="outline" className="w-full mb-3 bg-white">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Enhance Property Photos
                        </Button>
                        
                        <Button variant="outline" className="w-full bg-white">
                          <Hash className="w-4 h-4 mr-2" />
                          Suggest Hashtags
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-sm font-medium text-lux-orange-800 mb-2 block">Optimization Tips</Label>
                        <Alert className="border-lux-orange-200 bg-white">
                          <Info className="w-4 h-4" />
                          <AlertDescription className="text-xs">
                            AI will optimize your content based on platform best practices and current trends.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  )}

                  {/* Layers Content */}
                  {expandedTray === 'layers' && (
                    <div className="space-y-3">
                      {layers.map((layer) => (
                        <div
                          key={layer.id}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                            selectedLayer === layer.id
                              ? "border-lux-blue-400 bg-lux-blue-50"
                              : "border-lux-cream-300 hover:border-lux-blue-300"
                          }`}
                          onClick={() => setSelectedLayer(layer.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 flex items-center justify-center">
                              {layer.type === "image" && <ImageIcon className="w-3 h-3" />}
                              {layer.type === "text" && <Type className="w-3 h-3" />}
                              {layer.type === "shape" && <Square className="w-3 h-3" />}
                            </div>
                            <span className="text-sm text-lux-blue-900">{layer.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLayerVisibility(layer.id);
                              }}
                            >
                              {layer.visible ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3 opacity-50" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLayerLock(layer.id);
                              }}
                            >
                              {layer.locked ? (
                                <Settings className="w-3 h-3" />
                              ) : (
                                <Settings className="w-3 h-3 opacity-50" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <Button variant="outline" className="w-full" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Layer
                      </Button>
                    </div>
                  )}

                  {/* Assets Content */}
                  {expandedTray === 'assets' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-lux-blue-900">Saved Assets</Label>
                        <Button variant="ghost" size="sm">
                          <Filter className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {savedAssets.map((asset) => {
                          const PlatformIcon = getPlatformIcon(asset.platform.toLowerCase());
                          return (
                            <div
                              key={asset.id}
                              className="border border-lux-cream-300 rounded-lg p-3 hover:border-lux-blue-300 transition-colors cursor-pointer"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-12 h-12 rounded overflow-hidden bg-lux-cream-200 flex-shrink-0">
                                  <ImageWithFallback
                                    src={asset.thumbnail}
                                    alt={asset.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-medium text-lux-blue-900 truncate">{asset.name}</h4>
                                  <div className="flex items-center space-x-1 mt-1">
                                    <PlatformIcon className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{asset.platform}</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <Badge
                                      variant={
                                        asset.status === "published"
                                          ? "default"
                                          : asset.status === "scheduled"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className="text-xs"
                                    >
                                      {asset.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{asset.lastModified}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Caption Editor - Bottom of Middle Panel */}
              <div className="border-t border-border p-4">
                <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">Caption</Label>
                <Textarea
                  placeholder="Write your caption here..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{caption.length}/2200</span>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Hash className="w-3 h-3 mr-1" />
                    Add hashtags
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Right Column - Canvas Area */}
          <div className="flex-1 flex flex-col">
            {/* Canvas Header */}
            <div className="bg-card border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-xs">
                    {selectedAssetType.dimensions}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedPlatform.name} • {selectedAssetType.name}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setCanvasZoom([Math.max(25, canvasZoom[0] - 25)])}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCanvasZoom([100])}
                    className="text-xs px-2"
                  >
                    Fit
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">{canvasZoom[0]}%</span>
                  <Button variant="ghost" size="sm" onClick={() => setCanvasZoom([Math.min(200, canvasZoom[0] + 25)])}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center bg-lux-cream-100 p-6">
              <div
                className="bg-white shadow-lg rounded-lg overflow-hidden border-2 border-lux-cream-300"
                style={{
                  width: `${getCanvasDimensions().width}px`,
                  height: `${getCanvasDimensions().height}px`,
                }}
              >
                <div className="relative w-full h-full">
                  {/* Background Property Image */}
                  <div className="absolute inset-0">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1603072845032-7b5bd641a82a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzU4MDQ2MTA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                      alt="Modern apartment living room"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                  
                  {/* Status Badge - Top Left */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-lux-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      ✓ AVAILABLE NOW
                    </div>
                  </div>
                  
                  {/* New Listing Badge - Top Right */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-lux-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                      🔥 NEW LISTING
                    </div>
                  </div>
                  
                  {/* Main Content - Center */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6">
                    <div className="text-center">
                      <h1 className="text-white font-bold mb-3 drop-shadow-2xl" style={{ fontSize: `${Math.max(28, getCanvasDimensions().width * 0.06)}px` }}>
                        Luxury Shoreditch Apartment
                      </h1>
                      
                      <h2 className="text-white font-semibold drop-shadow-xl" style={{ fontSize: `${Math.max(18, getCanvasDimensions().width * 0.04)}px` }}>
                        Book Viewing Now
                      </h2>
                    </div>
                  </div>
                  
                  {/* Bottom Info Bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-lux-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">P</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-lux-blue-900">Proptii</div>
                          <div className="text-xs text-lux-blue-600">Trusted Property Partner</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-lux-blue-600">📍 Shoreditch, E1</div>
                        <div className="text-xs text-lux-green-600 font-medium">✓ Verified Listing</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Small Thumbnail Images for Multi-room Preview - Repositioned */}
                  {getCanvasDimensions().width >= 400 && (
                    <div className="absolute bottom-20 right-4 flex space-x-1">
                      <div className="w-10 h-10 rounded-md overflow-hidden border-2 border-white shadow-lg">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1668089677938-b52086753f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxsdXh1cnklMjBiZWRyb29tJTIwbW9kZXJuJTIwZGVzaWdufGVufDF8fHx8MTc1ODEwNzUxM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                          alt="Bedroom"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-10 h-10 rounded-md overflow-hidden border-2 border-white shadow-lg">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1672322331200-c4ac12a93c15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwYXBhcnRtZW50JTIwdmlld3xlbnwxfHx8fDE3NTgxMDc1MTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                          alt="Kitchen"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-10 h-10 rounded-md overflow-hidden border-2 border-white shadow-lg flex items-center justify-center bg-lux-blue-600">
                        <span className="text-white text-xs font-bold">+5</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Grid overlay when canvas is large enough */}
                  {canvasZoom[0] >= 100 && getCanvasDimensions().width >= 300 && (
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                      <svg width="100%" height="100%" className="w-full h-full">
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Properties Panel - Right Column Bottom */}
            <div className="bg-card border-t border-border p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lux-blue-900">Publishing Options</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Schedule Post</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Auto-hashtags</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Cross-post</Label>
                    <Switch />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}