import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Rocket, Target, Calendar, Users } from 'lucide-react';

export function CreateCampaign() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleOpenCopilot = () => {
    // This will be handled by the parent App component
    // For now, we'll navigate back to dashboard where copilot can be triggered
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-lux-cream-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 text-lux-blue-600 hover:text-lux-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-lux-blue-900">Create New Campaign</h1>
            <p className="text-lux-cream-600 mt-1">Launch your next property marketing campaign</p>
          </div>
        </div>

        {/* Campaign Creation Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Setup Card */}
            <Card className="border-lux-cream-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lux-blue-900">
                  <Rocket className="h-5 w-5" />
                  Campaign Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-12">
                  <Rocket className="h-16 w-16 text-lux-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-lux-blue-900 mb-2">
                    Campaign Creation Coming Soon
                  </h3>
                  <p className="text-lux-cream-600 mb-6">
                    Our AI-powered campaign builder will help you create targeted property marketing campaigns.
                  </p>
                  <Button onClick={handleOpenCopilot} className="bg-lux-blue-600 hover:bg-lux-blue-700">
                    Use AI Copilot to Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-lux-cream-300">
              <CardHeader>
                <CardTitle className="text-lux-blue-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-lux-blue-600 border-lux-blue-200 hover:bg-lux-blue-50"
                  onClick={() => navigate('/property-marketing')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Property Marketing
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-lux-blue-600 border-lux-blue-200 hover:bg-lux-blue-50"
                  onClick={() => navigate('/social-media-assets')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Social Media Assets
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-lux-blue-600 border-lux-blue-200 hover:bg-lux-blue-50"
                  onClick={() => navigate('/write-content')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Write Content
                </Button>
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card className="border-lux-cream-300">
              <CardHeader>
                <CardTitle className="text-lux-blue-900">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-lux-cream-600 mb-4">
                  Get assistance with campaign creation and optimization.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-lux-blue-600 border-lux-blue-200 hover:bg-lux-blue-50"
                  onClick={handleOpenCopilot}
                >
                  Ask AI Copilot
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

