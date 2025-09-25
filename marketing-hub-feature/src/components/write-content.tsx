import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, PenTool, Sparkles } from "lucide-react";

export function WriteContent() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-lux-cream-200">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hub
            </Button>
            <h1 className="text-3xl font-semibold text-lux-blue-900">Write Content</h1>
          </div>
          <Button className="bg-lux-orange-600 hover:bg-lux-orange-700">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Writing Assistant
          </Button>
        </div>

        {/* Content */}
        <Card className="border-lux-cream-300 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lux-blue-900 flex items-center">
              <PenTool className="w-5 h-5 mr-2" />
              Content Creation Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-lux-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-10 h-10 text-lux-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-lux-blue-900 mb-2">
                Content Writing Module
              </h2>
              <p className="text-muted-foreground mb-6">
                This module will contain AI-powered content creation tools for property descriptions, blog posts, and marketing copy.
              </p>
              <Button className="bg-lux-orange-600 hover:bg-lux-orange-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Writing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
