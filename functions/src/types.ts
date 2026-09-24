export type UserRole = 'owner' | 'admin' | 'manager' | 'staff';

export interface BusinessMember {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  joinedAt: number;
}

export interface GoogleConnectionData {
  connected: boolean;
  email: string;
  accountId?: string;
  accountName?: string;
  lastSyncedAt?: number;
  refreshToken?: string;
  accessToken?: string;
  expiresAt?: number;
  scopes: string[];
}

export interface LocationData {
  id: string;
  googleLocationName: string; // e.g. "accounts/123/locations/456"
  title: string;
  storeCode?: string;
  phoneNumbers?: { primaryPhone?: string };
  websiteUri?: string;
  regularHours?: any;
  categories?: { primaryCategory?: { displayName?: string } };
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
  latlng?: { latitude?: number; longitude?: number };
  status: 'active' | 'suspended' | 'needs_verification';
}

export interface ReviewData {
  id: string; // Google review id
  name: string; // "accounts/123/locations/456/reviews/789"
  locationId: string;
  reviewer: {
    displayName?: string;
    profilePhotoUrl?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  numericRating: number;
  comment?: string;
  createTime: string;
  updateTime?: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
  replyStatus: 'unanswered' | 'drafted' | 'published';
  sentiment?: 'positive' | 'neutral' | 'negative';
}
