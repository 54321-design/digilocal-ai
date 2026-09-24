export type UserRole = 'owner' | 'admin' | 'manager' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  plan?: 'free' | 'growth' | 'pro';
}

export interface BusinessMember {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  joinedAt: number;
}

export interface GoogleConnection {
  connected: boolean;
  email?: string;
  accountName?: string;
  lastSyncedAt?: number;
  scopes?: string[];
}

export interface GoogleLocation {
  id: string; // encoded name or internal key
  googleName: string; // "accounts/123/locations/456"
  title: string;
  storeCode?: string;
  phoneNumbers?: { primaryPhone?: string };
  websiteUri?: string;
  regularHours?: {
    periods?: Array<{
      openDay: string;
      openTime: string;
      closeDay: string;
      closeTime: string;
    }>;
  };
  categories?: {
    primaryCategory?: {
      displayName?: string;
      categoryId?: string;
    };
  };
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    regionCode?: string;
  };
  latlng?: {
    latitude?: number;
    longitude?: number;
  };
}

export type ReviewStarRating = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';

export interface GoogleReview {
  id: string;
  googleName: string; // "accounts/123/locations/456/reviews/789"
  locationGoogleName: string;
  reviewer: {
    displayName?: string;
    profilePhotoUrl?: string;
  };
  starRating: ReviewStarRating;
  numericRating: number;
  comment?: string;
  createTime: string;
  updateTime?: string;
  reviewReply?: {
    comment: string;
    updateTime?: string;
  };
  replyStatus: 'unanswered' | 'drafted' | 'published';
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface SEOCheckItem {
  id: string;
  title: string;
  status: 'pass' | 'fail' | 'warning';
  evidence: string;
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  source: string;
}

export interface SEOAudit {
  locationId: string;
  checkedAt: number;
  checks: SEOCheckItem[];
  passedCount: number;
  totalChecks: number;
}

export interface AICopilotPlan {
  summary: string;
  actionPlan: string[];
  seoInsights: string[];
  postIdeas: string[];
  generatedAt: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  type: 'review' | 'alert' | 'system';
}

// Secondary Supporting Modules
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  balance: number; // positive = owes us, negative = we owe
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  category?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  customerName?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'credit';
  timestamp: number;
}

export interface LedgerEntry {
  id: string;
  customerId: string;
  customerName: string;
  type: 'give' | 'got'; // Khata credit or debit
  amount: number;
  note?: string;
  date: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt?: number;
  pendingCount: number;
}
