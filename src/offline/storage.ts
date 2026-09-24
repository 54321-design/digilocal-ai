import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Business,
  GoogleLocation,
  GoogleReview,
  SEOAudit,
  AICopilotPlan,
  Customer,
  Product,
  Sale,
  LedgerEntry,
} from '../types';

const KEYS = {
  ACTIVE_BUSINESS_ID: 'digilocal_active_business_id',
  BUSINESS_DATA: 'digilocal_business_',
  LOCATIONS_DATA: 'digilocal_locations_',
  REVIEWS_DATA: 'digilocal_reviews_',
  SEO_AUDIT: 'digilocal_seo_audit_',
  COPILOT_PLAN: 'digilocal_copilot_',
  CUSTOMERS: 'digilocal_customers_',
  PRODUCTS: 'digilocal_products_',
  SALES: 'digilocal_sales_',
  KHATA: 'digilocal_khata_',
  OFFLINE_MUTATION_QUEUE: 'digilocal_mutation_queue',
};

export interface OfflineMutation {
  id: string;
  type: 'publish_reply' | 'create_sale' | 'add_customer' | 'add_khata';
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

  // Supporting modules cache
  async getCustomers(businessId: string): Promise<Customer[]> {
    const data = await AsyncStorage.getItem(`${KEYS.CUSTOMERS}${businessId}`);
    return data ? JSON.parse(data) : [];
  },

  async saveCustomers(businessId: string, customers: Customer[]): Promise<void> {
    await AsyncStorage.setItem(`${KEYS.CUSTOMERS}${businessId}`, JSON.stringify(customers));
  },

  async getProducts(businessId: string): Promise<Product[]> {
    const data = await AsyncStorage.getItem(`${KEYS.PRODUCTS}${businessId}`);
    return data ? JSON.parse(data) : [];
  },

  async saveProducts(businessId: string, products: Product[]): Promise<void> {
    await AsyncStorage.setItem(`${KEYS.PRODUCTS}${businessId}`, JSON.stringify(products));
  },

  async getSales(businessId: string): Promise<Sale[]> {
    const data = await AsyncStorage.getItem(`${KEYS.SALES}${businessId}`);
    return data ? JSON.parse(data) : [];
  },

  async saveSales(businessId: string, sales: Sale[]): Promise<void> {
    await AsyncStorage.setItem(`${KEYS.SALES}${businessId}`, JSON.stringify(sales));
  },

  async getKhataEntries(businessId: string): Promise<LedgerEntry[]> {
    const data = await AsyncStorage.getItem(`${KEYS.KHATA}${businessId}`);
    return data ? JSON.parse(data) : [];
  },

  async saveKhataEntries(businessId: string, entries: LedgerEntry[]): Promise<void> {
    await AsyncStorage.setItem(`${KEYS.KHATA}${businessId}`, JSON.stringify(entries));
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
