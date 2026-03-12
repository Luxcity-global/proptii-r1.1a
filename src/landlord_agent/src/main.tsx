
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { AnalyticsProvider } from "../../components/analytics/AnalyticsProvider";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename="/landlord">
    <AnalyticsProvider>
      <App />
    </AnalyticsProvider>
  </BrowserRouter>
);
