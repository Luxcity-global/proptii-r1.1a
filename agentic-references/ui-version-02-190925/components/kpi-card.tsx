import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
  sparklineData?: number[];
  onClick?: () => void;
  tooltip?: string;
  timeWindow?: string;
}

export function KPICard({ 
  title, 
  value, 
  delta, 
  deltaType, 
  sparklineData, 
  onClick,
  tooltip,
  timeWindow = "Last 7 days"
}: KPICardProps) {
  const getDeltaIcon = () => {
    if (deltaType === "positive") return <ArrowUp className="w-3 h-3" />;
    if (deltaType === "negative") return <ArrowDown className="w-3 h-3" />;
    return <TrendingUp className="w-3 h-3" />;
  };

  const getDeltaBadge = () => {
    if (deltaType === "positive") {
      return (
        <Badge className="bg-lux-green-100 text-lux-green-700 hover:bg-lux-green-100 h-6 px-2 flex items-center space-x-1">
          <ArrowUp className="w-3 h-3" />
          <span>{delta}</span>
        </Badge>
      );
    }
    if (deltaType === "negative") {
      return (
        <Badge className="bg-lux-orange-100 text-lux-orange-700 hover:bg-lux-orange-100 h-6 px-2 flex items-center space-x-1">
          <ArrowDown className="w-3 h-3" />
          <span>{delta}</span>
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="h-6 px-2 flex items-center space-x-1">
        <TrendingUp className="w-3 h-3" />
        <span>{delta}</span>
      </Badge>
    );
  };

  const cardContent = (
    <Card 
      className={`bg-card border-border shadow-sm hover:shadow-md transition-all duration-200 rounded-lg ${
        onClick ? 'cursor-pointer hover:border-lux-blue-300 focus:outline-none focus:ring-2 focus:ring-lux-blue-400' : ''
      }`}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <CardHeader className="pb-3 pt-6 px-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm text-muted-foreground font-medium">{title}</h4>
          {sparklineData && (
            <div className="h-6 w-16 flex items-end space-x-[1px]">
              {sparklineData.map((value, index) => (
                <div
                  key={index}
                  className="bg-lux-blue-300 w-1 rounded-sm transition-all duration-200"
                  style={{ 
                    height: `${Math.max(4, (value / Math.max(...sparklineData)) * 24)}px` 
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-6 px-6">
        <div className="flex items-end justify-between">
          <div className="text-3xl font-semibold text-lux-blue-900">{value}</div>
          {getDeltaBadge()}
        </div>
        <div className="text-xs text-muted-foreground mt-2">{timeWindow}</div>
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}