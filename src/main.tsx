import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';

import theme from './theme/theme';
import { ErrorBoundary } from './utils/errorHandler';
import { Router } from './config/routerConfig';

// Ensure the application sticks strictly to the Proptii light brand theme
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
}

// Render the React tree immediately — the page paints before any async work.
const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
);

// Background init — none of this blocks the first paint.
(async () => {
  try {


    // Start keep-alive ping loop so production backend never spins down
    const { startKeepAlivePing } = await import('./services/keepAlive');
    startKeepAlivePing();

    // Only load the ~200 KB App Insights SDK when explicitly enabled.
    if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true') {
      const { initPerformanceMonitoring } = await import('./utils/performanceMonitor');
      await initPerformanceMonitoring();
    }
  } catch (err) {
    console.error('[main] Background init error:', err);
  }
})();
