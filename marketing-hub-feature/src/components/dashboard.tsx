import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Home,
  Share2,
  PenTool,
  Rocket,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Calendar,
  Target,
  Activity
} from "lucide-react";

interface OutletContext {
  onOpenCopilot: () => void;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { onOpenCopilot } = useOutletContext<OutletContext>();
  return (
    <div className="min-h-screen bg-lux-cream-200">
      <div className="flex">
        {/* Navigation Sidebar */}
        <div className="w-64 bg-white border-r border-lux-cream-300 min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-lux-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-lux-blue-900">Proptii</h2>
            </div>
            
            <nav className="space-y-2">
              <Button 
                variant="default" 
                className="w-full justify-start bg-lux-blue-600 hover:bg-lux-blue-700"
                onClick={() => navigate('/')}
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Dashboard
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-lux-blue-900 hover:bg-lux-blue-50"
                onClick={() => navigate('/social-media-assets')}
              >
                <Share2 className="w-4 h-4 mr-3" />
                Social Media Assets
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-lux-blue-900 hover:bg-lux-blue-50"
                onClick={() => navigate('/write-content')}
              >
                <PenTool className="w-4 h-4 mr-3" />
                Write Content
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-lux-blue-900 hover:bg-lux-blue-50"
                onClick={() => navigate('/create-campaign')}
              >
                <Rocket className="w-4 h-4 mr-3" />
                Create Campaign
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-lux-blue-900 hover:bg-lux-blue-50"
                onClick={() => navigate('/property-marketing')}
              >
                <Home className="w-4 h-4 mr-3" />
                Property Marketing
              </Button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-lux-blue-900">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Monitor your marketing performance and campaigns</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button onClick={onOpenCopilot} className="bg-lux-blue-600 hover:bg-lux-blue-700">
                <Rocket className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-lux-cream-300 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Campaigns</p>
                    <p className="text-2xl font-semibold text-lux-blue-900">24</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-lux-green-600 mr-1" />
                      <p className="text-xs text-lux-green-600">+12% from last month</p>
                    </div>
                  </div>
                  <div className="p-3 bg-lux-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-lux-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-lux-cream-300 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Leads Generated</p>
                    <p className="text-2xl font-semibold text-lux-blue-900">387</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-lux-green-600 mr-1" />
                      <p className="text-xs text-lux-green-600">+28% from last month</p>
                    </div>
                  </div>
                  <div className="p-3 bg-lux-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-lux-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-lux-cream-300 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg CPL</p>
                    <p className="text-2xl font-semibold text-lux-blue-900">£9.80</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-lux-orange-600 mr-1 rotate-180" />
                      <p className="text-xs text-lux-orange-600">-15% from last month</p>
                    </div>
                  </div>
                  <div className="p-3 bg-lux-orange-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-lux-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-lux-cream-300 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="text-2xl font-semibold text-lux-blue-900">4.2x</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-lux-green-600 mr-1" />
                      <p className="text-xs text-lux-green-600">+0.8x from last month</p>
                    </div>
                  </div>
                  <div className="p-3 bg-lux-green-100 rounded-lg">
                    <Target className="w-6 h-6 text-lux-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Campaigns Table */}
            <Card className="lg:col-span-2 border-lux-cream-300 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lux-blue-900">Active Campaigns</CardTitle>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-lux-cream-50 rounded-lg hover:bg-lux-cream-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lux-blue-900">Shoreditch Premium Campaign</h3>
                        <Badge variant="secondary" className="bg-lux-green-100 text-lux-green-800">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">2-bed flat in Shoreditch</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Started 3 days ago
                        </span>
                        <span className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          £2,500 budget
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-lux-blue-900">£47.20</p>
                      <p className="text-xs text-muted-foreground">8 leads</p>
                      <div className="flex items-center space-x-1 mt-2">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-lux-cream-50 rounded-lg hover:bg-lux-cream-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lux-blue-900">Canary Wharf Luxury Suite</h3>
                        <Badge variant="secondary" className="bg-lux-blue-100 text-lux-blue-800">Paused</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">1-bed luxury suite, Canary Wharf</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Started 1 week ago
                        </span>
                        <span className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          £1,800 budget
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-lux-blue-900">£32.50</p>
                      <p className="text-xs text-muted-foreground">5 leads</p>
                      <div className="flex items-center space-x-1 mt-2">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-lux-cream-50 rounded-lg hover:bg-lux-cream-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lux-blue-900">Hackney Modern Apartment</h3>
                        <Badge variant="secondary" className="bg-lux-orange-100 text-lux-orange-800">Draft</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">3-bed modern apartment, Hackney</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Created yesterday
                        </span>
                        <span className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          £3,200 budget
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-lux-blue-900">-</p>
                      <p className="text-xs text-muted-foreground">0 leads</p>
                      <div className="flex items-center space-x-1 mt-2">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity & Quick Actions */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <Card className="border-lux-cream-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lux-blue-900 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-lux-green-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-lux-blue-900">Campaign launched</p>
                      <p className="text-xs text-muted-foreground">Shoreditch property</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-lux-blue-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-lux-blue-900">Content generated</p>
                      <p className="text-xs text-muted-foreground">3 new social posts</p>
                      <p className="text-xs text-muted-foreground">4 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-lux-green-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-lux-blue-900">Lead received</p>
                      <p className="text-xs text-muted-foreground">Hackney apartment</p>
                      <p className="text-xs text-muted-foreground">6 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-lux-orange-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-lux-blue-900">Campaign paused</p>
                      <p className="text-xs text-muted-foreground">Canary Wharf suite</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-lux-cream-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lux-blue-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/create-campaign')}
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Create New Campaign
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/social-media-assets')}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Generate Social Content
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/write-content')}
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Write Property Description
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
