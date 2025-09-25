import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../App';
import { WelcomePage } from '../components/welcome-page';
import { Dashboard } from '../components/dashboard';
import { SocialMediaAssets } from '../components/social-media-assets';
import { WriteContent } from '../components/write-content';
import { PropertyMarketing } from '../components/property-marketing';
import { CreateCampaign } from '../components/create-campaign';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <WelcomePage />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'social-media-assets',
        element: <SocialMediaAssets />
      },
      {
        path: 'write-content',
        element: <WriteContent />
      },
      {
        path: 'property-marketing',
        element: <PropertyMarketing />
      },
      {
        path: 'create-campaign',
        element: <CreateCampaign />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
