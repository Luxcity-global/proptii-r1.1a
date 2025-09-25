import { useState } from "react";
import { Header } from "./components/header";
import { Dashboard } from "./components/dashboard";
import { PropertyMarketing } from "./components/property-marketing";
import { WelcomePage } from "./components/welcome-page";
import { WriteContent } from "./components/write-content";
import { SocialMediaAssets } from "./components/social-media-assets";
import { Copilot } from "./components/copilot";
import { Toaster } from "./components/ui/sonner";

type View = "welcome" | "dashboard" | "property" | "write-content" | "social-assets";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("welcome");
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const handleNavigateToWelcome = () => {
    setCurrentView("welcome");
  };

  const handleNavigateToDashboard = () => {
    setCurrentView("dashboard");
  };

  const handleNavigateToProperty = () => {
    setCurrentView("property");
  };

  const handleNavigateToWriteContent = () => {
    setCurrentView("write-content");
  };

  const handleNavigateToSocialAssets = () => {
    setCurrentView("social-assets");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  const handleBackToWelcome = () => {
    setCurrentView("welcome");
  };

  const handleOpenCopilot = () => {
    setIsCopilotOpen(true);
  };

  const handleCloseCopilot = () => {
    setIsCopilotOpen(false);
  };

  const handleCopilotComplete = () => {
    // Optionally refresh data or update state when copilot completes
    setCurrentView("dashboard");
  };

  return (
    <div className="min-h-screen bg-lux-cream-200 flex flex-col">
      {currentView !== "welcome" && <Header />}
      
      <main className="flex-1">
        {currentView === "welcome" && (
          <WelcomePage 
            onNavigateToDashboard={handleNavigateToDashboard}
            onNavigateToProperty={handleNavigateToProperty}
            onNavigateToWriteContent={handleNavigateToWriteContent}
            onNavigateToSocialAssets={handleNavigateToSocialAssets}
            onOpenCopilot={handleOpenCopilot}
            isFirstTimeUser={false}
          />
        )}
        
        {currentView === "dashboard" && (
          <Dashboard 
            onNavigateToProperty={handleNavigateToProperty}
            onOpenCopilot={handleOpenCopilot}
            onBackToHub={handleBackToWelcome}
          />
        )}
        
        {currentView === "property" && (
          <PropertyMarketing 
            onBack={handleBackToDashboard}
            onOpenCopilot={handleOpenCopilot}
          />
        )}
        
        {currentView === "write-content" && (
          <WriteContent 
            onBack={handleBackToWelcome}
          />
        )}
        
        {currentView === "social-assets" && (
          <SocialMediaAssets 
            onBack={handleBackToWelcome}
          />
        )}
      </main>

      <Copilot 
        isOpen={isCopilotOpen}
        onClose={handleCloseCopilot}
        onComplete={handleCopilotComplete}
      />

      <Toaster 
        position="top-right"
        richColors
        closeButton
        theme="light"
      />
    </div>
  );
}