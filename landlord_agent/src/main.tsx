  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { initPerformanceMonitoring } from "./utils/performance-monitor";

  initPerformanceMonitoring();

  createRoot(document.getElementById("root")!).render(<App />);
  