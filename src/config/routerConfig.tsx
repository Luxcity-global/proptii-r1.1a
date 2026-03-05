import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from '../App';
import { AnalyticsProvider } from '../components/analytics/AnalyticsProvider';

// Enable future flags for React Router v7 compatibility
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <AnalyticsProvider>
        <App />
      </AnalyticsProvider>
    ),
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

export const Router = () => {
  return <RouterProvider router={router} />;
}; 