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
  deleteDoc,
} from 'firebase/firestore';
import { SafeStorage } from '../../utils/safeStorage';
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
          await SafeStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(list));
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
   * Multi-Tenant Business Cloud Sync:
   * Syncs post to isolated business collection: businesses/{businessId}/posts/{postId}
   * Only authorized members of this business can read/write this.
   */
  async syncPostToBusinessCloud(businessId: string, post: ScheduledPost): Promise<void> {
    try {
      if (db && businessId) {
        const postDocRef = doc(db, 'businesses', businessId, 'posts', post.id);
        await setDoc(
          postDocRef,
          {
            ...post,
            businessId,
            syncedAt: Date.now(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.log('[Firestore] syncPostToBusinessCloud note:', err);
    }
  },

  /**
   * Fetches cloud posts for a specific isolated business tenant.
   */
  async fetchBusinessCloudPosts(businessId: string): Promise<ScheduledPost[]> {
    try {
      if (db && businessId) {
        const postsColl = collection(db, 'businesses', businessId, 'posts');
        const snapshot = await getDocs(postsColl);
        const list: ScheduledPost[] = [];
        snapshot.forEach((d) => list.push(d.data() as ScheduledPost));
        return list;
      }
    } catch (err) {
      console.log('[Firestore] fetchBusinessCloudPosts note:', err);
    }
    return [];
  },

  /**
   * Deletes a post from the isolated business collection.
   */
  async deletePostFromBusinessCloud(businessId: string, postId: string): Promise<void> {
    try {
      if (db && businessId) {
        const postDocRef = doc(db, 'businesses', businessId, 'posts', postId);
        await deleteDoc(postDocRef);
      }
    } catch (err) {
      console.log('[Firestore] deletePostFromBusinessCloud note:', err);
    }
  },

  /**
   * Role-Based Access Control: Add an employee / team member to the business.
   */
  async addBusinessMember(
    businessId: string,
    member: {
      userId?: string;
      email: string;
      displayName: string;
      role: 'admin' | 'manager' | 'staff';
      addedBy?: string;
    }
  ): Promise<void> {
    try {
      if (db && businessId) {
        const memberId = member.userId || `mem_${member.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
        const memberDocRef = doc(db, 'businesses', businessId, 'members', memberId);
        await setDoc(
          memberDocRef,
          {
            ...member,
            userId: memberId,
            joinedAt: Date.now(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.log('[Firestore] addBusinessMember note:', err);
    }
  },

  /**
   * Remove an employee's access from the business.
   */
  async removeBusinessMember(businessId: string, memberId: string): Promise<void> {
    try {
      if (db && businessId) {
        const memberDocRef = doc(db, 'businesses', businessId, 'members', memberId);
        await deleteDoc(memberDocRef);
      }
    } catch (err) {
      console.log('[Firestore] removeBusinessMember note:', err);
    }
  },

  /**
   * Fetches all authorized members of the business.
   */
  async fetchBusinessMembers(businessId: string): Promise<any[]> {
    try {
      if (db && businessId) {
        const membersColl = collection(db, 'businesses', businessId, 'members');
        const snapshot = await getDocs(membersColl);
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        return list;
      }
    } catch (err) {
      console.log('[Firestore] fetchBusinessMembers note:', err);
    }
    return [];
  },

  /**
   * Legacy mirror for backwards compatibility
   */
  async syncPostToCloud(uid: string, post: ScheduledPost): Promise<void> {
    return this.syncPostToBusinessCloud(uid, post);
  },

  async fetchCloudPosts(uid: string): Promise<ScheduledPost[]> {
    return this.fetchBusinessCloudPosts(uid);
  },

  async saveLocalClientFallback(record: CloudClientRecord) {
    try {
      const existing = await this.getLocalClientsFallback();
      const map = new Map<string, CloudClientRecord>();
      for (const c of existing) map.set(c.uid, c);
      map.set(record.uid, record);
      await SafeStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(Array.from(map.values())));
    } catch {
      // ignore
    }
  },

  async getLocalClientsFallback(): Promise<CloudClientRecord[]> {
    try {
      const raw = await SafeStorage.getItem(LOCAL_CLIENTS_KEY);
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
