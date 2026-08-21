import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import landlordUserService from '../../services/landlordUserService';
import { AccountTypePickerModal } from '../AccountTypePickerModal';
import { LandlordGettingStartedModal } from '../LandlordGettingStartedModal';
import {
  clearAccountPickerNeeded,
  clearLandlordNextSteps,
  consumePendingPostAuth,
  hasPendingLandlordNextSteps,
  hasPendingPostAuth,
  isGenericPostAuthPath,
  landlordDashboardPath,
  markAccountPickerNeeded,
  markLandlordNextStepsNeeded,
  needsAccountPicker,
  persistAccountType,
  resolvePostAuthAction,
  type AccountType,
} from '../../utils/accountType';

const SKIP_PREFIXES = [
  '/billing',
  '/signup',
  '/pricing',
  '/dashboard',
  '/agent',
  '/referencing',
  '/contracts',
  '/bookviewing',
  '/search',
  '/listings',
  '/unauthorized',
];

export const PostAuthAccountGate: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const handledSessionRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const [showPicker, setShowPicker] = useState(() => needsAccountPicker());
  const [showNextSteps, setShowNextSteps] = useState(() => hasPendingLandlordNextSteps());

  useEffect(() => {
    if (isAuthenticated) return;
    if (needsAccountPicker() || hasPendingLandlordNextSteps()) return;
    handledSessionRef.current = null;
    inFlightRef.current = false;
    setShowPicker(false);
    setShowNextSteps(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (needsAccountPicker()) setShowPicker(true);
    if (hasPendingLandlordNextSteps()) setShowNextSteps(true);
  }, [location.pathname]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (!user?.email) return;

    if (needsAccountPicker()) {
      setShowPicker(true);
      return;
    }
    if (hasPendingLandlordNextSteps()) {
      setShowNextSteps(true);
      consumePendingPostAuth();
      return;
    }

    const pathname = location.pathname;
    if (pathname === '/landlord' || pathname.startsWith('/landlord/')) {
      consumePendingPostAuth();
      return;
    }
    if (SKIP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return;
    }
    if (!isGenericPostAuthPath(pathname)) {
      return;
    }

    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath && !isGenericPostAuthPath(redirectPath)) {
      return;
    }

    if (!hasPendingPostAuth()) {
      return;
    }

    const sessionKey = user.email;
    if (handledSessionRef.current === sessionKey || inFlightRef.current) return;
    inFlightRef.current = true;

    let cancelled = false;
    resolvePostAuthAction(user.email).then((result) => {
      if (cancelled) return;
      handledSessionRef.current = sessionKey;

      if (result.action === 'landlord-dashboard') {
        consumePendingPostAuth();
        setShowPicker(false);
        navigate(landlordDashboardPath(result.role), { replace: true });
        return;
      }

      if (result.action === 'show-picker') {
        markAccountPickerNeeded();
        setShowPicker(true);
        if (pathname === '/login') {
          navigate('/', { replace: true });
        }
        return;
      }

      consumePendingPostAuth();
      setShowPicker(false);
      if (pathname === '/login') {
        navigate('/', { replace: true });
      }
    }).catch(() => {
      if (!cancelled) {
        handledSessionRef.current = null;
      }
    }).finally(() => {
      inFlightRef.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, user?.email, location.pathname, navigate]);

  const handleSelect = (type: AccountType) => {
    persistAccountType(type, user?.email);
    clearAccountPickerNeeded();
    consumePendingPostAuth();
    setShowPicker(false);
    handledSessionRef.current = user?.email || user?.id || 'authenticated';

    if (type === 'renter') {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (user?.email && user?.name) {
      void landlordUserService.upsertLandlordUser(user.email, {
        name: user.name,
        role: type,
        phone: user.phone,
      });
    }

    markLandlordNextStepsNeeded();
    setShowNextSteps(true);
    navigate(landlordDashboardPath(type), { replace: true });
  };

  const finishNextSteps = (path: string) => {
    clearLandlordNextSteps();
    setShowNextSteps(false);
    navigate(path, { replace: true });
  };

  return (
    <>
      <AccountTypePickerModal isOpen={showPicker} onSelect={handleSelect} />
      <LandlordGettingStartedModal
        isOpen={showNextSteps && !showPicker}
        onGoToDashboard={() => finishNextSteps('/landlord')}
        onAddProperty={() => finishNextSteps('/landlord?start=property-setup-step1')}
        onSetupCompanyProfile={() => finishNextSteps('/landlord?start=company-profile-setup')}
      />
    </>
  );
};
