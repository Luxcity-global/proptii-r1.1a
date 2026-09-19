import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getAccessTokenForApiRequest } from '../../services/msalAccessToken';
import { useAuth } from '../../contexts/AuthContext';

export interface CampaignLead {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: string;
  propertyCount?: string;
  timeSinks?: string[];
  adminHours?: string;
  biggestGain?: string;
  frustration?: string | null;
  activated?: boolean;
  submittedAt?: string | null;
  activatedAt?: string | null;
}

export const CampaignLeadsAdmin: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activated' | 'pending'>('all');
  const [selectedLead, setSelectedLead] = useState<CampaignLead | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState<boolean>(false);

  const apiBase = useMemo(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return '';
      }
    }
    const envUrl = (
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_NEST_API_ENDPOINT ||
      import.meta.env.VITE_API_ENDPOINT ||
      ''
    ).trim().replace(/\/api\/?$/, '').replace(/\/$/, '');

    if (envUrl && !/localhost|127\.0\.0\.1/i.test(envUrl)) {
      return envUrl;
    }
    return 'https://proptii-r1-1a-1-hcw6.onrender.com';
  }, []);

  // Check admin authorization with the server using the verified Firebase token
  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated || !user) {
      setIsAdmin(false);
      return;
    }

    const verifyAdmin = async () => {
      setCheckingAdmin(true);
      try {
        const token = (await getAccessTokenForApiRequest()) || '';
        const res = await fetch(`${apiBase}/api/leads/auth/check`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setIsAdmin(Boolean(data?.isAdmin));
          }
        } else {
          if (!cancelled) {
            setIsAdmin(false);
          }
        }
      } catch (err) {
        console.error('Failed to verify admin status with backend:', err);
        if (!cancelled) {
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingAdmin(false);
        }
      }
    };

    verifyAdmin();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, apiBase]);

  const handleGoogleLogin = async () => {
    setLoggingIn(true);
    setLoginError(null);
    try {
      await login();
    } catch (err: any) {
      console.error('Admin Google sign-in failed:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setLoginError(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsAdmin(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = (await getAccessTokenForApiRequest()) || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiBase}/api/leads?limit=100`, { headers });
      if (!res.ok) {
        if (res.status === 403) {
          setIsAdmin(false);
          throw new Error('Access denied (403): You are not authorized to view campaign leads.');
        }
        throw new Error(`Failed to fetch leads (status ${res.status}: ${res.statusText})`);
      }
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError(err?.message || 'Could not load campaign leads. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLeads();
    } else if (isAdmin === false) {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const token = (await getAccessTokenForApiRequest()) || '';
      const res = await fetch(`${apiBase}/api/leads/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proptii-campaign-leads-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback: generate CSV client-side from currently loaded leads
        exportClientCsv();
      }
    } catch {
      exportClientCsv();
    } finally {
      setExporting(false);
    }
  };

  const exportClientCsv = () => {
    const headers = [
      'id',
      'submittedAt',
      'name',
      'phone',
      'email',
      'role',
      'propertyCount',
      'timeSinks',
      'adminHours',
      'biggestGain',
      'frustration',
      'activated',
      'activatedAt',
    ];
    const rows = leads.map((l) => [
      l.id,
      l.submittedAt || '',
      l.name || '',
      l.phone || '',
      l.email || '',
      l.role || '',
      l.propertyCount || '',
      (l.timeSinks || []).join(' | '),
      l.adminHours || '',
      l.biggestGain || '',
      (l.frustration || '').replace(/[\r\n,]/g, ' '),
      l.activated ? 'yes' : 'no',
      l.activatedAt || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `proptii-leads-client-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalLeads = leads.length;
  const activatedLeads = leads.filter((l) => l.activated || l.email).length;
  const activationRate = totalLeads > 0 ? Math.round((activatedLeads / totalLeads) * 100) : 0;

  const roleCounts = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const r = l.role || 'Unspecified';
      map[r] = (map[r] || 0) + 1;
    });
    return map;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchTerm ||
        (lead.name && lead.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.phone && lead.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.role && lead.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.id && lead.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.propertyCount && lead.propertyCount.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.adminHours && lead.adminHours.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.biggestGain && lead.biggestGain.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.frustration && lead.frustration.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.timeSinks && lead.timeSinks.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesRole =
        selectedRole === 'all' || (lead.role && lead.role.toLowerCase() === selectedRole.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'activated' && (lead.activated || lead.email)) ||
        (statusFilter === 'pending' && !lead.activated && !lead.email);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [leads, searchTerm, selectedRole, statusFilter]);

  // 1. Auth Loading or Admin Verification state
  if (authLoading || (isAuthenticated && checkingAdmin)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-24 pb-16">
          <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-200 max-w-sm w-full mx-4">
            <div className="w-10 h-10 border-4 border-[#DC5F12] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-800">Verifying Admin Privileges</h3>
            <p className="text-xs text-slate-500 mt-1">Checking server authorization...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Google Sign In Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24 pb-16">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#DC5F12] flex items-center justify-center mx-auto mb-5 shadow-sm border border-orange-100">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-[#DC5F12] mb-3">
              Protected Administrator Area
            </span>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Sign In</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              This dashboard contains confidential questionnaire feedback and prospect contact details. Please sign in with your authorized administrator Google account.
            </p>

            {loginError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-left">
                {loginError}
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loggingIn}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-300 shadow-sm transition active:scale-[0.98] disabled:opacity-60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loggingIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated but Unauthorized (backend verified isAdmin: false)
  if (isAuthenticated && isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24 pb-16">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-red-100 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5 border border-red-200">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 mb-3">
              Access Restricted (403)
            </span>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Administrator Privileges Required</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              You are signed in as <strong className="text-slate-800">{user?.email || 'authenticated account'}</strong>. This account does not possess administrative privileges to view campaign leads.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow transition"
              >
                Sign Out & Switch Account
              </button>
              <Link
                to="/"
                className="text-xs text-slate-500 hover:text-slate-800 py-2 font-medium transition"
              >
                &larr; Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Live Firestore Sync
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                Admin: {user?.email}
              </span>
              <span className="text-xs text-slate-400 font-mono">collection: campaign_leads</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Campaign & Welcome Leads
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time insights captured from the interactive questionnaire and 1-month free trial unboxing flow.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="/campaign"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition"
              title="Open the questionnaire frontend"
            >
              <span>Preview /campaign</span>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href="/welcome"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition"
              title="Open the welcome unboxing landing"
            >
              <span>Preview /welcome</span>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button
              onClick={handleExportCsv}
              disabled={exporting || leads.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#136C9E] rounded-lg shadow hover:bg-[#0f557d] disabled:opacity-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm transition"
              title="Refresh leads"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-red-600 hover:border-red-200 transition"
              title="Sign out of admin session"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Submissions</span>
              <span className="p-2 bg-blue-50 text-[#136C9E] rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900">{totalLeads}</div>
              <p className="text-xs text-slate-400 mt-1">Questionnaire completions</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activated Trials</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900 flex items-baseline gap-2">
                {activatedLeads}
                <span className="text-sm font-bold text-emerald-600">({activationRate}%)</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Attached email in welcome modal</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Persona</span>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-lg font-bold text-slate-900 truncate">
                {Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} respondents
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reward Conversion</span>
              <span className="p-2 bg-orange-50 text-[#DC5F12] rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-lg font-bold text-[#DC5F12]">1-Month VIP Free Trial</div>
              <p className="text-xs text-slate-400 mt-1">Offered upon unboxing</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by email, role, pain points, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136C9E]/30 focus:border-[#136C9E] transition"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'}`}
              >
                All ({leads.length})
              </button>
              <button
                onClick={() => setStatusFilter('activated')}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'activated' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:text-slate-900'}`}
              >
                Activated ({activatedLeads})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-sm' : 'hover:text-slate-900'}`}
              >
                Pending ({totalLeads - activatedLeads})
              </button>
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136C9E]/30 text-slate-700"
            >
              <option value="all">All Roles</option>
              {Object.keys(roleCounts).map((r) => (
                <option key={r} value={r}>
                  {r} ({roleCounts[r]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={fetchLeads}
              className="text-xs font-bold underline hover:text-red-900 ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* Leads Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Date & ID</th>
                  <th scope="col" className="py-3.5 px-4">Card 1: Contact & Status</th>
                  <th scope="col" className="py-3.5 px-4">Cards 2 & 3: Role & Portfolio</th>
                  <th scope="col" className="py-3.5 px-4">Card 4: Time Sinks</th>
                  <th scope="col" className="py-3.5 px-4">Card 5: Admin Hrs</th>
                  <th scope="col" className="py-3.5 px-4">Cards 6 & 7: Gain / Frustration</th>
                  <th scope="col" className="py-3.5 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-[#136C9E] border-t-transparent rounded-full animate-spin" />
                        <span>Loading campaign leads...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-slate-600 font-semibold">No campaign leads found</p>
                        <p className="text-xs text-slate-400">Try changing your search or filter settings, or test the funnel at /campaign</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isActivated = lead.activated || Boolean(lead.email);
                    const formattedDate = lead.submittedAt
                      ? new Date(lead.submittedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : 'Recently';

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50/75 transition cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{formattedDate}</div>
                          <div className="text-xs text-slate-400 font-mono truncate max-w-[120px]">
                            {lead.id}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            {lead.name && (
                              <div className="font-semibold text-slate-900 text-sm">
                                {lead.name}
                              </div>
                            )}
                            <div className="text-xs text-slate-700 font-mono">
                              {lead.email || <span className="text-slate-400 italic">No email</span>}
                            </div>
                            {lead.phone && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                📞 {lead.phone}
                              </div>
                            )}
                            <div className="mt-1">
                              {isActivated ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Activated
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Unclaimed Token
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{lead.role || 'Not specified'}</div>
                          <div className="text-xs text-slate-400">
                            {lead.propertyCount ? `${lead.propertyCount} properties` : 'N/A'}
                          </div>
                        </td>

                        <td className="py-4 px-4 max-w-xs truncate">
                          {lead.timeSinks && lead.timeSinks.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {lead.timeSinks.slice(0, 2).map((ts, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                                >
                                  {ts}
                                </span>
                              ))}
                              {lead.timeSinks.length > 2 && (
                                <span className="text-[11px] text-slate-400 self-center">
                                  +{lead.timeSinks.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">None selected</span>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{lead.adminHours || '—'}</span>
                        </td>

                        <td className="py-4 px-4 max-w-xs truncate">
                          <div className="font-medium text-slate-900 text-xs truncate" title={lead.biggestGain || ''}>
                            {lead.biggestGain || <span className="text-slate-400 italic">—</span>}
                          </div>
                          {lead.frustration ? (
                            <div className="text-[11px] text-slate-500 italic truncate mt-0.5" title={lead.frustration}>
                              "{lead.frustration}"
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic mt-0.5">
                              No note
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                            }}
                            className="text-xs font-semibold text-[#136C9E] hover:text-[#0f557d] hover:underline"
                          >
                            View details &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Detail Modal */}
        {selectedLead && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedLead(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">ID: {selectedLead.id}</span>
                    {selectedLead.activated || selectedLead.email ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Trial Activated
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Pending Email Activation
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                    {selectedLead.name || selectedLead.email || 'Anonymous Lead'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* 7 Questionnaire Cards Mapping */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#136C9E] uppercase tracking-wider">Card 01 • Contact Information</span>
                      {selectedLead.email ? (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Captured</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Missing</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block">Full Name</span>
                        <div className="text-sm font-bold text-slate-900">
                          {selectedLead.name || <span className="text-slate-400 font-normal italic">None provided</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block">Email Address</span>
                        <div className="text-sm font-bold text-slate-900 break-all font-mono">
                          {selectedLead.email || <span className="text-slate-400 font-normal italic">None provided</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block">Phone Number</span>
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {selectedLead.phone || <span className="text-slate-400 font-normal italic">None provided</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] font-bold text-[#136C9E] uppercase tracking-wider block mb-1.5">Card 02 • Professional Role</span>
                    <div className="text-sm font-bold text-slate-800">
                      {selectedLead.role || 'Not specified'}
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] font-bold text-[#136C9E] uppercase tracking-wider block mb-1.5">Card 03 • Properties Managed / Owned</span>
                    <div className="text-sm font-bold text-slate-800">
                      {selectedLead.propertyCount ? `${selectedLead.propertyCount} properties` : 'Not specified'}
                    </div>
                  </div>

                  {/* Card 5 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] font-bold text-[#136C9E] uppercase tracking-wider block mb-1.5">Card 05 • Avoidable Admin Hours / Wk</span>
                    <div className="text-sm font-bold text-slate-800">
                      {selectedLead.adminHours || 'Not specified'}
                    </div>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-[#136C9E] uppercase tracking-wider block mb-2">Card 04 • Top Time Sinks (Up to 3)</span>
                  {selectedLead.timeSinks && selectedLead.timeSinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.timeSinks.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#136C9E] border border-blue-100 shadow-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No time sinks selected.</p>
                  )}
                </div>

                {/* Card 6 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-[#136C9E] uppercase tracking-wider block mb-1.5">Card 06 • Highest Value Desired Gain</span>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedLead.biggestGain || 'Not specified'}
                  </p>
                </div>

                {/* Card 7 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-[#136C9E] uppercase tracking-wider block mb-1.5">Card 07 • Most Frustrating Task (Feedback)</span>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {selectedLead.frustration || 'No additional frustration details provided.'}
                  </p>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div>
                    Submitted: <strong className="text-slate-700">{selectedLead.submittedAt ? new Date(selectedLead.submittedAt).toLocaleString() : 'N/A'}</strong>
                  </div>
                  {selectedLead.activatedAt && (
                    <div className="text-emerald-700 font-medium">
                      ✓ Trial activated on {new Date(selectedLead.activatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CampaignLeadsAdmin;
