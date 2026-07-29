import React from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  PoundSterling,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { Card } from './ui/card';
import { LandlordEmptyState } from './LandlordEmptyState';
import { LandlordNewUserEmptyState } from './LandlordNewUserEmptyState';
import type { LandlordEmptyPageId } from '../utils/landlordEmptyPageTypes';

export type { LandlordEmptyPageId };

interface LandlordPageEmptyShellProps {
  page: LandlordEmptyPageId;
  variant: 'guest' | 'new-user';
  onSignIn?: () => void;
  onAddProperty?: () => void;
  userName?: string;
}

const PAGE_HEADERS: Record<
  LandlordEmptyPageId,
  { title: string; subtitle: string }
> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Sign in to manage your portfolio',
  },
  properties: {
    title: 'Properties',
    subtitle: 'Manage all your properties in one place',
  },
  documents: {
    title: 'Documents',
    subtitle: 'Manage and track compliance across all your properties',
  },
  viewings: {
    title: 'Viewings',
    subtitle: 'Manage property viewing requests and bookings',
  },
  contracts: {
    title: 'Contracts',
    subtitle: 'Manage your property contracts and agreements',
  },
  clients: {
    title: 'Your Tenants',
    subtitle: 'Manage your tenants and landlords',
  },
  insights: {
    title: 'Analytics',
    subtitle: 'Portfolio performance and market insights',
  },
};

const NEW_USER_SUBTITLES: Record<LandlordEmptyPageId, string> = {
  dashboard: 'Build your portfolio one step at a time',
  properties: 'Manage all your properties in one place',
  documents: 'Manage and track compliance across all your properties',
  viewings: 'Manage property viewing requests and bookings',
  contracts: 'Manage your property contracts and agreements',
  clients: 'Manage your tenants and landlords',
  insights: 'Portfolio performance and market insights',
};

function StatCards({ page }: { page: LandlordEmptyPageId }) {
  switch (page) {
    case 'dashboard':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Total Properties</p>
                <p className="text-lg font-semibold">0</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 flex-1">
                <div className="text-center">
                  <p className="text-muted-foreground mb-1 text-sm">Occupied</p>
                  <p className="text-lg font-semibold text-green-600">0</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="text-center">
                  <p className="text-muted-foreground mb-1 text-sm">Vacant</p>
                  <p className="text-lg font-semibold text-orange-600">0</p>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Monthly rental revenue</p>
                <p className="text-lg font-semibold">£0</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <PoundSterling className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Document Alerts</p>
                <p className="text-lg font-semibold text-orange-600">0</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      );

    case 'properties':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Occupied</p><p className="text-2xl font-semibold text-green-600">0</p></div><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-green-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1">Average Rent</p><p className="text-2xl font-semibold">£0</p><p className="text-xs text-muted-foreground">Per month</p></div><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><PoundSterling className="w-6 h-6 text-blue-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1">Tenancies Ending Soon</p><p className="text-2xl font-semibold text-orange-600">0</p><p className="text-xs text-muted-foreground">Within 90 days</p></div><div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><Calendar className="w-6 h-6 text-orange-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1">Overdue Rent</p><p className="text-2xl font-semibold text-red-600">0</p><p className="text-xs text-muted-foreground">£0 outstanding</p></div><div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div></div></Card>
        </div>
      );

    case 'documents':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1">Total Documents</p><p className="text-2xl font-semibold">0</p></div><div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-primary" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1">Valid Documents</p><p className="text-2xl font-semibold text-green-600">0</p></div><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1">Expiring Soon</p><p className="text-2xl font-semibold text-orange-600">0</p></div><div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><Clock className="w-6 h-6 text-orange-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1">Expired</p><p className="text-2xl font-semibold text-red-600">0</p></div><div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div></div></Card>
        </div>
      );

    case 'viewings':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Pending Requests</p><p className="text-2xl font-semibold">0</p></div><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Mail className="w-6 h-6 text-blue-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Scheduled Viewings</p><p className="text-2xl font-semibold">0</p></div><div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><Calendar className="w-6 h-6 text-orange-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Completed Viewings</p><p className="text-2xl font-semibold">0</p></div><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Cancelled Viewings</p><p className="text-2xl font-semibold">0</p></div><div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><X className="w-6 h-6 text-red-600" /></div></div></Card>
        </div>
      );

    case 'contracts':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Sent Contracts</p><p className="text-2xl font-semibold">0</p></div><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-blue-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Contracts expiring soon</p><p className="text-2xl font-semibold text-orange-600">0</p></div><div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-orange-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Pending Signature</p><p className="text-2xl font-semibold text-yellow-600">0</p></div><div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center"><Clock className="w-6 h-6 text-yellow-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Signed Contracts</p><p className="text-2xl font-semibold text-green-600">0</p></div><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div></div></Card>
        </div>
      );

    case 'clients':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1">Total Tenants</p><p className="text-2xl font-semibold">0</p><p className="text-xs text-muted-foreground">0 current, 0 overdue</p></div><div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1">Rent Arrears</p><p className="text-2xl font-semibold text-red-600">£0</p><p className="text-xs text-muted-foreground">0 tenants behind</p></div><div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1">Leases Expiring</p><p className="text-2xl font-semibold text-orange-600">0</p><p className="text-xs text-muted-foreground">Next 3 months</p></div><div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><Clock className="w-6 h-6 text-orange-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1">Avg Risk Score</p><p className="text-2xl font-semibold text-green-600">0%</p><p className="text-xs text-muted-foreground">Default risk level</p></div><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Shield className="w-6 h-6 text-green-600" /></div></div></Card>
        </div>
      );

    case 'insights':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Total Properties</p><p className="text-2xl font-semibold">0</p></div><div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center"><Building2 className="w-6 h-6 text-primary" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Occupancy Rate</p><p className="text-2xl font-semibold">0%</p></div><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-green-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Monthly Revenue</p><p className="text-2xl font-semibold">£0</p></div><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><PoundSterling className="w-6 h-6 text-blue-600" /></div></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground mb-1 text-sm">Avg Yield</p><p className="text-2xl font-semibold">0%</p></div><div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-orange-600" /></div></div></Card>
        </div>
      );

    default:
      return null;
  }
}

export function LandlordPageEmptyShell({
  page,
  variant,
  onSignIn,
  onAddProperty,
  userName,
}: LandlordPageEmptyShellProps) {
  const header = PAGE_HEADERS[page];
  const subtitle =
    variant === 'new-user' ? NEW_USER_SUBTITLES[page] : header.subtitle;

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: '#F7F7F7' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="mb-6">
          <h1
            className="text-xl sm:text-2xl font-semibold mb-1"
            style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}
          >
            {header.title}
          </h1>
          <p
            className="text-gray-600 text-sm"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            {subtitle}
          </p>
        </div>

        <StatCards page={page} />

        {variant === 'guest' ? (
          <LandlordEmptyState onSignIn={onSignIn} />
        ) : (
          <LandlordNewUserEmptyState
            page={page}
            onAddProperty={onAddProperty}
            userName={userName}
          />
        )}
      </div>
    </div>
  );
}
