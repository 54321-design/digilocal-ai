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

export const GMBService = {
  async fetchAccounts(accessToken: string): Promise<Array<{ name: string; accountName: string }>> {
    const res = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data.accounts || [];
  },

  async fetchLocations(accessToken: string, accountName: string): Promise<GoogleLocation[]> {
    const res = await axios.get(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          readMask:
            'name,title,storeCode,storefrontAddress,websiteUri,phoneNumbers,regularHours,categories,latlng',
        },
      }
    );

    const locations = res.data.locations || [];
    return locations.map((loc: any) => ({
      id: loc.name,
      googleName: loc.name,
      title: loc.title || 'Untitled Location',
      storeCode: loc.storeCode,
      phoneNumbers: loc.phoneNumbers,
      websiteUri: loc.websiteUri,
      regularHours: loc.regularHours,
      categories: loc.categories,
      storefrontAddress: loc.storefrontAddress,
      latlng: loc.latlng,
    }));
  },

  async fetchReviews(accessToken: string, locationGoogleName: string): Promise<GoogleReview[]> {
    // Official endpoint: https://mybusiness.googleapis.com/v4/{locationGoogleName}/reviews
    const res = await axios.get(`https://mybusiness.googleapis.com/v4/${locationGoogleName}/reviews`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { pageSize: 50 },
    });

    const reviews = res.data.reviews || [];
    return reviews.map((rev: any) => {
      const star = (rev.starRating || 'FIVE') as ReviewStarRating;
      return {
        id: rev.reviewId || rev.name,
        googleName: rev.name,
        locationGoogleName,
        reviewer: {
          displayName: rev.reviewer?.displayName || 'Google User',
          profilePhotoUrl: rev.reviewer?.profilePhotoUrl,
        },
        starRating: star,
        numericRating: parseStarRating(star),
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
        sentiment: parseStarRating(star) >= 4 ? 'positive' : parseStarRating(star) === 3 ? 'neutral' : 'negative',
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
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const res = await axios.get(
      `https://businessprofileperformance.googleapis.com/v1/${locationGoogleName}:fetchMultiDailyMetricsTimeSeries`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          dailyMetrics: [
            'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
            'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
            'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
            'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
            'CALL_CLICKS',
            'WEBSITE_CLICKS',
            'BUSINESS_DIRECTION_REQUESTS',
          ],
          'dailyRange.startDate.year': thirtyDaysAgo.getFullYear(),
          'dailyRange.startDate.month': thirtyDaysAgo.getMonth() + 1,
          'dailyRange.startDate.day': thirtyDaysAgo.getDate(),
          'dailyRange.endDate.year': now.getFullYear(),
          'dailyRange.endDate.month': now.getMonth() + 1,
          'dailyRange.endDate.day': now.getDate(),
        },
      }
    );
    return res.data;
  },
};
