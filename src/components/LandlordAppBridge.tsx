import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LandlordAppBridgeProps {
  className?: string;
  style?: React.CSSProperties;
}

const LandlordAppBridge: React.FC<LandlordAppBridgeProps> = ({ className, style }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { pathname, search } = useLocation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const landlordPathPrefix = '/landlord';
  const relativeLandlordPath = pathname.startsWith(landlordPathPrefix)
    ? pathname.slice(landlordPathPrefix.length)
    : '';
  const hashPath = relativeLandlordPath && relativeLandlordPath !== '/' ? `#${relativeLandlordPath}` : '';
  const iframeSrc = `/landlord/index.html${search}${hashPath}`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Wait for iframe to load
    const handleIframeLoad = () => {
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

      console.log('Sent auth state to landlord app:', authState);
    };

    iframe.addEventListener('load', handleIframeLoad);
    
    // Also send immediately if iframe is already loaded
    if (iframe.contentDocument?.readyState === 'complete') {
      handleIframeLoad();
    }

    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
    };
  }, [isAuthenticated, user, isLoading]);

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