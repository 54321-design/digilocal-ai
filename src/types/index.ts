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
  verificationStatus?: 'VERIFIED' | 'PENDING' | 'ACTION_REQUIRED';
  insights?: {
    searchViews: number;
    mapsViews: number;
    callClicks: number;
    websiteClicks: number;
    directionRequests: number;
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

// GMB Post Scheduling & Social Media Connectors
export type PostChannel = 'gmb' | 'instagram' | 'facebook' | 'linkedin';
export type GMBPostType = 'STANDARD' | 'EVENT' | 'OFFER';

export interface PostCallToAction {
  actionType: 'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL';
  url?: string;
}

export interface PostAnalytics {
  views: number;
  clicks: number;
  calls: number;
  engagementRate: number;
}

export interface ScheduledPost {
  id: string;
  locationId: string;
  locationName: string;
  postType: GMBPostType;
  summary: string;
  mediaUrl?: string;
  callToAction?: PostCallToAction;
  offerDetails?: {
    couponCode?: string;
    redeemUrl?: string;
    termsConditions?: string;
  };
  eventDetails?: {
    title?: string;
    startDate?: string;
    endDate?: string;
  };
  channels: PostChannel[];
  scheduledTime: number; // Unix timestamp
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  n8nWebhookResponse?: string;
  analytics?: PostAnalytics;
  createdAt: number;
}

export interface SocialConnector {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin';
  name: string;
  handle: string;
  connectedEmail?: string;
  connected: boolean;
  avatarUrl?: string;
  followersCount?: number;
  autoCrossPost: boolean;
  lastSyncAt?: number;
}

export interface WebAuditResult {
  url: string;
  overallScore: number;
  performanceScore: number;
  seoScore: number;
  mobileScore: number;
  securityScore: number;
  schemaValid: boolean;
  sslValid: boolean;
  responseTimeMs: number;
  checks: Array<{
    id: string;
    category: 'GMB 3-Pack' | 'Page Speed' | 'Mobile Friendly' | 'Schema & SEO' | 'Security';
    title: string;
    status: 'pass' | 'fail' | 'warning';
    detail: string;
    fixAction: string;
  }>;
  scannedAt: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt?: number;
  pendingCount: number;
}

