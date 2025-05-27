import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from '../App';

// Enable future flags for React Router v7 compatibility
const router = createBrowserRouter([
  {
    path: '*',
    element: <App />
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

export const Router = () => {
  return <RouterProvider router={router} />;
}; 