"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGrowthCopilot = exports.runLocalSEOAudit = exports.publishReviewReply = exports.generateReviewReply = exports.syncGoogleBusinessData = exports.exchangeGoogleAuthCode = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const client_1 = require("./google/client");
const copilot_1 = require("./ai/copilot");
admin.initializeApp();
const db = admin.firestore();
// 1. Exchange Google OAuth Code for Refresh and Access Tokens
exports.exchangeGoogleAuthCode = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { code, businessId, redirectUri } = data;
    if (!code || !businessId) {
        throw new functions.https.HttpsError('invalid-argument', 'Authorization code and businessId are required.');
    }
    // Tenant authorization check
    const memberDoc = await db.doc(`businesses/${businessId}/members/${context.auth.uid}`).get();
    if (!memberDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'User is not a member of this business.');
    }
    const role = memberDoc.data()?.role;
    if (role !== 'owner' && role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only owners and admins can connect Google accounts.');
    }
    try {
        const oauth2Client = (0, client_1.getOAuth2Client)();
        const { tokens } = await oauth2Client.getToken({
            code,
            redirect_uri: redirectUri,
        });
        const googleConnectionData = {
            connected: true,
            lastSyncedAt: Date.now(),
            scopes: tokens.scope ? tokens.scope.split(' ') : [],
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Store tokens securely in server-side googleConnections document
        await db.doc(`businesses/${businessId}/googleConnections/default`).set({
            ...googleConnectionData,
            refreshToken: tokens.refresh_token || null,
            accessToken: tokens.access_token,
            expiryDate: tokens.expiry_date,
        }, { merge: true });
        return { success: true, message: 'Google Account successfully connected.' };
    }
    catch (error) {
        console.error('Error exchanging Google auth code:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to exchange auth code');
    }
});
// 2. Sync Google Business Profile Accounts, Locations, and Reviews
exports.syncGoogleBusinessData = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { businessId, clientAccessToken } = data;
    if (!businessId) {
        throw new functions.https.HttpsError('invalid-argument', 'businessId is required.');
    }
    // Check tenant membership
    const memberDoc = await db.doc(`businesses/${businessId}/members/${context.auth.uid}`).get();
    if (!memberDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Access denied.');
    }
    // Retrieve access token
    let accessToken = clientAccessToken;
    if (!accessToken) {
        const connDoc = await db.doc(`businesses/${businessId}/googleConnections/default`).get();
        const connData = connDoc.data();
        if (connData?.refreshToken) {
            accessToken = await (0, client_1.refreshGoogleAccessToken)(connData.refreshToken);
        }
    }
    if (!accessToken) {
        throw new functions.https.HttpsError('failed-precondition', 'No valid Google access token available.');
    }
    try {
        // 1. Fetch Accounts
        const accounts = await (0, client_1.fetchGoogleAccounts)(accessToken);
        if (!accounts.length) {
            return { success: true, message: 'No Google Business accounts found for this user.' };
        }
        const firstAccount = accounts[0];
        await db.doc(`businesses/${businessId}/googleAccounts/${encodeURIComponent(firstAccount.name)}`).set({
            ...firstAccount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        // 2. Fetch Locations
        const locations = await (0, client_1.fetchGoogleLocations)(accessToken, firstAccount.name);
        const batch = db.batch();
        for (const loc of locations) {
            const locRef = db.doc(`businesses/${businessId}/locations/${encodeURIComponent(loc.name)}`);
            batch.set(locRef, {
                googleName: loc.name,
                title: loc.title || 'Untitled Location',
                storeCode: loc.storeCode || '',
                storefrontAddress: loc.storefrontAddress || null,
                websiteUri: loc.websiteUri || null,
                phoneNumbers: loc.phoneNumbers || null,
                categories: loc.categories || null,
                regularHours: loc.regularHours || null,
                latlng: loc.latlng || null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            // 3. Fetch Reviews for each location
            try {
                const reviews = await (0, client_1.fetchGoogleReviews)(accessToken, loc.name);
                for (const rev of reviews) {
                    const revRef = db.doc(`businesses/${businessId}/reviews/${encodeURIComponent(rev.name)}`);
                    batch.set(revRef, {
                        googleName: rev.name,
                        locationGoogleName: loc.name,
                        reviewer: rev.reviewer || { displayName: 'Anonymous Customer' },
                        starRating: rev.starRating || 'FIVE',
                        comment: rev.comment || '',
                        createTime: rev.createTime || new Date().toISOString(),
                        reviewReply: rev.reviewReply || null,
                        replyStatus: rev.reviewReply ? 'published' : 'unanswered',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });
                }
            }
            catch (revErr) {
                console.warn('Reviews fetch note:', revErr);
            }
        }
        await batch.commit();
        return {
            success: true,
            locationsSynced: locations.length,
        };
    }
    catch (error) {
        console.error('Error syncing Google data:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Sync failed.');
    }
});
// 3. Generate AI Review Reply
exports.generateReviewReply = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { businessId, reviewerName, starRating, reviewComment, tone, language } = data;
    if (!businessId || starRating === undefined) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }
    const bizDoc = await db.doc(`businesses/${businessId}`).get();
    const businessName = bizDoc.data()?.name || 'Our Business';
    const reply = await (0, copilot_1.generateAIReviewReply)({
        businessName,
        reviewerName,
        starRating,
        reviewComment,
        tone: tone || 'professional',
        language: language || 'en',
    });
    return { reply };
});
// 4. Publish Review Reply through Google API & update Firestore
exports.publishReviewReply = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { businessId, reviewName, replyComment, clientAccessToken } = data;
    if (!businessId || !reviewName || !replyComment) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing parameters for publishing reply.');
    }
    let accessToken = clientAccessToken;
    if (!accessToken) {
        const connDoc = await db.doc(`businesses/${businessId}/googleConnections/default`).get();
        const connData = connDoc.data();
        if (connData?.refreshToken) {
            accessToken = await (0, client_1.refreshGoogleAccessToken)(connData.refreshToken);
        }
    }
    if (!accessToken) {
        throw new functions.https.HttpsError('failed-precondition', 'Google access token is required to publish.');
    }
    // Publish to Google
    const response = await (0, client_1.publishGoogleReviewReply)(accessToken, reviewName, replyComment);
    // Update in Firestore
    const revRef = db.doc(`businesses/${businessId}/reviews/${encodeURIComponent(reviewName)}`);
    await revRef.set({
        reviewReply: {
            comment: replyComment,
            updateTime: new Date().toISOString(),
        },
        replyStatus: 'published',
        publishedBy: context.auth.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { success: true, googleResponse: response };
});
// 5. Run Evidence-Based Local SEO Audit
exports.runLocalSEOAudit = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { businessId, locationGoogleName } = data;
    if (!businessId || !locationGoogleName) {
        throw new functions.https.HttpsError('invalid-argument', 'businessId and locationGoogleName are required.');
    }
    const locDoc = await db.doc(`businesses/${businessId}/locations/${encodeURIComponent(locationGoogleName)}`).get();
    if (!locDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Location not found.');
    }
    const locData = locDoc.data();
    // Real evidence-based checks
    const checks = [
        {
            id: 'phone',
            title: 'Phone Number',
            status: locData.phoneNumbers?.primaryPhone ? 'pass' : 'fail',
            evidence: locData.phoneNumbers?.primaryPhone || 'No primary phone number specified in profile',
            action: locData.phoneNumbers?.primaryPhone ? 'Phone verified.' : 'Add your business phone number so customers can call.',
            priority: 'high',
            source: 'Google Business Information API',
        },
        {
            id: 'website',
            title: 'Website Link',
            status: locData.websiteUri ? 'pass' : 'fail',
            evidence: locData.websiteUri || 'No website link provided',
            action: locData.websiteUri ? 'Website linked.' : 'Add website URL to drive online appointments and traffic.',
            priority: 'high',
            source: 'Google Business Information API',
        },
        {
            id: 'hours',
            title: 'Regular Operating Hours',
            status: locData.regularHours?.periods?.length ? 'pass' : 'fail',
            evidence: locData.regularHours?.periods?.length ? `${locData.regularHours.periods.length} daily time periods configured` : 'No business hours listed',
            action: locData.regularHours?.periods?.length ? 'Hours published.' : 'Add opening and closing hours for every day of the week.',
            priority: 'medium',
            source: 'Google Business Information API',
        },
        {
            id: 'category',
            title: 'Primary Business Category',
            status: locData.categories?.primaryCategory?.displayName ? 'pass' : 'fail',
            evidence: locData.categories?.primaryCategory?.displayName || 'Primary category is not set',
            action: locData.categories?.primaryCategory?.displayName ? `Categorized as ${locData.categories.primaryCategory.displayName}` : 'Select a primary category to match local search intent.',
            priority: 'critical',
            source: 'Google Business Information API',
        },
        {
            id: 'address',
            title: 'Physical Address / Storefront',
            status: locData.storefrontAddress?.addressLines?.length ? 'pass' : 'warning',
            evidence: locData.storefrontAddress?.addressLines?.join(', ') || 'Service area or incomplete address',
            action: locData.storefrontAddress?.addressLines?.length ? 'Storefront address complete.' : 'Verify physical street address for Google Maps pinpointing.',
            priority: 'critical',
            source: 'Google Business Information API',
        },
    ];
    const auditResult = {
        locationId: locationGoogleName,
        checkedAt: Date.now(),
        checks,
        passedCount: checks.filter((c) => c.status === 'pass').length,
        totalChecks: checks.length,
    };
    await db.doc(`businesses/${businessId}/seoAudits/${encodeURIComponent(locationGoogleName)}`).set(auditResult, { merge: true });
    return auditResult;
});
// 6. Generate Growth Copilot Recommendations
exports.generateGrowthCopilot = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { businessId, locationGoogleName } = data;
    if (!businessId || !locationGoogleName) {
        throw new functions.https.HttpsError('invalid-argument', 'businessId and locationGoogleName are required.');
    }
    const locDoc = await db.doc(`businesses/${businessId}/locations/${encodeURIComponent(locationGoogleName)}`).get();
    const locData = locDoc.data() || {};
    const reviewsSnapshot = await db
        .collection(`businesses/${businessId}/reviews`)
        .where('locationGoogleName', '==', locationGoogleName)
        .get();
    const totalReviews = reviewsSnapshot.size;
    let totalRating = 0;
    let unanswered = 0;
    reviewsSnapshot.forEach((doc) => {
        const r = doc.data();
        const starMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
        totalRating += starMap[r.starRating] || 5;
        if (r.replyStatus === 'unanswered')
            unanswered++;
    });
    const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    const plan = await (0, copilot_1.generateGrowthCopilotPlan)({
        businessName: locData.title || 'Local Business',
        categories: locData.categories?.primaryCategory?.displayName ? [locData.categories.primaryCategory.displayName] : [],
        hasWebsite: Boolean(locData.websiteUri),
        hasPhone: Boolean(locData.phoneNumbers?.primaryPhone),
        hasHours: Boolean(locData.regularHours?.periods?.length),
        hasAddress: Boolean(locData.storefrontAddress?.addressLines?.length),
        totalReviews,
        averageRating: avgRating,
        unansweredReviewsCount: unanswered,
        hasPhotos: false,
    });
    await db.doc(`businesses/${businessId}/aiRecommendations/${encodeURIComponent(locationGoogleName)}`).set({
        ...plan,
        generatedAt: Date.now(),
    }, { merge: true });
    return plan;
});
//# sourceMappingURL=index.js.map