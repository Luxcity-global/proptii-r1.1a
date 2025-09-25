import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  BarChart3, 
  PenTool, 
  Share2, 
  Rocket,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Activity,
  FileText,
  HelpCircle,
  MessageCircle
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface WelcomePageProps {
  isFirstTimeUser?: boolean;
}

interface OutletContext {
  onOpenCopilot: () => void;
}

const quickStats = [
  { label: "Active Campaigns", value: "24", trend: "+12%" },
  { label: "Leads Generated", value: "387", trend: "+28%" },
  { label: "Avg CPL", value: "£9.80", trend: "-15%" }
];

const recentActivity = [
  { action: "Campaign launched", detail: "Shoreditch property", time: "2 hours ago", type: "success" },
  { action: "Content generated", detail: "3 new social posts", time: "4 hours ago", type: "info" },
  { action: "Lead received", detail: "Hackney apartment", time: "6 hours ago", type: "success" }
];

export function WelcomePage({ isFirstTimeUser = false }: WelcomePageProps) {
  const navigate = useNavigate();
  const { onOpenCopilot } = useOutletContext<OutletContext>();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const actionCards = [
    {
      id: "social",
      icon: Share2,
      title: "Create Social Media Assets",
      description: "Design eye-catching posts, stories, and ads for Facebook, Instagram, and TikTok",
      cta: "Create Assets",
      variant: "outline" as const,
      color: "lux-orange",
      action: () => navigate('/social-media-assets'),
      visual: (
        <div className="relative w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-lux-orange-50 to-lux-orange-100 rounded-2xl flex items-center justify-center">
          <div className="absolute inset-2 bg-gradient-to-br from-lux-orange-200 to-lux-orange-300 rounded-xl"></div>
          <div className="relative">
            <Share2 className="w-8 h-8 text-lux-orange-600" />
          </div>
        </div>
      )
    },
    {
      id: "content",
      icon: PenTool,
      title: "Write Up Content",
      description: "Generate compelling property descriptions, blog posts, and marketing copy with AI assistance",
      cta: "Start Writing",
      variant: "outline" as const,
      color: "lux-orange",
      action: () => navigate('/write-content'),
      visual: (
        <div className="relative w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-lux-orange-50 to-lux-orange-100 rounded-2xl flex items-center justify-center">
          <div className="absolute inset-2 bg-gradient-to-br from-lux-orange-200 to-lux-orange-300 rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-lux-orange-700 absolute top-1 right-1" />
          </div>
          <div className="relative">
            <PenTool className="w-8 h-8 text-lux-orange-600" />
          </div>
        </div>
      )
    },
    {
      id: "dashboard",
      icon: BarChart3,
      title: "View Dashboard",
      description: "Monitor campaign performance, track leads, and analyze ROI across all your properties",
      cta: "Open Dashboard",
      variant: "outline" as const,
      color: "lux-blue",
      action: () => navigate('/dashboard'),
      visual: (
        <div className="relative w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-lux-blue-50 to-lux-blue-100 rounded-2xl flex items-center justify-center">
          <div className="absolute inset-2 bg-gradient-to-br from-lux-blue-200 to-lux-blue-300 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-lux-green-600 absolute top-1 right-1" />
          </div>
          <div className="relative">
            <BarChart3 className="w-8 h-8 text-lux-blue-600" />
          </div>
        </div>
      )
    },
    {
      id: "campaign",
      icon: Rocket,
      title: "Create New Campaign",
      description: "Launch targeted marketing campaigns across multiple channels with AI optimization",
      cta: "Launch Campaign",
      variant: "default" as const,
      color: "lux-blue",
      action: () => onOpenCopilot(),
      visual: (
        <div className="relative w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-lux-blue-50 to-lux-blue-100 rounded-2xl flex items-center justify-center">
          <div className="absolute inset-2 bg-gradient-to-br from-lux-blue-200 to-lux-blue-300 rounded-xl flex items-center justify-center">
            <Badge variant="outline" className="absolute -top-2 -right-2 text-xs h-5 px-2 text-lux-green-600 border-lux-green-300 bg-white">
              AI
            </Badge>
          </div>
          <div className="relative">
            <Rocket className="w-8 h-8 text-lux-blue-600" />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-lux-cream-200">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-lux-blue-50 via-lux-cream-50 to-lux-orange-50">
        {/* Background Image Overlay */}
          <div className="absolute inset-0 opacity-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTczNjY4NDZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Luxury modern apartment"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Hero Content */}
        <div className="relative max-w-[1440px] mx-auto px-6 py-20">
          <div className="text-center space-y-8">
            {isFirstTimeUser && (
              <div className="inline-flex items-center space-x-2 bg-lux-blue-100 text-lux-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Welcome to Proptii Marketing Hub!</span>
              </div>
            )}
            
            <div className="space-y-6">
              <h1 className="text-5xl font-semibold text-lux-blue-900 leading-tight">
                Welcome to Proptii Marketing Hub
              </h1>
              <p className="text-xl text-[rgba(19,108,158,1)] max-w-3xl mx-auto leading-relaxed">
                Generate compelling content, launch targeted campaigns, and attract quality tenants faster than ever with our AI-powered marketing platform
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button 
                size="lg" 
                className="bg-lux-blue-600 hover:bg-lux-blue-700 focus:ring-2 focus:ring-lux-blue-400 text-lg px-8 py-4 h-auto rounded-[36px] transition-all duration-300 hover:scale-105"
                onClick={onOpenCopilot}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-lux-blue-300 text-lux-blue-700 hover:bg-lux-blue-50 hover:border-lux-blue-400 text-lg px-8 py-4 h-auto rounded-[36px] transition-all duration-300"
                onClick={() => navigate('/dashboard')}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-6 py-16">
        <div className="space-y-16">
          {/* Primary Action Cards */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-semibold text-lux-blue-900">
                {isFirstTimeUser ? "Get started with your first campaign" : "What would you like to do today?"}
              </h2>
              <p className="text-lg text-[rgba(136,136,136,1)]">
                {isFirstTimeUser 
                  ? "Choose from our most popular actions to begin marketing your properties"
                  : "Choose from our powerful marketing tools"
                }
              </p>
            </div>
            
            <div className="flex justify-center mx-[0px] my-[65px] m-[0px] p-[0px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl w-full px-4">
                {actionCards.map((card) => {
                  const isHovered = hoveredCard === card.id;
                  
                  return (
                    <Card
                      key={card.id}
                      className={`group cursor-pointer transition-all duration-500 ease-out rounded-3xl border-8 border-white bg-lux-cream-100 shadow-sm hover:shadow-xl w-full max-w-80 h-80 mx-auto ${
                        isHovered 
                          ? "transform -translate-y-2 shadow-2xl"
                          : ""
                      }`}
                      onMouseEnter={() => setHoveredCard(card.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={card.action}
                    >
                      <CardContent className="h-full flex flex-col p-[32px] mx-[0px] my-[-6px]">
                        {/* Visual Element */}
                        <div className="flex-shrink-0 p-[0px]">
                          {card.visual}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-grow flex flex-col p-[0px] my-[-20px] mx-[0px]">
                          <div className="text-center space-y-3 mb-6">
                            <h3 className="text-xl font-semibold text-lux-blue-900 group-hover:text-lux-blue-700 transition-colors whitespace-nowrap text-[18px]">
                              {card.title}
                            </h3>
                            <p className="text-sm text-[rgba(136,136,136,1)] leading-relaxed px-2">
                              {card.description}
                            </p>
                          </div>
                          
                          {/* Button */}
                          <div className="mt-auto mb-6">
                            <Button
                              variant={card.variant}
                              className={`w-full rounded-2xl h-12 transition-all duration-300 ${
                                card.variant === "default" 
                                  ? "bg-lux-blue-600 hover:bg-lux-blue-700 text-white shadow-lg hover:shadow-xl" 
                                  : card.color === "lux-blue"
                                    ? "border-2 border-lux-blue-200 text-lux-blue-700 hover:bg-lux-blue-50 hover:border-lux-blue-300"
                                    : "border-2 border-lux-orange-200 text-lux-orange-700 hover:bg-lux-orange-50 hover:border-lux-orange-300"
                              }`}
                            >
                              {card.cta}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Secondary Elements */}
          {!isFirstTimeUser && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Stats */}
              <Card className="lg:col-span-2 border-lux-cream-300 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lux-blue-900">
                    <Activity className="w-5 h-5 mr-2" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    {quickStats.map((stat, index) => (
                      <div key={index} className="text-center space-y-2">
                        <div className="text-2xl font-semibold text-lux-blue-900">
                          {stat.value}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stat.label}
                        </div>
                        <div className={`text-xs font-medium ${
                          stat.trend.startsWith('+') ? 'text-lux-green-600' : 'text-lux-orange-600'
                        }`}>
                          {stat.trend} vs last month
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-lux-cream-300 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lux-blue-900">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === "success" ? "bg-lux-green-500" : "bg-lux-blue-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-lux-blue-900">
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.detail}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Help Section */}
          <Card className="border-lux-cream-300 shadow-sm bg-lux-cream-50">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <HelpCircle className="w-5 h-5 text-lux-blue-600" />
                <h3 className="text-lg font-semibold text-lux-blue-900">Need help getting started?</h3>
              </div>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {isFirstTimeUser 
                  ? "New to Proptii? We're here to help you create your first successful marketing campaign."
                  : "Check our comprehensive guides or get in touch with our support team."
                }
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" className="border-lux-blue-300 text-lux-blue-700 hover:bg-lux-blue-50 focus:ring-2 focus:ring-lux-blue-400">
                  <FileText className="w-4 h-4 mr-2" />
                  View Guides
                </Button>
                <Button variant="outline" className="border-lux-blue-300 text-lux-blue-700 hover:bg-lux-blue-50 focus:ring-2 focus:ring-lux-blue-400">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
