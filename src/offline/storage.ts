import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Business,
  GoogleLocation,
  GoogleReview,
  SEOAudit,
  AICopilotPlan,
  ScheduledPost,
  SocialConnector,
  WebAuditResult,
} from '../types';

const KEYS = {
  ACTIVE_BUSINESS_ID: 'digilocal_active_business_id',
  BUSINESS_DATA: 'digilocal_business_',
  LOCATIONS_DATA: 'digilocal_locations_',
  REVIEWS_DATA: 'digilocal_reviews_',
  SEO_AUDIT: 'digilocal_seo_audit_',
  COPILOT_PLAN: 'digilocal_copilot_',
  SCHEDULED_POSTS: 'digilocal_posts_',
  SOCIAL_CONNECTORS: 'digilocal_social_',
  WEB_AUDIT: 'digilocal_web_audit_',
  OFFLINE_MUTATION_QUEUE: 'digilocal_mutation_queue',
};

export interface OfflineMutation {
  id: string;
  type: 'publish_reply' | 'schedule_post' | 'sync_social' | 'run_audit';
  payload: any;
  createdAt: number;
}

export const LocalCache = {
  async getActiveBusinessId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ACTIVE_BUSINESS_ID);
  },

  async setActiveBusinessId(id: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.ACTIVE_BUSINESS_ID, id);
  },

  async cacheBusiness(business: Business): Promise<void> {
    await AsyncStorage.setItem(`${KEYS.BUSINESS_DATA}${business.id}`, JSON.stringify(business));
  },

  async getCachedBusiness(businessId: string): Promise<Business | null> {
    const data = await AsyncStorage.getItem(`${KEYS.BUSINESS_DATA}${businessId}`);
    return data ? JSON.parse(data) : null;
  },

  async cacheLocations(businessId: string, locations: GoogleLocation[]): Promise<void> {
    await AsyncStorage.setItem(`${KEYS.LOCATIONS_DATA}${businessId}`, JSON.stringify(locations));
  },

  async getCachedLocations(businessId: string): Promise<GoogleLocation[]> {
    const data = await AsyncStorage.getItem(`${KEYS.LOCATIONS_DATA}${businessId}`);
    return data ? JSON.parse(data) : [];
  },

  async cacheReviews(businessId: string, reviews: GoogleReview[]): Promise<void> {
    await AsyncStorage.setItem(`${KEYS.REVIEWS_DATA}${businessId}`, JSON.stringify(reviews));
  },

  async getCachedReviews(businessId: string): Promise<GoogleReview[]> {
    const data = await AsyncStorage.getItem(`${KEYS.REVIEWS_DATA}${businessId}`);
    return data ? JSON.parse(data) : [];
  },

  async cacheSEOAudit(businessId: string, audit: SEOAudit): Promise<void> {
    await AsyncStorage.setItem(`${KEYS.SEO_AUDIT}${businessId}`, JSON.stringify(audit));
  },

  async getCachedSEOAudit(businessId: string): Promise<SEOAudit | null> {
    const data = await AsyncStorage.getItem(`${KEYS.SEO_AUDIT}${businessId}`);
    return data ? JSON.parse(data) : null;
  },

  async cacheCopilotPlan(businessId: string, plan: AICopilotPlan): Promise<void> {
    await AsyncStorage.setItem(`${KEYS.COPILOT_PLAN}${businessId}`, JSON.stringify(plan));
  },

  async getCachedCopilotPlan(businessId: string): Promise<AICopilotPlan | null> {
    const data = await AsyncStorage.getItem(`${KEYS.COPILOT_PLAN}${businessId}`);
    return data ? JSON.parse(data) : null;
  },

  async cacheScheduledPosts(businessId: string, posts: ScheduledPost[]): Promise<void> {
    await AsyncStorage.setItem(`${KEYS.SCHEDULED_POSTS}${businessId}`, JSON.stringify(posts));
  },

  async getCachedScheduledPosts(businessId: string): Promise<ScheduledPost[]> {
    const data = await AsyncStorage.getItem(`${KEYS.SCHEDULED_POSTS}${businessId}`);
    return data ? JSON.parse(data) : [];
  },

  // Mutation Queue for Offline Operations
  async getMutationQueue(): Promise<OfflineMutation[]> {
    const data = await AsyncStorage.getItem(KEYS.OFFLINE_MUTATION_QUEUE);
    return data ? JSON.parse(data) : [];
  },

  async enqueueMutation(mutation: Omit<OfflineMutation, 'id' | 'createdAt'>): Promise<OfflineMutation> {
    const queue = await this.getMutationQueue();
    const newMutation: OfflineMutation = {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
    };
    queue.push(newMutation);
    await AsyncStorage.setItem(KEYS.OFFLINE_MUTATION_QUEUE, JSON.stringify(queue));
    return newMutation;
  },

  async removeMutation(mutationId: string): Promise<void> {
    const queue = await this.getMutationQueue();
    const filtered = queue.filter((m) => m.id !== mutationId);
    await AsyncStorage.setItem(KEYS.OFFLINE_MUTATION_QUEUE, JSON.stringify(filtered));
  },
};
