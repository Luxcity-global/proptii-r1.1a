import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LandlordAppBridgeProps {
  className?: string;
  style?: React.CSSProperties;
}

const LandlordAppBridge: React.FC<LandlordAppBridgeProps> = ({ className, style }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();
  const landlordPathPrefix = '/landlord';
  const relativeLandlordPath = pathname.startsWith(landlordPathPrefix)
    ? pathname.slice(landlordPathPrefix.length)
    : '';
  const hashPath = relativeLandlordPath && relativeLandlordPath !== '/' ? `#${relativeLandlordPath}` : '';

  // Freeze iframe src after first paint so parent query/path changes do not reload the app.
  const iframeSrcRef = useRef(`/landlord/index.html${search}${hashPath}`);
  const skipParentSyncRef = useRef(false);
  const didInitNavRef = useRef(false);
  const lastDeepLinkKeyRef = useRef('');

  const postToIframe = (message: unknown) => {
    iframeRef.current?.contentWindow?.postMessage(message, '*');
  };

  const postAuthState = () => {
    postToIframe({
      type: 'AUTH_STATE',
      payload: {
        isAuthenticated,
        user,
        isLoading,
      },
    });
  };

  const postDeepLinkFromSearch = (nextSearch: string) => {
    if (!nextSearch) return;
    const params = new URLSearchParams(nextSearch);
    const start = params.get('start');
    const role = params.get('role');
    const startAddPropertyTour = params.get('startAddPropertyTour');
    const startAddTenantTour = params.get('startAddTenantTour');
    if (!start && !role && !startAddPropertyTour && !startAddTenantTour) return;

    const key = nextSearch;
    if (lastDeepLinkKeyRef.current === key) return;
    lastDeepLinkKeyRef.current = key;

    postToIframe({
      type: 'DEEP_LINK',
      payload: { start, role, startAddPropertyTour, startAddTenantTour },
    });
  };

  useEffect(() => {
    if (!search) return;
    const params = new URLSearchParams(search);
    const hasDeepLink =
      params.has('start') ||
      params.has('role') ||
      params.has('startAddPropertyTour') ||
      params.has('startAddTenantTour');
    if (!hasDeepLink) return;

    postDeepLinkFromSearch(search);
    navigate(
      {
        pathname,
        search: '',
        hash: relativeLandlordPath && relativeLandlordPath !== '/' ? relativeLandlordPath : '',
      },
      { replace: true }
    );
  }, [navigate, pathname, relativeLandlordPath, search]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      postAuthState();
      postDeepLinkFromSearch(search);
    };

    iframe.addEventListener('load', handleIframeLoad);
    if (iframe.contentDocument?.readyState === 'complete') {
      handleIframeLoad();
    }

    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
    };
  }, [isAuthenticated, user, isLoading, search]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    if (skipParentSyncRef.current) {
      skipParentSyncRef.current = false;
      return;
    }
    if (!didInitNavRef.current) {
      didInitNavRef.current = true;
      return;
    }
    const path = relativeLandlordPath && relativeLandlordPath !== '/'
      ? relativeLandlordPath
      : '/dashboard';
    iframe.contentWindow.postMessage({
      type: 'NAVIGATE',
      payload: { path },
    }, '*');
  }, [relativeLandlordPath]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; payload?: { path?: string } };
      if (data?.type !== 'PARENT_NAVIGATE' || !data.payload?.path) return;
      const nextPath = data.payload.path;
      if (pathname === nextPath) return;
      skipParentSyncRef.current = true;
      navigate(nextPath);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, pathname]);

  return (
    <iframe
      ref={iframeRef}
      src={iframeSrcRef.current}
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
