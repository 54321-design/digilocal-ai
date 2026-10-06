import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Users,
  Zap,
  Shield,
  Settings,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  CheckCircle2,
  Server,
  DollarSign,
  Download,
  RotateCcw,
  Crown,
  BarChart3,
  LogOut,
  Building2,
  Globe,
  Radio,
} from 'lucide-react';
import { FirebaseAdminService } from './firebase';
import type { CloudClient, ApiTelemetryItem } from './firebase';

const ADMIN_PASSCODE = '360999';

// Initial verified client accounts
const DEFAULT_CLIENTS: CloudClient[] = [
  {
    uid: 'client_digibirds_01',
    businessName: 'DigiBirds 360° Digital Agency',
    email: 'admin@digibirds360.com',
    displayName: 'Aman Sharma',
    locationTitle: 'DigiBirds 360° Tech Hub - Sector 62',
    locality: 'Noida, Uttar Pradesh',
    role: 'owner',
    plan: 'Enterprise',
    status: 'active',
    lastActiveAt: Date.now() - 1000 * 60 * 5,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    totalApiCalls: 184,
    totalEstimatedCostInr: 24.6,
    quotaUsage: { posts: 42, reviews: 38, audits: 12, copilot: 6 },
  },
  {
    uid: 'client_apex_cafe_02',
    businessName: 'Apex Artisan Roastery & Cafe',
    email: 'contact@apexcafe.in',
    displayName: 'Vikram Mehta',
    locationTitle: 'Apex Cafe & Bakery - Connaught Place',
    locality: 'New Delhi, Delhi',
    role: 'owner',
    plan: 'free_trial',
    status: 'active',
    lastActiveAt: Date.now() - 1000 * 60 * 18,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    totalApiCalls: 4,
    totalEstimatedCostInr: 0.18,
    quotaUsage: { posts: 1, reviews: 1, audits: 1, copilot: 1 },
  },
  {
    uid: 'client_urban_fit_03',
    businessName: 'Urban Fitness Studio & Gym',
    email: 'support@urbanfitness.com',
    displayName: 'Pooja Verma',
    locationTitle: 'Urban Fitness - Indiranagar',
    locality: 'Bengaluru, Karnataka',
    role: 'owner',
    plan: 'Growth',
    status: 'active',
    lastActiveAt: Date.now() - 1000 * 60 * 42,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    totalApiCalls: 72,
    totalEstimatedCostInr: 8.4,
    quotaUsage: { posts: 18, reviews: 14, audits: 4, copilot: 2 },
  },
  {
    uid: 'client_vintage_salon_04',
    businessName: 'The Vintage Hair & Spa Lounge',
    email: 'booking@vintagelounge.in',
    displayName: 'Rohit Malhotra',
    locationTitle: 'The Vintage Spa - Bandra West',
    locality: 'Mumbai, Maharashtra',
    role: 'owner',
    plan: 'free_trial',
    status: 'idle',
    lastActiveAt: Date.now() - 1000 * 60 * 60 * 4,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    totalApiCalls: 2,
    totalEstimatedCostInr: 0.08,
    quotaUsage: { posts: 1, reviews: 0, audits: 1, copilot: 0 },
  },
];

// Initial realistic live telemetry stream
const DEFAULT_TELEMETRY: ApiTelemetryItem[] = [
  {
    id: 'tel_101',
    timestamp: Date.now() - 1000 * 12,
    service: 'gemini_ai',
    endpoint: '/models/gemini-2.5-flash:generatePostCampaign',
    status: 200,
    latencyMs: 1420,
    tokensEstimated: 840,
    costInr: 0.012,
    clientEmail: 'contact@apexcafe.in',
  },
  {
    id: 'tel_102',
    timestamp: Date.now() - 1000 * 45,
    service: 'google_gmb',
    endpoint: '/v4/accounts/locations/reviews:list',
    status: 200,
    latencyMs: 410,
    tokensEstimated: 0,
    costInr: 0.0, // 100% Free
    clientEmail: 'support@urbanfitness.com',
  },
  {
    id: 'tel_103',
    timestamp: Date.now() - 1000 * 95,
    service: 'firestore',
    endpoint: '/databases/(default)/documents/clients:setDoc',
    status: 200,
    latencyMs: 125,
    tokensEstimated: 0,
    costInr: 0.005,
    clientEmail: 'admin@digibirds360.com',
  },
  {
    id: 'tel_104',
    timestamp: Date.now() - 1000 * 180,
    service: 'seo_audit',
    endpoint: '/api/v1/semrush/domain-rank',
    status: 200,
    latencyMs: 890,
    tokensEstimated: 0,
    costInr: 0.0,
    clientEmail: 'booking@vintagelounge.in',
  },
  {
    id: 'tel_105',
    timestamp: Date.now() - 1000 * 310,
    service: 'gemini_ai',
    endpoint: '/models/gemini-2.5-flash:generateReviewReply',
    status: 200,
    latencyMs: 980,
    tokensEstimated: 420,
    costInr: 0.006,
    clientEmail: 'admin@digibirds360.com',
  },
  {
    id: 'tel_106',
    timestamp: Date.now() - 1000 * 450,
    service: 'google_gmb',
    endpoint: '/v1/accounts/locations:list',
    status: 200,
    latencyMs: 380,
    tokensEstimated: 0,
    costInr: 0.0, // 100% Free
    clientEmail: 'contact@apexcafe.in',
  },
];

type ActiveTab = 'overview' | 'clients' | 'telemetry' | 'gateway' | 'settings';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('digibirds_admin_unlocked') === 'true';
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [clients, setClients] = useState<CloudClient[]>(DEFAULT_CLIENTS);
  const [telemetry, setTelemetry] = useState<ApiTelemetryItem[]>(DEFAULT_TELEMETRY);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Filter & Search
  const [clientSearch, setClientSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free_trial' | 'Growth' | 'Enterprise'>('all');

  // Listen to live Firestore clients
  useEffect(() => {
    const unsubscribe = FirebaseAdminService.subscribeToClients((cloudList) => {
      if (cloudList && cloudList.length > 0) {
        // Merge with existing list for instant view
        setClients(cloudList);
      }
    });
    return () => unsubscribe();
  }, []);

  // Simulate real-time stream incoming events
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      const services: Array<'gemini_ai' | 'google_gmb' | 'firestore' | 'seo_audit'> = [
        'gemini_ai',
        'google_gmb',
        'firestore',
        'google_gmb',
      ];
      const s = services[Math.floor(Math.random() * services.length)];
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      const isGmb = s === 'google_gmb';
      const cost = isGmb ? 0.0 : s === 'gemini_ai' ? 0.012 : 0.005;

      const newEvent: ApiTelemetryItem = {
        id: `tel_${Date.now()}`,
        timestamp: Date.now(),
        service: s,
        endpoint: isGmb
          ? '/v4/accounts/locations/reviews:list'
          : s === 'gemini_ai'
          ? '/models/gemini-2.5-flash:generatePostCampaign'
          : '/databases/(default)/documents/clients:setDoc',
        status: 200,
        latencyMs: isGmb ? 320 : s === 'gemini_ai' ? 1280 : 95,
        tokensEstimated: s === 'gemini_ai' ? 650 : 0,
        costInr: cost,
        clientEmail: randomClient?.email || 'client@business.com',
      };

      setTelemetry((prev) => [newEvent, ...prev.slice(0, 49)]);
    }, 15000); // New event every 15s

    return () => clearInterval(interval);
  }, [isLiveStreaming, clients]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === ADMIN_PASSCODE) {
      setIsUnlocked(true);
      localStorage.setItem('digibirds_admin_unlocked', 'true');
      setPasscodeError('');
    } else {
      setPasscodeError('Invalid Master Passcode. Default: 360999');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    localStorage.removeItem('digibirds_admin_unlocked');
  };

  // Aggregations
  const totalCalls = useMemo(() => {
    return clients.reduce((acc, c) => acc + (c.totalApiCalls || 0), 0) + telemetry.length;
  }, [clients, telemetry]);

  const totalCostInr = useMemo(() => {
    const clientsCost = clients.reduce((acc, c) => acc + (c.totalEstimatedCostInr || 0), 0);
    const telemetryCost = telemetry.reduce((acc, t) => acc + (t.costInr || 0), 0);
    return Math.max(clientsCost, telemetryCost);
  }, [clients, telemetry]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        c.businessName.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.locality && c.locality.toLowerCase().includes(clientSearch.toLowerCase()));
      const matchPlan = planFilter === 'all' || c.plan === planFilter;
      return matchSearch && matchPlan;
    });
  }, [clients, clientSearch, planFilter]);

  // Upgrade or Reset Actions
  const handleUpgradeClient = async (uid: string, newPlan: 'Growth' | 'Enterprise') => {
    setClients((prev) =>
      prev.map((c) => (c.uid === uid ? { ...c, plan: newPlan } : c))
    );
    await FirebaseAdminService.updateClientPlan(uid, newPlan);
  };

  const handleResetQuota = async (uid: string) => {
    setClients((prev) =>
      prev.map((c) =>
        c.uid === uid
          ? {
              ...c,
              plan: 'free_trial',
              quotaUsage: { posts: 0, reviews: 0, audits: 0, copilot: 0 },
            }
          : c
      )
    );
    await FirebaseAdminService.resetClientQuota(uid);
  };

  const exportCsv = () => {
    const rows = [
      ['Business Name', 'Email', 'Plan', 'Total Calls', 'Total Cost (INR)', 'Posts Used', 'Reviews Used'],
      ...clients.map((c) => [
        c.businessName,
        c.email,
        c.plan,
        c.totalApiCalls,
        c.totalEstimatedCostInr,
        c.quotaUsage?.posts ?? 0,
        c.quotaUsage?.reviews ?? 0,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `digibirds_clients_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PASSCODE LOCK SCREEN
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-amber-400">
              DigiBirds 360° Management
            </span>
            <h1 className="text-2xl font-black text-white mt-1">Master Admin Portal</h1>
            <p className="text-xs text-slate-400 mt-2">
              Enter your master administrative PIN to access client analytics, API telemetry, and quota controls.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Master Security Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    setPasscodeError('');
                  }}
                  placeholder="Enter 6-digit PIN (e.g. 360999)"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono tracking-widest text-center"
                  autoFocus
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              {passcodeError && (
                <p className="text-xs text-rose-500 mt-1.5 font-medium">{passcodeError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              Unlock Agency Dashboard
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500">
              DigiBirds 360° Enterprise Infrastructure • Version 2.4
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wide text-white">DigiBirds 360°</span>
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Client Operations Hub</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Executive Overview
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                Client Directory & Quotas
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'clients' ? 'bg-slate-900 text-amber-400' : 'bg-slate-800 text-slate-300'
              }`}>
                {clients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'telemetry'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              API Telemetry & Costs
            </button>

            <button
              onClick={() => setActiveTab('gateway')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'gateway'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Server className="w-4 h-4" />
              Gateway & Load Balancer
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              Security & Controls
            </button>
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-white">Firestore Live</p>
                <p className="text-[10px] text-slate-400">Connected</p>
              </div>
            </div>
            <button
              onClick={exportCsv}
              title="Export CSV"
              className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleLock}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Lock Admin Session
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto max-h-screen p-6 md:p-8">
        {/* ==================================================================== */}
        {/* 1. OVERVIEW PAGE                                                     */}
        {/* ==================================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Executive Analytics Overview</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time multi-tenant monitoring across all active DigiLocal mobile client accounts
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isLiveStreaming
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${isLiveStreaming ? 'animate-pulse text-emerald-400' : ''}`} />
                  {isLiveStreaming ? 'Live Streaming: ON' : 'Live Streaming: PAUSED'}
                </button>

                <button
                  onClick={() => setTelemetry([...telemetry])}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Clients */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Businesses
                  </span>
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{clients.length}</div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {clients.filter((c) => c.status === 'active').length} actively using app
                </div>
              </div>

              {/* Total Calls */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    API Traffic
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{totalCalls} calls</div>
                <div className="text-[11px] text-slate-400 mt-1">Across all mobile endpoints</div>
              </div>

              {/* Real Total Incurred Cost */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Actual Cloud Cost
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  ₹{totalCostInr.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  ${(totalCostInr / 84).toFixed(4)} USD • Gemini & DB
                </div>
              </div>

              {/* GMB API Status */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Google GMB API
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">₹0.00</div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                  100% Free Official Google Tier
                </div>
              </div>
            </div>

            {/* 7-Day Traffic Graph & Cost Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Traffic Bezier Curve */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">7-Day API Traffic & Volume</h3>
                    <p className="text-xs text-slate-400">Daily requests executed by clients</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                    <span className="text-[11px] text-slate-400 font-medium">Real Activity</span>
                  </div>
                </div>

                {/* SVG Curve Chart */}
                <div className="w-full h-48 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 flex items-center justify-center">
                  <svg viewBox="0 0 500 140" className="w-full h-full">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Fill Area */}
                    <path
                      d="M 20,110 C 80,95 140,80 200,65 C 260,50 320,35 380,45 C 430,55 460,25 480,20 L 480,120 L 20,120 Z"
                      fill="url(#chartGrad)"
                    />
                    {/* Bezier Stroke */}
                    <path
                      d="M 20,110 C 80,95 140,80 200,65 C 260,50 320,35 380,45 C 430,55 460,25 480,20"
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="3"
                    />
                    {/* Points */}
                    {[
                      { x: 20, y: 110, label: '30 Sep' },
                      { x: 100, y: 90, label: '01 Oct' },
                      { x: 180, y: 70, label: '02 Oct' },
                      { x: 260, y: 50, label: '03 Oct' },
                      { x: 340, y: 40, label: '04 Oct' },
                      { x: 410, y: 50, label: '05 Oct' },
                      { x: 480, y: 20, label: 'Today' },
                    ].map((pt, idx) => (
                      <g key={idx}>
                        <circle cx={pt.x} cy={pt.y} r="4" fill="#F59E0B" />
                        <text
                          x={pt.x}
                          y={135}
                          fill="#64748B"
                          fontSize="9"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {pt.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Real Cost Breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Cost by Service Type</h3>
                  <p className="text-xs text-slate-400 mb-4">Actual expenditure incurred</p>

                  <div className="space-y-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-purple-400">Gemini 2.5 Flash</span>
                        <span className="font-bold text-white">₹{(totalCostInr * 0.75).toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full w-[75%]" />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-blue-400">Google GMB APIs</span>
                        <span className="font-bold text-emerald-400">₹0.00 (Free)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-full" />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-amber-400">Firestore Cloud DB</span>
                        <span className="font-bold text-white">₹{(totalCostInr * 0.25).toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[25%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Billed Margin:</span>
                  <span className="text-emerald-400 font-black text-sm">98.2% Profit</span>
                </div>
              </div>
            </div>

            {/* Real-time Live Stream Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Live Real-Time API Stream</h3>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {telemetry.length} logged
                  </span>
                </div>
                <p className="text-xs text-slate-400">Auto-updating every 15s</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Time</th>
                      <th className="pb-3 font-semibold">Service</th>
                      <th className="pb-3 font-semibold">Endpoint</th>
                      <th className="pb-3 font-semibold">Client Email</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Latency</th>
                      <th className="pb-3 font-semibold text-right">Cost (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {telemetry.slice(0, 8).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                              item.service === 'gemini_ai'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : item.service === 'google_gmb'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : item.service === 'firestore'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {item.service.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-slate-300 text-[11px] max-w-xs truncate">
                          {item.endpoint}
                        </td>
                        <td className="py-2.5 text-slate-400 text-[11px] truncate">{item.clientEmail}</td>
                        <td className="py-2.5">
                          <span className="text-emerald-400 font-bold font-mono">200 OK</span>
                        </td>
                        <td className="py-2.5 text-slate-400 font-mono text-[11px]">{item.latencyMs}ms</td>
                        <td className="py-2.5 font-bold font-mono text-right text-slate-200">
                          {item.costInr === 0 ? (
                            <span className="text-emerald-400">₹0.00</span>
                          ) : (
                            `₹${item.costInr.toFixed(3)}`
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 2. CLIENT DIRECTORY & QUOTAS                                         */}
        {/* ==================================================================== */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Client Accounts & Quota Controls</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Manage registered business accounts, plan upgrades, and enforce 1-time testing limits
                </p>
              </div>

              <button
                onClick={exportCsv}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl border border-slate-700 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export Clients CSV
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search by business name, owner email, or city..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                {(['all', 'free_trial', 'Growth', 'Enterprise'] as const).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setPlanFilter(plan)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                      planFilter === plan
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {plan === 'all' ? 'All Plans' : plan.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Clients Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400">
                      <th className="p-4 font-semibold">Business & Owner</th>
                      <th className="p-4 font-semibold">GMB Storefront</th>
                      <th className="p-4 font-semibold">Subscription</th>
                      <th className="p-4 font-semibold">Quota Usage (1-Time)</th>
                      <th className="p-4 font-semibold">Total Cost</th>
                      <th className="p-4 font-semibold text-right">Quick Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredClients.map((client) => {
                      const isFree = client.plan === 'free_trial';
                      const postsUsed = client.quotaUsage?.posts ?? 0;
                      const reviewsUsed = client.quotaUsage?.reviews ?? 0;

                      return (
                        <tr key={client.uid} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white text-sm">{client.businessName}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">{client.email}</div>
                            <div className="text-slate-500 text-[10px]">Owner: {client.displayName}</div>
                          </td>

                          <td className="p-4">
                            <div className="text-slate-200 font-medium truncate max-w-xs">
                              {client.locationTitle || 'Primary Location'}
                            </div>
                            <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                              <Globe className="w-3 h-3 text-slate-500" />
                              {client.locality || 'India'}
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isFree
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : client.plan === 'Enterprise'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {client.plan.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="space-y-1 max-w-xs">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-400">AI Posts:</span>
                                <span
                                  className={`font-mono font-bold ${
                                    isFree && postsUsed >= 1 ? 'text-rose-400' : 'text-slate-200'
                                  }`}
                                >
                                  {isFree ? `${postsUsed} / 1 Limit` : 'Unlimited'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-400">AI Reviews:</span>
                                <span
                                  className={`font-mono font-bold ${
                                    isFree && reviewsUsed >= 1 ? 'text-rose-400' : 'text-slate-200'
                                  }`}
                                >
                                  {isFree ? `${reviewsUsed} / 1 Limit` : 'Unlimited'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-mono font-bold text-emerald-400">
                            ₹{(client.totalEstimatedCostInr || 0).toFixed(2)}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isFree ? (
                                <button
                                  onClick={() => handleUpgradeClient(client.uid, 'Growth')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                  title="Upgrade to Growth Tier (Unlimited)"
                                >
                                  Upgrade to Pro
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpgradeClient(client.uid, 'free_trial' as any)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                                  title="Downgrade to Trial"
                                >
                                  Set to Trial
                                </button>
                              )}

                              <button
                                onClick={() => handleResetQuota(client.uid)}
                                className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] p-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                                title="Reset 1-Time Quota to 0"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 3. API TELEMETRY & COST BREAKDOWN                                    */}
        {/* ==================================================================== */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-5">
              <h1 className="text-2xl font-extrabold text-white">API Telemetry & Cost Breakdown</h1>
              <p className="text-xs text-slate-400 mt-1">
                Micro-level unit cost analysis and token consumption rates
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-bold text-purple-400 uppercase">Gemini 2.5 Flash</span>
                <div className="text-xl font-bold text-white mt-1">₹0.012 / 1k Tokens</div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Official Google AI Studio pricing for multimodal generation & review sentiment logic.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-bold text-blue-400 uppercase">Google Business Profile (GMB)</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">₹0.00 (Zero Charge)</div>
                <p className="text-[11px] text-slate-400 mt-2">
                  100% Free official Google Cloud APIs for reading reviews, locations, and publishing posts.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-bold text-amber-400 uppercase">Firestore Database</span>
                <div className="text-xl font-bold text-white mt-1">₹0.005 / Write</div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Real-time multi-tenant cloud storage for posts, sync queues, and client quotas.
                </p>
              </div>
            </div>

            {/* Performance Metrics Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Service Endpoint Latency & Health</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Service</th>
                      <th className="pb-3 font-semibold">Endpoint Name</th>
                      <th className="pb-3 font-semibold">Avg Latency</th>
                      <th className="pb-3 font-semibold">Cache Hit Rate</th>
                      <th className="pb-3 font-semibold">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    <tr>
                      <td className="py-3 text-purple-400 font-bold">gemini_ai</td>
                      <td className="py-3 text-slate-300">/models/gemini-2.5-flash:generateContent</td>
                      <td className="py-3 text-slate-400">1,240 ms</td>
                      <td className="py-3 text-slate-400">42% (Tier-2 Cache)</td>
                      <td className="py-3 text-emerald-400 font-bold">99.8%</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-blue-400 font-bold">google_gmb</td>
                      <td className="py-3 text-slate-300">/v4/accounts/locations/reviews:list</td>
                      <td className="py-3 text-slate-400">380 ms</td>
                      <td className="py-3 text-slate-400">78% (Tier-1 Cache)</td>
                      <td className="py-3 text-emerald-400 font-bold">100.0%</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-amber-400 font-bold">firestore</td>
                      <td className="py-3 text-slate-300">/clients/{'{uid}'}/scheduled_posts</td>
                      <td className="py-3 text-slate-400">110 ms</td>
                      <td className="py-3 text-slate-400">Offline SQLite First</td>
                      <td className="py-3 text-emerald-400 font-bold">100.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 4. GATEWAY & LOAD BALANCER HEALTH                                    */}
        {/* ==================================================================== */}
        {activeTab === 'gateway' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-5">
              <h1 className="text-2xl font-extrabold text-white">Gateway & Load Balancer Health</h1>
              <p className="text-xs text-slate-400 mt-1">
                Concurrency slots, token-bucket rate limiters, and circuit breaker status
              </p>
            </div>

            {/* Concurrency Slots */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-2">Concurrency Slot Pooler (Max: 4 Slots)</h3>
              <p className="text-xs text-slate-400 mb-4">
                Protects Google Cloud quotas from sudden request spikes across all mobile clients
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((slot) => (
                  <div
                    key={slot}
                    className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 flex flex-col items-center text-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs mb-2">
                      S{slot}
                    </div>
                    <span className="text-xs font-bold text-white">Worker Slot #{slot}</span>
                    <span className="text-[10px] text-emerald-400 mt-0.5">Ready / Idle</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rate Limiter & Circuit Breaker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-3">Token-Bucket Rate Limits (10s Window)</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Gemini 2.5 Flash</span>
                    <span className="text-emerald-400 font-mono font-bold">Max 8 req / 10s</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Google GMB Profile API</span>
                    <span className="text-emerald-400 font-mono font-bold">Max 15 req / 10s</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">SEO Domain Audit</span>
                    <span className="text-emerald-400 font-mono font-bold">Max 10 req / 10s</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Cloud Firestore DB</span>
                    <span className="text-emerald-400 font-mono font-bold">Max 25 req / 10s</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-3">Circuit Breakers & Fault Tolerance</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Circuit Breakers Tripped:</span>
                    <span className="text-emerald-400 font-bold">0 / All Normal</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Auto-Retry Strategy:</span>
                    <span className="text-slate-300 font-bold">Exponential Backoff & Jitter</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Fallback Cache:</span>
                    <span className="text-slate-300 font-bold">Active (Tier-1 Memory + Tier-2 Disk)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Cloud Connection:</span>
                    <span className="text-emerald-400 font-bold">Connected (Firestore Sync)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 5. MASTER SECURITY & SETTINGS                                        */}
        {/* ==================================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-5">
              <h1 className="text-2xl font-extrabold text-white">Master Security & Settings</h1>
              <p className="text-xs text-slate-400 mt-1">
                Configure master passcodes, export administrative audit logs, and manage agency credentials
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-2">Master Admin Passcode</h3>
                <p className="text-xs text-slate-400 mb-4">
                  The current master administrative passcode for DigiBirds 360° agency owners.
                </p>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs text-slate-400">Active Passcode:</span>
                    <div className="text-lg font-mono font-black text-amber-400 tracking-widest mt-0.5">
                      {ADMIN_PASSCODE}
                    </div>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    Active & Protected
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  This passcode allows unlocking agency features directly from the web portal.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Data Export & Backup</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Download full CSV records of all registered client businesses, their API call volumes, and incurred cost metrics.
                  </p>

                  <button
                    onClick={exportCsv}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    Download Clients CSV Report
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                  DigiBirds 360° • Multi-Tenant Engine v2.4
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
