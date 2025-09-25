import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Search, Bell, HelpCircle } from "lucide-react";

export function Header() {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-[1440px] mx-auto">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-semibold text-lux-blue-800">Proptii</h1>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search properties, campaigns, assets..." 
              className="pl-10 bg-input-background border-border focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>
          
          <Button variant="ghost" size="sm">
            <HelpCircle className="w-4 h-4" />
          </Button>
          
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
            <AvatarFallback className="bg-lux-blue-100 text-lux-blue-700">JS</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}