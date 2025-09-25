import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Home, Sparkles } from "lucide-react";

interface OutletContext {
  onOpenCopilot: () => void;
}

export function PropertyMarketing() {
  const navigate = useNavigate();
  const { onOpenCopilot } = useOutletContext<OutletContext>();
  return (
    <div className="min-h-screen bg-lux-cream-200">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-semibold text-lux-blue-900">Property Marketing</h1>
          </div>
          <Button onClick={onOpenCopilot} className="bg-lux-blue-600 hover:bg-lux-blue-700">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
        </div>

        {/* Content */}
        <Card className="border-lux-cream-300 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lux-blue-900 flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Property Marketing Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-lux-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-10 h-10 text-lux-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-lux-blue-900 mb-2">
                Property Marketing Module
              </h2>
              <p className="text-muted-foreground mb-6">
                This module will contain property-specific marketing tools and features.
              </p>
              <Button onClick={onOpenCopilot} className="bg-lux-blue-600 hover:bg-lux-blue-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Get Started with AI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
