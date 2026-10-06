import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBtHdl_zf4NPp-QoChZApqC1TNtYGQprPQ',
  authDomain: 'august-clover-460507-h6.firebaseapp.com',
  projectId: 'august-clover-460507-h6',
  storageBucket: 'august-clover-460507-h6.firebasestorage.app',
  messagingSenderId: '65870687688',
  appId: '1:65870687688:android:1b248a2d3d1283feffe4fd',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface CloudClient {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  businessName: string;
  locationTitle?: string;
  locality?: string;
  role: string;
  plan: 'free_trial' | 'Growth' | 'Enterprise';
  status: 'active' | 'idle' | 'offline';
  lastActiveAt: number;
  createdAt: number;
  totalApiCalls: number;
  totalEstimatedCostInr: number;
  quotaUsage?: {
    posts: number;
    reviews: number;
    audits: number;
    copilot: number;
  };
}

export interface ApiTelemetryItem {
  id: string;
  timestamp: number;
  service: 'gemini_ai' | 'google_gmb' | 'seo_audit' | 'n8n_webhook' | 'firestore';
  endpoint: string;
  status: number;
  latencyMs: number;
  tokensEstimated?: number;
  costInr: number;
  cached?: boolean;
  clientEmail?: string;
}

export const FirebaseAdminService = {
  /**
   * Listen to all clients in real-time
   */
  subscribeToClients(
    callback: (clients: CloudClient[]) => void,
    onError?: (error: any) => void
  ) {
    try {
      const q = query(collection(db, 'clients'), orderBy('lastActiveAt', 'desc'), limit(100));
      return onSnapshot(
        q,
        (snapshot) => {
          const list: CloudClient[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ uid: docSnap.id, ...docSnap.data() } as CloudClient);
          });
          callback(list);
        },
        (error) => {
          console.warn('[Firebase] Firestore clients error:', error);
          if (onError) onError(error);
          callback([]);
        }
      );
    } catch (err) {
      if (onError) onError(err);
      return () => {};
    }
  },

  /**
   * Listen to live API telemetry in real-time
   */
  subscribeToTelemetry(
    callback: (telemetry: ApiTelemetryItem[]) => void,
    onError?: (error: any) => void
  ) {
    try {
      const q = query(collection(db, 'telemetry'), orderBy('timestamp', 'desc'), limit(100));
      return onSnapshot(
        q,
        (snapshot) => {
          const list: ApiTelemetryItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as ApiTelemetryItem);
          });
          callback(list);
        },
        (error) => {
          console.warn('[Firebase] Firestore telemetry error:', error);
          if (onError) onError(error);
          callback([]);
        }
      );
    } catch (err) {
      if (onError) onError(err);
      return () => {};
    }
  },

  /**
   * Update client subscription plan
   */
  async updateClientPlan(uid: string, plan: 'free_trial' | 'Growth' | 'Enterprise') {
    const clientRef = doc(db, 'clients', uid);
    await setDoc(clientRef, { plan, lastActiveAt: Date.now() }, { merge: true });
    // Also update quota doc
    const quotaRef = doc(db, 'clients', uid, 'quota', 'usage');
    await setDoc(quotaRef, { plan: plan.toLowerCase(), lastUpdatedAt: Date.now() }, { merge: true });
  },

  /**
   * Reset client 1-time quota for testing/trial renewal
   */
  async resetClientQuota(uid: string) {
    const quotaRef = doc(db, 'clients', uid, 'quota', 'usage');
    await setDoc(
      quotaRef,
      {
        post_generation: 0,
        review_reply: 0,
        seo_audit: 0,
        copilot_plan: 0,
        totalApiCalls: 0,
        plan: 'free_trial',
        lastUpdatedAt: Date.now(),
      },
      { merge: true }
    );

    const clientRef = doc(db, 'clients', uid);
    await setDoc(
      clientRef,
      {
        quotaUsage: { posts: 0, reviews: 0, audits: 0, copilot: 0 },
        lastActiveAt: Date.now(),
      },
      { merge: true }
    );
  },
};
