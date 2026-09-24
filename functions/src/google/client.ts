import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';

export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return new OAuth2Client(clientId, clientSecret);
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const response = await oauth2Client.getAccessToken();
  const token = response.token;
  if (!token) throw new Error('Failed to refresh Google access token');
  return token;
}

export async function fetchGoogleAccounts(accessToken: string) {
  const url = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.accounts || [];
}

export async function fetchGoogleLocations(accessToken: string, accountName: string) {
  // Official Business Information API endpoint:
  // GET https://mybusinessbusinessinformation.googleapis.com/v1/{parent=accounts/*}/locations?readMask=name,title,storeCode,storefrontAddress,websiteUri,phoneNumbers,regularHours,categories,latlng
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`;
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      readMask: 'name,title,storeCode,storefrontAddress,websiteUri,phoneNumbers,regularHours,categories,latlng',
    },
  });
  return res.data.locations || [];
}

export async function fetchGoogleReviews(accessToken: string, locationGoogleName: string) {
  // Google My Business Reviews API:
  // GET https://mybusiness.googleapis.com/v4/{parent=accounts/*/locations/*}/reviews
  const url = `https://mybusiness.googleapis.com/v4/${locationGoogleName}/reviews`;
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { pageSize: 50 },
  });
  return res.data.reviews || [];
}

export async function publishGoogleReviewReply(
  accessToken: string,
  reviewName: string,
  replyComment: string
) {
  // PUT https://mybusiness.googleapis.com/v4/{name=accounts/*/locations/*/reviews/*}/reply
  const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
  const res = await axios.put(
    url,
    { comment: replyComment },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return res.data;
}

export async function deleteGoogleReviewReply(accessToken: string, reviewName: string) {
  const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
  const res = await axios.delete(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function fetchGooglePerformanceMetrics(
  accessToken: string,
  locationGoogleName: string,
  startDate: { year: number; month: number; day: number },
  endDate: { year: number; month: number; day: number }
) {
  // GET https://businessprofileperformance.googleapis.com/v1/{name=locations/*}:fetchMultiDailyMetricsTimeSeries
  const url = `https://businessprofileperformance.googleapis.com/v1/${locationGoogleName}:fetchMultiDailyMetricsTimeSeries`;
  const res = await axios.get(url, {
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
      'dailyRange.startDate.year': startDate.year,
      'dailyRange.startDate.month': startDate.month,
      'dailyRange.startDate.day': startDate.day,
      'dailyRange.endDate.year': endDate.year,
      'dailyRange.endDate.month': endDate.month,
      'dailyRange.endDate.day': endDate.day,
    },
  });
  return res.data;
}
