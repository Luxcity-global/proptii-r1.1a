import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Sparkles, Send } from "lucide-react";

interface CopilotProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function Copilot({ isOpen, onClose }: CopilotProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-lux-cream-300">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-lux-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-lux-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-lux-blue-900">AI Copilot</h2>
              <p className="text-sm text-muted-foreground">Your marketing assistant</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-lux-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-lux-blue-600" />
              </div>
              <div className="bg-lux-cream-50 rounded-lg p-4 max-w-[80%]">
                <p className="text-sm text-lux-blue-900">
                  Hi! I'm your AI marketing assistant. I can help you create campaigns, generate content, and optimize your marketing efforts. What would you like to work on today?
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 justify-end">
              <div className="bg-lux-blue-600 text-white rounded-lg p-4 max-w-[80%]">
                <p className="text-sm">
                  I'd like to create a new marketing campaign for a luxury apartment in Shoreditch.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-lux-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-lux-blue-600" />
              </div>
              <div className="bg-lux-cream-50 rounded-lg p-4 max-w-[80%]">
                <p className="text-sm text-lux-blue-900">
                  Great! I can help you create a comprehensive marketing campaign. Let me gather some information about your property and target audience to create the most effective strategy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-6 border-t border-lux-cream-300">
          <div className="flex space-x-3">
            <Input 
              placeholder="Ask me anything about your marketing campaign..."
              className="flex-1"
            />
            <Button size="sm" className="bg-lux-blue-600 hover:bg-lux-blue-700">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
