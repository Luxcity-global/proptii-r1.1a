import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  ArrowLeft,
  FileText,
  PenTool,
  Mail,
  Megaphone,
  Newspaper,
  Sparkles,
  Wand2,
  Save,
  Download,
  Copy,
  RefreshCw,
  Eye,
  Edit3,
  Search,
  Filter,
  Trash2,
  MoreHorizontal,
  MapPin,
  Bed,
  Bath,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  Users,
  Globe,
  Zap,
  BookOpen,
  Settings,
  Info,
  ChevronRight,
  Plus
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface WriteContentProps {
  onBack: () => void;
}

const contentTypes = [
  {
    id: "property-desc",
    name: "Property Descriptions",
    icon: FileText,
    color: "lux-blue",
    templates: [
      { id: "long-form", name: "Long-form Description", description: "Detailed 200-300 word property description" },
      { id: "short-form", name: "Short-form Description", description: "Concise 50-100 word summary" },
      { id: "social-ready", name: "Social Media Ready", description: "Punchy description for social posts" }
    ]
  },
  {
    id: "blog-posts",
    name: "Blog Posts",
    icon: BookOpen,
    color: "lux-orange",
    templates: [
      { id: "market-update", name: "Market Updates", description: "Local property market insights" },
      { id: "property-guide", name: "Property Guides", description: "Area guides and local amenities" },
      { id: "investment-tips", name: "Investment Tips", description: "Property investment advice" }
    ]
  },
  {
    id: "email-campaigns",
    name: "Email Campaigns",
    icon: Mail,
    color: "lux-green",
    templates: [
      { id: "newsletter", name: "Newsletters", description: "Monthly property newsletter" },
      { id: "follow-up", name: "Follow-ups", description: "Lead nurturing sequences" },
      { id: "announcement", name: "Announcements", description: "New listings and updates" }
    ]
  },
  {
    id: "ad-copy",
    name: "Ad Copy",
    icon: Megaphone,
    color: "lux-orange",
    templates: [
      { id: "facebook-ad", name: "Facebook Ads", description: "Engaging Facebook ad variants" },
      { id: "google-ad", name: "Google Ads", description: "Search-optimized Google ads" },
      { id: "instagram-ad", name: "Instagram Ads", description: "Visual Instagram ad copy" }
    ]
  },
  {
    id: "press-releases",
    name: "Press Releases",
    icon: Newspaper,
    color: "lux-blue",
    templates: [
      { id: "new-listing", name: "New Listings", description: "Property launch announcements" },
      { id: "market-insight", name: "Market Insights", description: "Industry trend releases" }
    ]
  }
];

const toneOptions = [
  { id: "professional", name: "Professional", description: "Formal, credible, business-focused" },
  { id: "friendly", name: "Friendly", description: "Warm, approachable, conversational" },
  { id: "luxury", name: "Luxury", description: "Premium, sophisticated, exclusive" },
  { id: "urgent", name: "Urgent", description: "Time-sensitive, action-oriented" }
];

const properties = [
  {
    id: "1",
    address: "2-bed flat in Shoreditch, E2 7JD",
    rent: "£2,400/month",
    beds: 2,
    baths: 1,
    type: "Apartment",
    features: ["Modern kitchen", "High ceilings", "Near Old Street", "Recently renovated"]
  },
  {
    id: "2", 
    address: "1-bed studio in Hackney, E8 3DY",
    rent: "£1,800/month",
    beds: 1,
    baths: 1,
    type: "Studio",
    features: ["Open plan", "Balcony", "Gym access", "24/7 concierge"]
  }
];

const savedContent = [
  {
    id: "1",
    title: "Shoreditch Apartment - Long Description",
    type: "Property Description",
    property: "2-bed flat in Shoreditch",
    lastModified: "2 hours ago",
    wordCount: 247,
    status: "published"
  },
  {
    id: "2",
    title: "Facebook Ad - Hackney Studio",
    type: "Ad Copy",
    property: "1-bed studio in Hackney",
    lastModified: "1 day ago",
    wordCount: 82,
    status: "draft"
  },
  {
    id: "3",
    title: "East London Market Update - Q4 2024",
    type: "Blog Post",
    property: "General",
    lastModified: "3 days ago",
    wordCount: 1247,
    status: "published"
  }
];

export function WriteContent({ onBack }: WriteContentProps) {
  const [selectedContentType, setSelectedContentType] = useState(contentTypes[0]);
  const [selectedTemplate, setSelectedTemplate] = useState(contentTypes[0].templates[0]);
  const [selectedProperty, setSelectedProperty] = useState(properties[0]);
  const [selectedTone, setSelectedTone] = useState(toneOptions[0]);
  const [contentLength, setContentLength] = useState([2]); // 1=Short, 2=Medium, 3=Long
  const [keywords, setKeywords] = useState("");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState(85);
  const [activeTab, setActiveTab] = useState("editor");

  const handleContentTypeSelect = (contentType: typeof contentTypes[0]) => {
    setSelectedContentType(contentType);
    setSelectedTemplate(contentType.templates[0]);
  };

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const variants = [
      {
        id: "A",
        title: "Variant A - Professional",
        content: `Discover exceptional living in this stunning 2-bedroom apartment located in the heart of vibrant Shoreditch. This thoughtfully designed property features a modern kitchen with premium appliances, high ceilings that create an airy atmosphere, and has been recently renovated to the highest standards.

Located just 5 minutes from Old Street station, you'll have excellent transport links to the City and beyond. The property combines contemporary comfort with the unique character that makes Shoreditch one of London's most sought-after areas.

Perfect for young professionals seeking a premium lifestyle in an unbeatable location.`,
        wordCount: 124,
        tone: "Professional"
      },
      {
        id: "B",
        title: "Variant B - Friendly",
        content: `Your new home awaits in brilliant Shoreditch! This gorgeous 2-bed flat is everything you've been looking for - think modern kitchen perfect for your morning coffee, lovely high ceilings that make everything feel spacious, and it's been beautifully renovated throughout.

You'll love being just a 5-minute walk from Old Street station, making your commute a breeze. Plus, you're right in the heart of one of London's coolest neighborhoods, surrounded by amazing cafes, galleries, and that unique Shoreditch buzz.

Ready to make this place home? We can't wait to show you around!`,
        wordCount: 118,
        tone: "Friendly"
      },
      {
        id: "C",
        title: "Variant C - Luxury",
        content: `Experience sophisticated urban living in this exquisite 2-bedroom residence nestled within Shoreditch's prestigious enclave. This meticulously crafted apartment showcases a state-of-the-art kitchen with premium European fixtures, soaring ceilings that epitomize architectural elegance, and comprehensive renovations executed to uncompromising standards.

The property's prime position offers effortless connectivity via Old Street station, mere moments away, while placing you at the epicenter of East London's cultural renaissance.

An exceptional opportunity for the discerning tenant seeking refined living in London's most dynamic quarter.`,
        wordCount: 119,
        tone: "Luxury"
      }
    ];

    setGeneratedVariants(variants);
    setIsGenerating(false);
    toast.success("Content generated successfully! Review the variants below.");
  };

  const handleSelectVariant = (index: number) => {
    setSelectedVariant(index);
    setContent(generatedVariants[index].content);
    setWordCount(generatedVariants[index].wordCount);
  };

  const handleSaveContent = () => {
    toast.success("Content saved to library");
  };

  const handleExportContent = () => {
    toast.success("Content exported successfully");
  };

  // Update word count when content changes
  const handleContentChange = (value: string) => {
    setContent(value);
    setWordCount(value.trim().split(/\s+/).filter(word => word.length > 0).length);
  };

  const getLengthLabel = (value: number) => {
    switch (value) {
      case 1: return "Short (50-100 words)";
      case 2: return "Medium (100-200 words)";
      case 3: return "Long (200+ words)";
      default: return "Medium";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="focus:ring-2 focus:ring-lux-blue-400">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Hub
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold text-lux-blue-900">Write Up Content</h1>
                <p className="text-sm text-muted-foreground">Generate compelling content with AI assistance</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleSaveContent} className="focus:ring-2 focus:ring-lux-blue-400">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleExportContent} className="focus:ring-2 focus:ring-lux-blue-400">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto p-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* Left Sidebar - Content Types */}
          <div className="col-span-3">
            <Card className="h-full border-lux-cream-300 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lux-blue-900">Content Types</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-240px)]">
                  <div className="space-y-2 p-4">
                    {contentTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedContentType.id === type.id;
                      
                      return (
                        <div key={type.id}>
                          <Button
                            variant={isSelected ? "secondary" : "ghost"}
                            className={`w-full justify-start h-auto p-3 ${
                              isSelected 
                                ? "bg-lux-blue-50 text-lux-blue-900 border border-lux-blue-200" 
                                : "hover:bg-lux-cream-100"
                            }`}
                            onClick={() => handleContentTypeSelect(type)}
                          >
                            <Icon className={`w-4 h-4 mr-3 ${
                              type.color === "lux-blue" ? "text-lux-blue-600" :
                              type.color === "lux-orange" ? "text-lux-orange-600" :
                              "text-lux-green-600"
                            }`} />
                            <span className="text-left">{type.name}</span>
                          </Button>
                          
                          {isSelected && (
                            <div className="ml-7 mt-2 space-y-1">
                              {type.templates.map((template) => (
                                <Button
                                  key={template.id}
                                  variant="ghost"
                                  size="sm"
                                  className={`w-full justify-start text-xs h-auto py-2 ${
                                    selectedTemplate.id === template.id
                                      ? "bg-lux-blue-100 text-lux-blue-800"
                                      : "text-muted-foreground hover:text-lux-blue-700"
                                  }`}
                                  onClick={() => setSelectedTemplate(template)}
                                >
                                  {template.name}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Editor Area */}
          <div className="col-span-6">
            <div className="space-y-6 h-full">
              {/* Property and Template Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
                    Select Property
                  </Label>
                  <Select value={selectedProperty.id} onValueChange={(value) => {
                    const property = properties.find(p => p.id === value);
                    if (property) setSelectedProperty(property);
                  }}>
                    <SelectTrigger className="focus:ring-2 focus:ring-lux-blue-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          <div>
                            <div className="font-medium">{property.address}</div>
                            <div className="text-xs text-muted-foreground">{property.rent}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
                    Template
                  </Label>
                  <Select value={selectedTemplate.id} onValueChange={(value) => {
                    const template = selectedContentType.templates.find(t => t.id === value);
                    if (template) setSelectedTemplate(template);
                  }}>
                    <SelectTrigger className="focus:ring-2 focus:ring-lux-blue-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedContentType.templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">{template.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* AI Assistance Panel */}
              <Card className="border-lux-orange-200 bg-lux-orange-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lux-orange-800">
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI Content Generation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-lux-orange-800 mb-2 block">
                        Tone & Style
                      </Label>
                      <Select value={selectedTone.id} onValueChange={(value) => {
                        const tone = toneOptions.find(t => t.id === value);
                        if (tone) setSelectedTone(tone);
                      }}>
                        <SelectTrigger className="bg-white focus:ring-2 focus:ring-lux-blue-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {toneOptions.map((tone) => (
                            <SelectItem key={tone.id} value={tone.id}>
                              <div>
                                <div className="font-medium">{tone.name}</div>
                                <div className="text-xs text-muted-foreground">{tone.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-lux-orange-800 mb-2 block">
                        Content Length
                      </Label>
                      <div className="space-y-2">
                        <Slider
                          value={contentLength}
                          onValueChange={setContentLength}
                          max={3}
                          min={1}
                          step={1}
                          className="bg-white"
                        />
                        <div className="text-xs text-lux-orange-700 text-center">
                          {getLengthLabel(contentLength[0])}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="keywords" className="text-sm font-medium text-lux-orange-800 mb-2 block">
                      Keywords & Key Points
                    </Label>
                    <Input
                      id="keywords"
                      placeholder="e.g., modern, transport links, trendy area, investment opportunity"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="bg-white focus:ring-2 focus:ring-lux-blue-400"
                    />
                  </div>
                  
                  <Button 
                    className="w-full bg-lux-blue-600 hover:bg-lux-blue-700 focus:ring-2 focus:ring-lux-blue-400"
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Variants */}
              {generatedVariants.length > 0 && (
                <Card className="border-lux-cream-300 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lux-blue-900">Generated Variants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="A" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-3">
                        {generatedVariants.map((variant, index) => (
                          <TabsTrigger 
                            key={variant.id} 
                            value={variant.id}
                            className="flex items-center space-x-2"
                          >
                            <span>Variant {variant.id}</span>
                            <Badge variant="outline" className="text-xs">
                              {variant.wordCount}w
                            </Badge>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {generatedVariants.map((variant, index) => (
                        <TabsContent key={variant.id} value={variant.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-lux-blue-900">{variant.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {variant.tone}
                              </Badge>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleSelectVariant(index)}
                              className="bg-lux-blue-600 hover:bg-lux-blue-700"
                            >
                              Use This Version
                            </Button>
                          </div>
                          
                          <div className="p-4 bg-lux-cream-100 rounded-lg border border-lux-cream-300">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {variant.content}
                            </p>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {/* Content Editor */}
              <Card className="flex-1 border-lux-cream-300 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lux-blue-900">Content Editor</CardTitle>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-muted-foreground">
                        {wordCount} words
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Readability:</span>
                        <Badge className={`${
                          readabilityScore >= 80 ? "bg-lux-green-100 text-lux-green-700" :
                          readabilityScore >= 60 ? "bg-lux-orange-100 text-lux-orange-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {readabilityScore}/100
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Start writing your content here, or use AI generation above..."
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="min-h-[300px] resize-none focus:ring-2 focus:ring-lux-blue-400"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Panel - Property Context & Library */}
          <div className="col-span-3 space-y-6">
            {/* Property Context */}
            <Card className="border-lux-cream-300 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lux-blue-900">Property Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-lux-blue-900 mb-1">{selectedProperty.address}</h4>
                    <p className="text-sm text-muted-foreground">{selectedProperty.rent}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Bed className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedProperty.beds} beds</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bath className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedProperty.baths} bath</span>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-lux-blue-900 mb-2">Key Features</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedProperty.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-lux-blue-900">Market Insights</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg. Rent (Area):</span>
                      <span className="font-medium">£2,180/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Market Position:</span>
                      <span className="font-medium text-lux-green-600">+9% above avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Demand Level:</span>
                      <Badge className="bg-lux-green-100 text-lux-green-700 hover:bg-lux-green-100">High</Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-lux-blue-900">Suggested Keywords</h5>
                  <div className="flex flex-wrap gap-1">
                    {["modern", "trendy", "transport links", "Shoreditch", "Old Street", "lifestyle"].map((keyword, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-lux-blue-600 hover:bg-lux-blue-50"
                        onClick={() => setKeywords(prev => prev ? `${prev}, ${keyword}` : keyword)}
                      >
                        {keyword}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Reminders */}
            <Alert className="border-lux-orange-200 bg-lux-orange-50">
              <AlertCircle className="h-4 w-4 text-lux-orange-600" />
              <AlertDescription className="text-sm text-lux-orange-800">
                <strong>Compliance Check:</strong> Ensure EPC rating, deposit terms, and safety certificates are mentioned where required.
              </AlertDescription>
            </Alert>

            {/* Content Library */}
            <Card className="border-lux-cream-300 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lux-blue-900">Content Library</CardTitle>
                  <Button variant="ghost" size="sm" className="focus:ring-2 focus:ring-lux-blue-400">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 p-4">
                    {savedContent.map((item) => (
                      <div key={item.id} className="p-3 border border-lux-cream-300 rounded-lg hover:bg-lux-cream-50 cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-lux-blue-900 truncate">{item.title}</h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              item.status === "published" 
                                ? "text-lux-green-600 border-lux-green-300" 
                                : "text-lux-orange-600 border-lux-orange-300"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>{item.type} • {item.property}</p>
                          <div className="flex justify-between">
                            <span>{item.wordCount} words</span>
                            <span>{item.lastModified}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}