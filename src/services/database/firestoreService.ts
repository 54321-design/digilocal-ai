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
import { UserProfile, GoogleLocation, ScheduledPost, SocialConnector } from '../../types';

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

  /**
   * Multi-Tenant Google OAuth Token Management in Firestore:
   * Stores client OAuth tokens (access_token, refresh_token, scopes) in DB.
   */
  async saveGoogleOAuthConnection(
    businessId: string,
    conn: {
      accountEmail: string;
      displayName?: string;
      photoURL?: string;
      accessToken: string;
      refreshToken?: string;
      scopes?: string[];
      connectedByUid?: string;
    }
  ): Promise<void> {
    try {
      if (db && businessId) {
        const payload = {
          platform: 'gmb',
          connected: true,
          accountEmail: conn.accountEmail,
          displayName: conn.displayName || '',
          photoURL: conn.photoURL || '',
          accessToken: conn.accessToken,
          ...(conn.refreshToken ? { refreshToken: conn.refreshToken } : {}),
          scopes: conn.scopes || ['profile', 'email', 'https://www.googleapis.com/auth/business.manage'],
          updatedAt: Date.now(),
          connectedByUid: conn.connectedByUid || 'system',
        };
        // 1. Save in businesses/{businessId}/integrations/google
        const integrationRef = doc(db, 'businesses', businessId, 'integrations', 'google');
        await setDoc(integrationRef, payload, { merge: true });

        // 2. Also mirror in googleConnections/primary for standard GBP listeners
        const connRef = doc(db, 'businesses', businessId, 'googleConnections', 'primary');
        await setDoc(connRef, payload, { merge: true });
      }
    } catch (err) {
      console.log('[Firestore] saveGoogleOAuthConnection error:', err);
    }
  },

  /**
   * Retrieves the active Google OAuth connection and refresh token from Firestore.
   */
  async getGoogleOAuthConnection(businessId: string): Promise<any | null> {
    try {
      if (db && businessId) {
        const integrationRef = doc(db, 'businesses', businessId, 'integrations', 'google');
        const snap = await getDoc(integrationRef);
        if (snap.exists()) {
          return snap.data();
        }
        const connRef = doc(db, 'businesses', businessId, 'googleConnections', 'primary');
        const connSnap = await getDoc(connRef);
        if (connSnap.exists()) {
          return connSnap.data();
        }
      }
    } catch (err) {
      console.log('[Firestore] getGoogleOAuthConnection error:', err);
    }
    return null;
  },

  /**
   * Multi-Tenant GMB Locations Persistence:
   * Saves Google Business Profile locations directly into Firestore DB under businesses/{businessId}/locations
   */
  async saveBusinessLocations(businessId: string, locations: GoogleLocation[]): Promise<void> {
    try {
      if (db && businessId && locations.length > 0) {
        for (const loc of locations) {
          const locId = (loc.id || loc.googleName || `loc_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
          const locDocRef = doc(db, 'businesses', businessId, 'locations', locId);
          await setDoc(
            locDocRef,
            {
              ...loc,
              businessId,
              syncedAt: Date.now(),
            },
            { merge: true }
          );
        }
      }
    } catch (err) {
      console.log('[Firestore] saveBusinessLocations error:', err);
    }
  },

  /**
   * Fetches GMB locations stored in Firestore DB for this business.
   */
  async fetchBusinessLocations(businessId: string): Promise<GoogleLocation[]> {
    try {
      if (db && businessId) {
        const locColl = collection(db, 'businesses', businessId, 'locations');
        const snap = await getDocs(locColl);
        if (!snap.empty) {
          const list: GoogleLocation[] = [];
          snap.forEach((d) => list.push(d.data() as GoogleLocation));
          return list;
        }
      }
    } catch (err) {
      console.log('[Firestore] fetchBusinessLocations error:', err);
    }
    return [];
  },

  /**
   * Multi-Tenant Social Accounts in Firestore:
   * Saves connected Instagram, Facebook, LinkedIn & GMB accounts directly to Firestore DB.
   */
  async saveSocialConnectors(businessId: string, connectors: SocialConnector[]): Promise<void> {
    try {
      if (db && businessId) {
        const socialDocRef = doc(db, 'businesses', businessId, 'integrations', 'social');
        await setDoc(
          socialDocRef,
          {
            connectors,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.log('[Firestore] saveSocialConnectors error:', err);
    }
  },

  /**
   * Fetches connected social accounts from Firestore DB.
   */
  async fetchSocialConnectors(businessId: string): Promise<SocialConnector[] | null> {
    try {
      if (db && businessId) {
        const socialDocRef = doc(db, 'businesses', businessId, 'integrations', 'social');
        const snap = await getDoc(socialDocRef);
        if (snap.exists() && snap.data()?.connectors) {
          return snap.data().connectors as SocialConnector[];
        }
      }
    } catch (err) {
      console.log('[Firestore] fetchSocialConnectors error:', err);
    }
    return null;
  },
};
