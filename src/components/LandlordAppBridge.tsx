import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LandlordAppBridgeProps {
  className?: string;
  style?: React.CSSProperties;
}

const LandlordAppBridge: React.FC<LandlordAppBridgeProps> = ({ className, style }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useAuth();

  // Extract the path after /landlord (e.g., /viewings from /landlord/viewings)
  const getLandlordPath = () => {
    const path = location.pathname;
    if (path.startsWith('/landlord')) {
      const landlordPath = path.substring('/landlord'.length) || '/';
      return landlordPath;
    }
    return '/';
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Wait for iframe to load
    const handleIframeLoad = () => {
      const landlordPath = getLandlordPath();
      
      // Send authentication state to landlord app
      const authState = {
        isAuthenticated,
        user,
        isLoading
      };

      iframe.contentWindow?.postMessage({
        type: 'AUTH_STATE',
        payload: authState
      }, '*');

      // Send navigation path to landlord app
      iframe.contentWindow?.postMessage({
        type: 'NAVIGATE',
        payload: { path: landlordPath }
      }, '*');

      console.log('Sent auth state and navigation to landlord app:', { authState, path: landlordPath });
    };

    iframe.addEventListener('load', handleIframeLoad);
    
    // Also send immediately if iframe is already loaded
    if (iframe.contentDocument?.readyState === 'complete') {
      handleIframeLoad();
    }

    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
    };
  }, [isAuthenticated, user, isLoading, location.pathname]);

  // Listen for redirect requests from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our iframe (same origin)
      if (event.data?.type === 'REDIRECT_TO_LOGIN') {
        const redirectPath = event.data.payload?.redirect || window.location.pathname + window.location.search;
        const loginPath = `/login?redirect=${encodeURIComponent(redirectPath)}`;
        console.log('🔒 LandlordAppBridge: Received redirect request from iframe, redirecting to:', loginPath);
        window.location.href = loginPath;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Update iframe src to include the path as a hash or query parameter for initial load
  const iframeSrc = `/landlord/index.html${getLandlordPath() !== '/' ? `#${getLandlordPath()}` : ''}`;

  return (
    <iframe
      ref={iframeRef}
      src={iframeSrc}
      className={className}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        ...style
      }}
      title="Landlord App"
      allow="clipboard-read; clipboard-write"
    />
  );
};

export default LandlordAppBridge;
