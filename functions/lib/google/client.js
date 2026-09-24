"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOAuth2Client = getOAuth2Client;
exports.refreshGoogleAccessToken = refreshGoogleAccessToken;
exports.fetchGoogleAccounts = fetchGoogleAccounts;
exports.fetchGoogleLocations = fetchGoogleLocations;
exports.fetchGoogleReviews = fetchGoogleReviews;
exports.publishGoogleReviewReply = publishGoogleReviewReply;
exports.deleteGoogleReviewReply = deleteGoogleReviewReply;
exports.fetchGooglePerformanceMetrics = fetchGooglePerformanceMetrics;
const axios_1 = __importDefault(require("axios"));
const google_auth_library_1 = require("google-auth-library");
function getOAuth2Client() {
    const clientId = process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    return new google_auth_library_1.OAuth2Client(clientId, clientSecret);
}
async function refreshGoogleAccessToken(refreshToken) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const response = await oauth2Client.getAccessToken();
    const token = response.token;
    if (!token)
        throw new Error('Failed to refresh Google access token');
    return token;
}
async function fetchGoogleAccounts(accessToken) {
    const url = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
    const res = await axios_1.default.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data.accounts || [];
}
async function fetchGoogleLocations(accessToken, accountName) {
    // Official Business Information API endpoint:
    // GET https://mybusinessbusinessinformation.googleapis.com/v1/{parent=accounts/*}/locations?readMask=name,title,storeCode,storefrontAddress,websiteUri,phoneNumbers,regularHours,categories,latlng
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`;
    const res = await axios_1.default.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
            readMask: 'name,title,storeCode,storefrontAddress,websiteUri,phoneNumbers,regularHours,categories,latlng',
        },
    });
    return res.data.locations || [];
}
async function fetchGoogleReviews(accessToken, locationGoogleName) {
    // Google My Business Reviews API:
    // GET https://mybusiness.googleapis.com/v4/{parent=accounts/*/locations/*}/reviews
    const url = `https://mybusiness.googleapis.com/v4/${locationGoogleName}/reviews`;
    const res = await axios_1.default.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { pageSize: 50 },
    });
    return res.data.reviews || [];
}
async function publishGoogleReviewReply(accessToken, reviewName, replyComment) {
    // PUT https://mybusiness.googleapis.com/v4/{name=accounts/*/locations/*/reviews/*}/reply
    const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
    const res = await axios_1.default.put(url, { comment: replyComment }, { headers: { Authorization: `Bearer ${accessToken}` } });
    return res.data;
}
async function deleteGoogleReviewReply(accessToken, reviewName) {
    const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
    const res = await axios_1.default.delete(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
}
async function fetchGooglePerformanceMetrics(accessToken, locationGoogleName, startDate, endDate) {
    // GET https://businessprofileperformance.googleapis.com/v1/{name=locations/*}:fetchMultiDailyMetricsTimeSeries
    const url = `https://businessprofileperformance.googleapis.com/v1/${locationGoogleName}:fetchMultiDailyMetricsTimeSeries`;
    const res = await axios_1.default.get(url, {
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
//# sourceMappingURL=client.js.map