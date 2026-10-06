import { db } from '../firebase/config';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  increment,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, GoogleLocation, ScheduledPost } from '../../types';

export interface CloudClientRecord {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  businessName: string;
  locationTitle?: string;
  locality?: string;
  role: string;
  plan: 'Starter' | 'Growth' | 'Enterprise';
  status: 'active' | 'idle' | 'offline';
  lastActiveAt: number;
  createdAt: number;
  totalApiCalls: number;
  totalEstimatedCostInr: number;
}

const LOCAL_CLIENTS_KEY = '@digilocal_cached_clients_directory_v1';

export const FirestoreDatabase = {
  /**
   * Syncs the current client's profile and active location into the central Firestore database.
   */
  async syncClientToCloud(
    user: UserProfile,
    location?: GoogleLocation | null
  ): Promise<CloudClientRecord> {
    const now = Date.now();
    const clientRecord: CloudClientRecord = {
      uid: user.uid || `usr_${Date.now()}`,
      email: user.email || 'client@business.com',
      displayName: user.displayName || 'Business Owner',
      photoURL: user.photoURL || '',
      businessName: location?.title || user.displayName || 'My Business',
      locationTitle: location?.title || '',
      locality: location?.storefrontAddress?.locality || 'India',
      role: (user as any).role || 'owner',
      plan: 'Growth',
      status: 'active',
      lastActiveAt: now,
      createdAt: now,
      totalApiCalls: 1,
      totalEstimatedCostInr: 0.05,
    };

    try {
      // 1. Save to local fallback cache first
      await this.saveLocalClientFallback(clientRecord);

      // 2. Upsert into Firestore 'clients' collection
      if (db) {
        const clientDocRef = doc(db, 'clients', clientRecord.uid);
        await setDoc(clientDocRef, clientRecord, { merge: true });
      }
    } catch (err) {
      console.log('[Firestore] syncClientToCloud offline fallback active:', err);
    }

    return clientRecord;
  },

  /**
   * Fetches all registered clients from Firestore for the Admin Dashboard.
   */
  async fetchAllClients(): Promise<CloudClientRecord[]> {
    try {
      if (db) {
        const clientsColl = collection(db, 'clients');
        const q = query(clientsColl, orderBy('lastActiveAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const list: CloudClientRecord[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as CloudClientRecord);
          });
          // Cache locally
          await AsyncStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(list));
          return list;
        }
      }
    } catch (err) {
      console.log('[Firestore] fetchAllClients falling back to local directory:', err);
    }

    // Fallback to local cached directory
    return this.getLocalClientsFallback();
  },

  /**
   * Mirrors scheduled post to cloud database so posts are safe even if phone switches off.
   */
  async syncPostToCloud(uid: string, post: ScheduledPost): Promise<void> {
    try {
      if (db) {
        const postDocRef = doc(db, 'clients', uid, 'scheduled_posts', post.id);
        await setDoc(postDocRef, {
          ...post,
          syncedAt: Date.now(),
        }, { merge: true });
      }
    } catch (err) {
      console.log('[Firestore] syncPostToCloud offline:', err);
    }
  },

  /**
   * Fetches cloud-saved scheduled posts.
   */
  async fetchCloudPosts(uid: string): Promise<ScheduledPost[]> {
    try {
      if (db) {
        const postsColl = collection(db, 'clients', uid, 'scheduled_posts');
        const snapshot = await getDocs(postsColl);
        const list: ScheduledPost[] = [];
        snapshot.forEach((d) => list.push(d.data() as ScheduledPost));
        return list;
      }
    } catch (err) {
      console.log('[Firestore] fetchCloudPosts offline:', err);
    }
    return [];
  },

  async saveLocalClientFallback(record: CloudClientRecord) {
    try {
      const existing = await this.getLocalClientsFallback();
      const map = new Map<string, CloudClientRecord>();
      for (const c of existing) map.set(c.uid, c);
      map.set(record.uid, record);
      await AsyncStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(Array.from(map.values())));
    } catch {
      // ignore
    }
  },

  async getLocalClientsFallback(): Promise<CloudClientRecord[]> {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_CLIENTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  },

  /**
   * Records every live API telemetry event to Firestore collection 'telemetry'
   */
  async recordApiTelemetry(record: {
    id: string;
    timestamp: number;
    service: string;
    endpoint: string;
    status: number;
    latencyMs: number;
    tokensEstimated?: number;
    costUsd?: number;
    clientEmail?: string;
    clientUid?: string;
  }): Promise<void> {
    try {
      if (db) {
        const costInr = Number(((record.costUsd || 0) * 84).toFixed(3));
        const telDocRef = doc(db, 'telemetry', record.id);
        await setDoc(telDocRef, {
          id: record.id,
          timestamp: record.timestamp,
          service: record.service,
          endpoint: record.endpoint,
          status: record.status,
          latencyMs: record.latencyMs,
          tokensEstimated: record.tokensEstimated || 0,
          costInr,
          clientEmail: record.clientEmail || 'client@business.com',
          clientUid: record.clientUid || 'default_user',
        });

        // Also update client active timestamp and counters in Firestore
        if (record.clientUid && record.clientUid !== 'default_user') {
          const clientRef = doc(db, 'clients', record.clientUid);
          await setDoc(
            clientRef,
            {
              lastActiveAt: Date.now(),
              totalApiCalls: increment(1),
              totalEstimatedCostInr: increment(costInr),
            },
            { merge: true }
          );
        }
      }
    } catch (err) {
      console.log('[Firestore] recordApiTelemetry offline:', err);
    }
  },
};
