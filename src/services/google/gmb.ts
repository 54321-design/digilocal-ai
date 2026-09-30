import axios from 'axios';
import { GoogleLocation, GoogleReview, ReviewStarRating } from '../../types';

const STAR_RATING_NUMBERS: Record<ReviewStarRating, number> = {
  FIVE: 5,
  FOUR: 4,
  THREE: 3,
  TWO: 2,
  ONE: 1,
};

export function parseStarRating(rating?: string): number {
  if (!rating) return 0;
  return (STAR_RATING_NUMBERS as Record<string, number>)[rating] ?? 0;
}

export function toCleanLocationResource(locationName: string): string {
  if (!locationName) return '';
  if (locationName.includes('/locations/')) {
    return `locations/${locationName.split('/locations/')[1]}`;
  }
  return locationName.startsWith('locations/') ? locationName : `locations/${locationName}`;
}

export function toFullAccountLocationResource(accountName: string, locationName: string): string {
  if (!locationName) return '';
  if (locationName.startsWith('accounts/')) {
    return locationName;
  }
  const cleanAccount = accountName.startsWith('accounts/')
    ? accountName
    : `accounts/${accountName}`;
  const cleanLoc = toCleanLocationResource(locationName);
  return `${cleanAccount}/${cleanLoc}`;
}

export const GMBService = {
  async fetchAccounts(accessToken: string): Promise<Array<{ name: string; accountName: string }>> {
    const res = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data.accounts || [];
  },

  async fetchLocations(accessToken: string, accountName: string): Promise<GoogleLocation[]> {
    const cleanAccount = accountName.startsWith('accounts/')
      ? accountName
      : `accounts/${accountName}`;

    let rawLocations: any[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const res: any = await axios.get(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${cleanAccount}/locations`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            readMask:
              'name,title,storeCode,storefrontAddress,websiteUri,phoneNumbers,regularHours,categories,latlng,metadata',
            pageSize: 100,
            ...(pageToken ? { pageToken } : {}),
          },
        }
      );
      if (res.data?.locations?.length) {
        rawLocations.push(...res.data.locations);
      }
      pageToken = res.data?.nextPageToken;
    } while (pageToken);

    return rawLocations.map((loc: any) => {
      const fullGoogleName = toFullAccountLocationResource(cleanAccount, loc.name);
      return {
        id: fullGoogleName,
        googleName: fullGoogleName,
        title: loc.title || 'Untitled Location',
        storeCode: loc.storeCode,
        phoneNumbers: loc.phoneNumbers,
        websiteUri: loc.websiteUri,
        regularHours: loc.regularHours,
        categories: loc.categories,
        storefrontAddress: loc.storefrontAddress,
        latlng: loc.latlng,
        verificationStatus: loc.metadata?.hasVoiceOfMerchant ? 'VERIFIED' : undefined,
      };
    });
  },

  async fetchLocationDetails(
    accessToken: string,
    locationGoogleName: string
  ): Promise<Partial<GoogleLocation>> {
    const cleanLocation = toCleanLocationResource(locationGoogleName);
    const res = await axios.get(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${cleanLocation}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          readMask:
            'name,title,storeCode,storefrontAddress,websiteUri,phoneNumbers,regularHours,categories,latlng,metadata',
        },
      }
    );
    const loc = res.data || {};
    return {
      title: loc.title || undefined,
      storeCode: loc.storeCode,
      phoneNumbers: loc.phoneNumbers,
      websiteUri: loc.websiteUri,
      regularHours: loc.regularHours,
      categories: loc.categories,
      storefrontAddress: loc.storefrontAddress,
      latlng: loc.latlng,
      verificationStatus: loc.metadata?.hasVoiceOfMerchant ? 'VERIFIED' : undefined,
    };
  },

  async fetchReviews(accessToken: string, locationGoogleName: string): Promise<GoogleReview[]> {
    // Official v4 endpoint requires: accounts/{accountId}/locations/{locationId}/reviews
    // Max pageSize per request is 50; paginate using nextPageToken to fetch all reviews.
    let rawReviews: any[] = [];
    let pageToken: string | undefined = undefined;
    let safetyPages = 0;

    do {
      const res: any = await axios.get(
        `https://mybusiness.googleapis.com/v4/${locationGoogleName}/reviews`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            pageSize: 50,
            ...(pageToken ? { pageToken } : {}),
          },
        }
      );
      if (res.data?.reviews?.length) {
        rawReviews.push(...res.data.reviews);
      }
      pageToken = res.data?.nextPageToken;
      safetyPages += 1;
    } while (pageToken && safetyPages < 50);

    return rawReviews.map((rev: any) => {
      const star = (rev.starRating || 'FIVE') as ReviewStarRating;
      const numeric = parseStarRating(star);
      return {
        id: rev.reviewId || rev.name,
        googleName: rev.name,
        locationGoogleName,
        reviewer: {
          displayName: rev.reviewer?.displayName || 'Google User',
          profilePhotoUrl: rev.reviewer?.profilePhotoUrl,
        },
        starRating: star,
        numericRating: numeric,
        comment: rev.comment || '',
        createTime: rev.createTime || new Date().toISOString(),
        updateTime: rev.updateTime,
        reviewReply: rev.reviewReply
          ? {
              comment: rev.reviewReply.comment,
              updateTime: rev.reviewReply.updateTime,
            }
          : undefined,
        replyStatus: rev.reviewReply ? 'published' : 'unanswered',
        sentiment: numeric >= 4 ? 'positive' : numeric === 3 ? 'neutral' : 'negative',
      };
    });
  },

  async publishReply(
    accessToken: string,
    reviewGoogleName: string,
    replyText: string
  ): Promise<{ comment: string; updateTime: string }> {
    const res = await axios.put(
      `https://mybusiness.googleapis.com/v4/${reviewGoogleName}/reply`,
      { comment: replyText },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return res.data;
  },

  async deleteReply(accessToken: string, reviewGoogleName: string): Promise<void> {
    await axios.delete(`https://mybusiness.googleapis.com/v4/${reviewGoogleName}/reply`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  async fetchPerformanceTimeSeries(accessToken: string, locationGoogleName: string) {
    // Official v1 Performance endpoint requires: locations/{locationId} (without accounts/{accountId}/)
    // and repeated dailyMetrics= query params WITHOUT square brackets [].
    const cleanLocation = toCleanLocationResource(locationGoogleName);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyMetrics = [
      'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
      'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
      'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
      'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
      'CALL_CLICKS',
      'WEBSITE_CLICKS',
      'BUSINESS_DIRECTION_REQUESTS',
    ];

    const queryString = [
      ...dailyMetrics.map((m) => `dailyMetrics=${encodeURIComponent(m)}`),
      `dailyRange.startDate.year=${thirtyDaysAgo.getFullYear()}`,
      `dailyRange.startDate.month=${thirtyDaysAgo.getMonth() + 1}`,
      `dailyRange.startDate.day=${thirtyDaysAgo.getDate()}`,
      `dailyRange.endDate.year=${now.getFullYear()}`,
      `dailyRange.endDate.month=${now.getMonth() + 1}`,
      `dailyRange.endDate.day=${now.getDate()}`,
    ].join('&');

    const url = `https://businessprofileperformance.googleapis.com/v1/${cleanLocation}:fetchMultiDailyMetricsTimeSeries?${queryString}`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  },
};
