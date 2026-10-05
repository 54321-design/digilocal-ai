import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type QuotaFeatureKey =
  | 'post_generation'
  | 'review_reply'
  | 'seo_audit'
  | 'copilot_plan';

export interface QuotaUsageState {
  post_generation: number;
  review_reply: number;
  seo_audit: number;
  copilot_plan: number;
  totalApiCalls: number;
  plan: 'free_trial' | 'growth' | 'enterprise' | 'admin';
  lastUpdatedAt: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  currentCount: number;
  maxLimit: number;
  feature: QuotaFeatureKey;
  message?: string;
  isExceeded: boolean;
  isAdmin: boolean;
}

const STORAGE_KEY = '@digilocal_client_feature_usage_v1';
const ADMIN_STORAGE_KEY = '@digibirds_admin_unlocked_session_v1';

// Strict 1-time limit for free trial testing
export const FREE_TRIAL_LIMITS: Record<QuotaFeatureKey, number> = {
  post_generation: 1, // 1 free post generation
  review_reply: 1,    // 1 free AI review reply
  seo_audit: 1,       // 1 free SEO / domain audit fetch
  copilot_plan: 1,    // 1 free AI Copilot roadmap
};

export const UPGRADE_PROMPT_MESSAGE = 'Upgrade to generate post or fetch anything';

const defaultUsage: QuotaUsageState = {
  post_generation: 0,
  review_reply: 0,
  seo_audit: 0,
  copilot_plan: 0,
  totalApiCalls: 0,
  plan: 'free_trial',
  lastUpdatedAt: Date.now(),
};

class QuotaService {
  private inMemoryCache: QuotaUsageState | null = null;

  /**
   * Retrieves current usage state from memory or persistent storage.
   */
  public async getUsage(clientUid?: string): Promise<QuotaUsageState> {
    if (this.inMemoryCache) {
      return this.inMemoryCache;
    }

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.inMemoryCache = { ...defaultUsage, ...JSON.parse(raw) };
        return this.inMemoryCache!;
      }
    } catch (err) {
      console.log('[QuotaService] Error reading storage:', err);
    }

    // Try cloud sync if UID provided
    if (clientUid && db) {
      try {
        const snap = await getDoc(doc(db, 'clients', clientUid, 'quota', 'usage'));
        if (snap.exists()) {
          const cloudData = snap.data() as QuotaUsageState;
          this.inMemoryCache = { ...defaultUsage, ...cloudData };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.inMemoryCache));
          return this.inMemoryCache;
        }
      } catch (err) {
        console.log('[QuotaService] Error fetching cloud quota:', err);
      }
    }

    this.inMemoryCache = { ...defaultUsage };
    return this.inMemoryCache;
  }

  /**
   * Checks if an action is allowed for the client.
   * Admin users bypass all limits.
   * Free-tier users are blocked after 1 execution.
   */
  public async canPerformAction(
    feature: QuotaFeatureKey,
    isAdminUser: boolean = false,
    clientUid?: string
  ): Promise<QuotaCheckResult> {
    // 1. Check if admin session is active
    let isAdmin = isAdminUser;
    if (!isAdmin) {
      try {
        const adminSession = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
        if (adminSession === 'unlocked_true') {
          isAdmin = true;
        }
      } catch {}
    }

    const usage = await this.getUsage(clientUid);

    // Paid or Admin plans have no restrictions
    if (isAdmin || usage.plan === 'growth' || usage.plan === 'enterprise' || usage.plan === 'admin') {
      return {
        allowed: true,
        currentCount: usage[feature] || 0,
        maxLimit: 999999,
        feature,
        isExceeded: false,
        isAdmin: true,
      };
    }

    const currentCount = usage[feature] || 0;
    const maxLimit = FREE_TRIAL_LIMITS[feature] ?? 1;

    if (currentCount >= maxLimit) {
      return {
        allowed: false,
        currentCount,
        maxLimit,
        feature,
        message: UPGRADE_PROMPT_MESSAGE,
        isExceeded: true,
        isAdmin: false,
      };
    }

    return {
      allowed: true,
      currentCount,
      maxLimit,
      feature,
      isExceeded: false,
      isAdmin: false,
    };
  }

  /**
   * Increments the usage count for a feature and persists to local storage and Firestore.
   */
  public async recordUsage(feature: QuotaFeatureKey, clientUid?: string): Promise<QuotaUsageState> {
    const usage = await this.getUsage(clientUid);
    const updated: QuotaUsageState = {
      ...usage,
      [feature]: (usage[feature] || 0) + 1,
      totalApiCalls: (usage.totalApiCalls || 0) + 1,
      lastUpdatedAt: Date.now(),
    };

    this.inMemoryCache = updated;

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.log('[QuotaService] Error saving local quota:', err);
    }

    // Sync to Firestore
    if (clientUid && db) {
      try {
        const quotaRef = doc(db, 'clients', clientUid, 'quota', 'usage');
        await setDoc(quotaRef, updated, { merge: true });

        // Also update client main document for Admin view
        const clientRef = doc(db, 'clients', clientUid);
        await setDoc(
          clientRef,
          {
            totalApiCalls: updated.totalApiCalls,
            quotaUsage: {
              posts: updated.post_generation,
              reviews: updated.review_reply,
              audits: updated.seo_audit,
              copilot: updated.copilot_plan,
            },
            lastActiveAt: Date.now(),
          },
          { merge: true }
        );
      } catch (err) {
        console.log('[QuotaService] Firestore quota sync offline:', err);
      }
    }

    return updated;
  }

  /**
   * Upgrades the plan to paid or admin.
   */
  public async upgradePlan(
    plan: 'growth' | 'enterprise' | 'admin',
    clientUid?: string
  ): Promise<void> {
    const usage = await this.getUsage(clientUid);
    const updated: QuotaUsageState = {
      ...usage,
      plan,
      lastUpdatedAt: Date.now(),
    };
    this.inMemoryCache = updated;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (clientUid && db) {
      try {
        await setDoc(doc(db, 'clients', clientUid), { plan }, { merge: true });
        await setDoc(doc(db, 'clients', clientUid, 'quota', 'usage'), updated, { merge: true });
      } catch (err) {
        console.log('[QuotaService] Plan upgrade cloud sync error:', err);
      }
    }
  }

  /**
   * Resets quotas (useful for admin testing).
   */
  public async resetQuotas(clientUid?: string): Promise<void> {
    this.inMemoryCache = { ...defaultUsage, lastUpdatedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.inMemoryCache));

    if (clientUid && db) {
      try {
        await setDoc(doc(db, 'clients', clientUid, 'quota', 'usage'), this.inMemoryCache, {
          merge: true,
        });
      } catch {}
    }
  }
}

export const ClientQuotaService = new QuotaService();
