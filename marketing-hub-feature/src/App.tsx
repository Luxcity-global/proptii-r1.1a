import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./components/header";
import { Copilot } from "./components/copilot";
import { Toaster } from "./components/ui/sonner";
import { MainSkipLinks } from "./components/skip-link";
import { ThemeProvider } from "./contexts/theme-context";

export default function App() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const location = useLocation();

  const handleOpenCopilot = () => {
    setIsCopilotOpen(true);
  };

  const handleCloseCopilot = () => {
    setIsCopilotOpen(false);
  };

  const handleCopilotComplete = () => {
    // Optionally refresh data or update state when copilot completes
    setIsCopilotOpen(false);
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="marketing-hub-theme">
      <div className="min-h-screen bg-lux-cream-200 flex flex-col">
        <MainSkipLinks />
        {location.pathname !== "/" && <Header onOpenCopilot={handleOpenCopilot} />}
        
        <main id="main-content" className="flex-1" role="main" aria-label="Main content">
          <Outlet context={{ onOpenCopilot: handleOpenCopilot }} />
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
    </ThemeProvider>
  );
}