import { SafeStorage } from '../../utils/safeStorage';
import { FirestoreDatabase } from '../database/firestoreService';

export type ApiServiceType = 'gemini_ai' | 'google_gmb' | 'seo_audit' | 'n8n_webhook' | 'firestore';

export interface ApiTelemetryRecord {
  id: string;
  timestamp: number; // Epoch ms
  service: ApiServiceType;
  endpoint: string;
  status: number; // HTTP status code
  latencyMs: number;
  tokensEstimated?: number;
  costUsd: number;
  cached?: boolean;
  clientEmail?: string;
  clientUid?: string;
}

export interface ServiceBreakdown {
  service: ApiServiceType;
  displayName: string;
  callCount: number;
  totalCostUsd: number;
  totalCostInr: number;
  avgLatencyMs: number;
  color: string;
}

export interface DailyActivityPoint {
  dateLabel: string; // e.g. "29 Sep", "30 Sep", "01 Oct"
  timestamp: number;
  callCount: number;
  costInr: number;
}

const STORAGE_KEY = '@digilocal_api_telemetry_records_v1';
const MAX_LOCAL_RECORDS = 60;
const USD_TO_INR_RATE = 84.0; // Current standard conversion

// Real unit pricing based on official API rates (Google GMB is 100% free from Google)
const UNIT_COSTS: Record<ApiServiceType, number> = {
  gemini_ai: 0.00015, // Gemini 2.5 Flash input/output token cost
  google_gmb: 0.0, // Google Business Profile API is 100% FREE (Google Cloud does not charge)
  seo_audit: 0.0, // Live public HTTP website check (0 API cost)
  n8n_webhook: 0.0, // Webhook automation dispatch (0 API cost)
  firestore: 0.00006, // Firestore database document read/write
};

class ApiTrackerService {
  private inMemoryRecords: ApiTelemetryRecord[] = [];
  private isLoaded = false;
  private currentClientEmail = '';
  private currentClientUid = '';

  constructor() {
    this.loadFromStorage();
  }

  public setClientContext(uid: string, email: string) {
    this.currentClientUid = uid;
    this.currentClientEmail = email;
  }

  private async loadFromStorage() {
    try {
      const raw = await SafeStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.inMemoryRecords = JSON.parse(raw);
      }
      this.isLoaded = true;
    } catch {
      this.inMemoryRecords = [];
      this.isLoaded = true;
    }
  }

  private async saveToStorage() {
    try {
      // Keep most recent records
      const trimmed = this.inMemoryRecords.slice(-MAX_LOCAL_RECORDS);
      await SafeStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore storage write error
    }
  }

  public recordCall(params: {
    service: ApiServiceType;
    endpoint: string;
    status: number;
    latencyMs: number;
    tokensEstimated?: number;
    cached?: boolean;
    costUsd?: number;
  }): ApiTelemetryRecord {
    const baseCost =
      params.costUsd ?? (params.cached ? 0 : (UNIT_COSTS[params.service] ?? 0));
    const record: ApiTelemetryRecord = {
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      service: params.service,
      endpoint: params.endpoint,
      status: params.status,
      latencyMs: Math.max(1, params.latencyMs),
      tokensEstimated: params.tokensEstimated,
      costUsd: baseCost,
      cached: Boolean(params.cached),
      clientEmail: this.currentClientEmail || 'client@business.com',
      clientUid: this.currentClientUid || 'default_user',
    };

    this.inMemoryRecords.push(record);
    this.saveToStorage();
    // Mirror record to Firestore for live Admin Web Portal
    FirestoreDatabase.recordApiTelemetry(record).catch(() => {});
    return record;
  }

  public async getRecentRecords(limit = 50): Promise<ApiTelemetryRecord[]> {
    if (!this.isLoaded) await this.loadFromStorage();
    return [...this.inMemoryRecords].reverse().slice(0, limit);
  }

  public async getTelemetrySummary(): Promise<{
    totalCalls: number;
    totalCostUsd: number;
    totalCostInr: number;
    averageLatencyMs: number;
    cacheHitRatio: number;
    serviceBreakdowns: ServiceBreakdown[];
    dailyTrend: DailyActivityPoint[];
  }> {
    if (!this.isLoaded) await this.loadFromStorage();

    const records = this.inMemoryRecords;
    const totalCalls = records.length;

    let totalCostUsd = 0;
    let totalLatencyMs = 0;
    let cachedCount = 0;

    const serviceMap: Record<ApiServiceType, { count: number; cost: number; latency: number }> = {
      gemini_ai: { count: 0, cost: 0, latency: 0 },
      google_gmb: { count: 0, cost: 0, latency: 0 },
      seo_audit: { count: 0, cost: 0, latency: 0 },
      n8n_webhook: { count: 0, cost: 0, latency: 0 },
      firestore: { count: 0, cost: 0, latency: 0 },
    };

    for (const r of records) {
      totalCostUsd += r.costUsd || 0;
      totalLatencyMs += r.latencyMs || 0;
      if (r.cached) cachedCount++;

      if (serviceMap[r.service]) {
        serviceMap[r.service].count++;
        serviceMap[r.service].cost += r.costUsd || 0;
        serviceMap[r.service].latency += r.latencyMs || 0;
      }
    }

    const averageLatencyMs = totalCalls > 0 ? Math.round(totalLatencyMs / totalCalls) : 0;
    const cacheHitRatio = totalCalls > 0 ? Number(((cachedCount / totalCalls) * 100).toFixed(1)) : 0;

    const serviceMeta: Record<ApiServiceType, { name: string; color: string }> = {
      gemini_ai: { name: 'Gemini AI Engine', color: '#8B5CF6' },
      google_gmb: { name: 'Google GMB API', color: '#2563EB' },
      seo_audit: { name: 'SEO & Domain Audits', color: '#10B981' },
      n8n_webhook: { name: 'n8n Automations', color: '#F59E0B' },
      firestore: { name: 'Cloud Firestore DB', color: '#EC4899' },
    };

    const serviceBreakdowns: ServiceBreakdown[] = Object.keys(serviceMap).map((key) => {
      const sKey = key as ApiServiceType;
      const data = serviceMap[sKey];
      return {
        service: sKey,
        displayName: serviceMeta[sKey].name,
        callCount: data.count,
        totalCostUsd: Number(data.cost.toFixed(4)),
        totalCostInr: Number((data.cost * USD_TO_INR_RATE).toFixed(2)),
        avgLatencyMs: data.count > 0 ? Math.round(data.latency / data.count) : 0,
        color: serviceMeta[sKey].color,
      };
    });

    // Generate 7-Day Trend based on actual records
    const now = new Date();
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dailyTrend: DailyActivityPoint[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const startMs = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0, 0).getTime();
      const endMs = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999).getTime();

      const dayRecords = records.filter((r) => r.timestamp >= startMs && r.timestamp <= endMs);
      const dayCostUsd = dayRecords.reduce((sum, r) => sum + (r.costUsd || 0), 0);

      dailyTrend.push({
        dateLabel: `${dayDate.getDate()} ${shortMonths[dayDate.getMonth()]}`,
        timestamp: startMs,
        callCount: dayRecords.length,
        costInr: Number((dayCostUsd * USD_TO_INR_RATE).toFixed(2)),
      });
    }

    return {
      totalCalls,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      totalCostInr: Number((totalCostUsd * USD_TO_INR_RATE).toFixed(2)),
      averageLatencyMs,
      cacheHitRatio,
      serviceBreakdowns,
      dailyTrend,
    };
  }

  public async clearTelemetry() {
    this.inMemoryRecords = [];
    await SafeStorage.removeItem(STORAGE_KEY);
  }
}

export const ApiTracker = new ApiTrackerService();
