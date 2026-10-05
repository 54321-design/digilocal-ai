import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiTracker,
  ApiTelemetryRecord,
  ServiceBreakdown,
  DailyActivityPoint,
} from '../services/telemetry/apiTracker';
import { LoadBalancer } from '../services/gateway/loadBalancer';
import { FirestoreDatabase, CloudClientRecord } from '../services/database/firestoreService';
import { useAuth } from './AuthContext';

export interface AdminTelemetryState {
  totalCalls: number;
  totalCostUsd: number;
  totalCostInr: number;
  averageLatencyMs: number;
  cacheHitRatio: number;
  serviceBreakdowns: ServiceBreakdown[];
  dailyTrend: DailyActivityPoint[];
}

interface GatewayDiagnostics {
  activeConnections: number;
  queuedRequests: number;
  memoryCacheEntries: number;
  maxConcurrency: number;
  circuitBreakers: Array<{
    service: string;
    isOpen: boolean;
    cooldownRemainingSec: number;
  }>;
}

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  telemetry: AdminTelemetryState;
  recentCalls: ApiTelemetryRecord[];
  clients: CloudClientRecord[];
  diagnostics: GatewayDiagnostics;
  unlockAdmin: (passcode: string) => Promise<boolean>;
  lockAdmin: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
  clearTelemetryLogs: () => Promise<void>;
}

const ADMIN_PASSCODE = '360999'; // Secure Master Admin PIN for DigiBirds 360°
const ADMIN_STORAGE_KEY = '@digibirds_admin_unlocked_session_v1';
const ADMIN_EMAILS = ['localdigi@gmail.com', 'admin@digibirds360.com'];

const defaultTelemetry: AdminTelemetryState = {
  totalCalls: 0,
  totalCostUsd: 0,
  totalCostInr: 0,
  averageLatencyMs: 0,
  cacheHitRatio: 0,
  serviceBreakdowns: [],
  dailyTrend: [],
};

const defaultDiagnostics: GatewayDiagnostics = {
  activeConnections: 0,
  queuedRequests: 0,
  memoryCacheEntries: 0,
  maxConcurrency: 4,
  circuitBreakers: [],
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<AdminTelemetryState>(defaultTelemetry);
  const [recentCalls, setRecentCalls] = useState<ApiTelemetryRecord[]>([]);
  const [clients, setClients] = useState<CloudClientRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<GatewayDiagnostics>(defaultDiagnostics);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    setIsLoading(true);
    try {
      // 1. Check if user email is explicitly an admin
      if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        setIsAdmin(true);
        await loadTelemetryData();
        setIsLoading(false);
        return;
      }

      // 2. Check if admin session was previously unlocked on device
      const stored = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored === 'unlocked_true') {
        setIsAdmin(true);
        await loadTelemetryData();
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTelemetryData = async () => {
    try {
      const [sum, recs, clientList] = await Promise.all([
        ApiTracker.getTelemetrySummary(),
        ApiTracker.getRecentRecords(40),
        FirestoreDatabase.fetchAllClients(),
      ]);
      setTelemetry(sum);
      setRecentCalls(recs);
      setClients(clientList);
      setDiagnostics(LoadBalancer.getGatewayDiagnostics());
    } catch (e) {
      console.log('Error loading admin telemetry:', e);
    }
  };

  const unlockAdmin = async (passcode: string): Promise<boolean> => {
    if (passcode.trim() === ADMIN_PASSCODE) {
      setIsAdmin(true);
      await AsyncStorage.setItem(ADMIN_STORAGE_KEY, 'unlocked_true');
      await loadTelemetryData();
      return true;
    }
    return false;
  };

  const lockAdmin = async () => {
    setIsAdmin(false);
    await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  const refreshAdminData = async () => {
    setIsLoading(true);
    await loadTelemetryData();
    setIsLoading(false);
  };

  const clearTelemetryLogs = async () => {
    await ApiTracker.clearTelemetry();
    await loadTelemetryData();
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isLoading,
        telemetry,
        recentCalls,
        clients,
        diagnostics,
        unlockAdmin,
        lockAdmin,
        refreshAdminData,
        clearTelemetryLogs,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
