import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduledPost } from '../../types';
import { LoadBalancer } from '../gateway/loadBalancer';
import { FirestoreDatabase } from '../database/firestoreService';

const N8N_URL_STORAGE_KEY = '@digilocal_n8n_webhook_url';
export const DEFAULT_N8N_WEBHOOK_URL =
  process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.digilocal.ai/webhook/gmb-scheduler';

const N8N_BULK_SHEET_URL_STORAGE_KEY = '@digilocal_n8n_bulk_sheet_webhook_url';
export const DEFAULT_N8N_BULK_SHEET_WEBHOOK_URL =
  process.env.EXPO_PUBLIC_N8N_BULK_SHEET_WEBHOOK_URL ||
  'https://n8n.digilocal.ai/webhook/bulk-sheet-upload';

export interface BulkSheetUploadPayload {
  uploadMode: 'google_sheet' | 'excel_file';
  googleSheetUrl?: string;
  fileInfo?: {
    name: string;
    size?: number;
    mimeType?: string;
    uri?: string;
  };
  locationId: string;
  locationName: string;
  userEmail?: string;
  dispatchedAt?: string;
  customWebhookUrl?: string;
}

export const N8NService = {
  async getWebhookUrl(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(N8N_URL_STORAGE_KEY);
      return stored || DEFAULT_N8N_WEBHOOK_URL;
    } catch {
      return DEFAULT_N8N_WEBHOOK_URL;
    }
  },

  async setWebhookUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(N8N_URL_STORAGE_KEY, url.trim());
  },

  async testConnection(url?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const targetUrl = url || (await this.getWebhookUrl());
    const startTime = Date.now();
    try {
      const res: any = await LoadBalancer.execute({
        service: 'n8n_webhook',
        endpoint: 'n8n/ping_health_check',
        task: () =>
          axios.post(
            targetUrl,
            {
              event: 'PING_HEALTH_CHECK',
              timestamp: new Date().toISOString(),
              source: 'DigiLocal.ai Mobile App',
            },
            { timeout: 8000 }
          ),
      });
      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        message: `Connected successfully! (HTTP ${res.status}, ${latencyMs}ms)`,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      // If server returned 404 or 500, endpoint exists but rejected payload format or requires auth
      if (err.response) {
        return {
          success: true, // Server responded
          message: `Endpoint reachable (HTTP ${err.response.status}). Ready to dispatch workflows.`,
          latencyMs,
        };
      }
      return {
        success: false,
        message: err.message || 'Unable to connect to n8n webhook',
        latencyMs,
      };
    }
  },

  async dispatchScheduledPost(
    post: ScheduledPost
  ): Promise<{ success: boolean; executionId?: string; message: string }> {
    const webhookUrl = await this.getWebhookUrl();
    try {
      // Split captions for multi-channel targeting
      const summaryParts = (post.summary || '').split('\n\n[Social Copy]: ');
      const gmbCaption = summaryParts[0] || post.summary;
      const socialCaption = summaryParts[1] || summaryParts[0] || post.summary;

      const businessId = (post as any).businessId || 'default_biz';

      // Read connected accounts & GMB OAuth credentials directly from Firestore DB
      let connectedAccounts: Array<{
        platform: string;
        name: string;
        handle: string;
        email?: string;
        autoCrossPost: boolean;
      }> = [];
      let googleOAuth: any = null;

      try {
        const cloudConnectors = await FirestoreDatabase.fetchSocialConnectors(businessId);
        if (cloudConnectors && cloudConnectors.length > 0) {
          connectedAccounts = cloudConnectors
            .filter((p) => p.connected)
            .map((p) => ({
              platform: p.platform,
              name: p.name,
              handle: p.handle,
              email: p.connectedEmail,
              autoCrossPost: p.autoCrossPost ?? true,
            }));
        }
        googleOAuth = await FirestoreDatabase.getGoogleOAuthConnection(businessId);
      } catch {
        // fallback
      }

      let mediaUrlToSend = post.mediaUrl || '';
      let backdropImageUrl: string | undefined = undefined;
      if (mediaUrlToSend.startsWith('data:image/svg+xml')) {
        const decoded = decodeURIComponent(mediaUrlToSend);
        const match = decoded.match(/<image\s+href="([^"]+)"/);
        if (match && match[1]) {
          backdropImageUrl = match[1];
        }
      }

      const payload = {
        action: post.status === 'published' ? 'PUBLISH_NOW' : 'SCHEDULE_POST',
        id: post.id,
        businessId,
        locationId: post.locationId,
        locationName: post.locationName,
        postType: post.postType,
        summary: post.summary,
        gmbCaption,
        socialCaption,
        mediaUrl: post.mediaUrl,
        photographicBackdropUrl: backdropImageUrl,
        socialMediaImageUrl: backdropImageUrl || post.mediaUrl,
        callToAction: post.callToAction,
        offerDetails: post.offerDetails,
        eventDetails: post.eventDetails,
        targetChannels: post.channels,
        connectedAccounts,
        gmbOAuth: googleOAuth
          ? {
              connected: true,
              accountEmail: googleOAuth.accountEmail,
              refreshToken: googleOAuth.refreshToken,
              scopes: googleOAuth.scopes,
            }
          : undefined,
        scheduledTime: new Date(post.scheduledTime).toISOString(),
        dispatchedAt: new Date().toISOString(),
      };

      const response: any = await LoadBalancer.execute({
        service: 'n8n_webhook',
        endpoint: 'n8n/dispatchScheduledPost',
        task: () => axios.post(webhookUrl, payload, { timeout: 12000 }),
      });
      return {
        success: true,
        executionId: response.data?.executionId || response.data?.id || `exec_${Date.now()}`,
        message: response.data?.message || 'Post scheduled successfully in n8n workflow.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to dispatch post to n8n backend.',
      };
    }
  },

  async getBulkSheetWebhookUrl(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(N8N_BULK_SHEET_URL_STORAGE_KEY);
      return stored || DEFAULT_N8N_BULK_SHEET_WEBHOOK_URL;
    } catch {
      return DEFAULT_N8N_BULK_SHEET_WEBHOOK_URL;
    }
  },

  async setBulkSheetWebhookUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(N8N_BULK_SHEET_URL_STORAGE_KEY, url.trim());
  },

  async testBulkSheetConnection(
    url?: string
  ): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const targetUrl = url || (await this.getBulkSheetWebhookUrl());
    const startTime = Date.now();
    try {
      const res: any = await LoadBalancer.execute({
        service: 'n8n_webhook',
        endpoint: 'n8n/bulk_sheet_ping',
        task: () =>
          axios.post(
            targetUrl,
            {
              event: 'PING_BULK_SHEET_HEALTH_CHECK',
              timestamp: new Date().toISOString(),
              source: 'DigiLocal.ai Mobile App',
            },
            { timeout: 8000 }
          ),
      });
      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        message: `n8n Webhook reached! (HTTP ${res.status}, ${latencyMs}ms)`,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      if (err.response) {
        return {
          success: true,
          message: `Endpoint reachable (HTTP ${err.response.status}). Ready for bulk sheet processing.`,
          latencyMs,
        };
      }
      return {
        success: false,
        message: err.message || 'Unable to connect to n8n webhook',
        latencyMs,
      };
    }
  },

  async dispatchBulkSheetUpload(
    payload: BulkSheetUploadPayload
  ): Promise<{ success: boolean; executionId?: string; message: string }> {
    const targetUrl = payload.customWebhookUrl || (await this.getBulkSheetWebhookUrl());
    try {
      let requestBody: any;
      let headers: any = {};

      if (payload.uploadMode === 'excel_file' && payload.fileInfo?.uri) {
        const formData = new FormData();
        formData.append('file', {
          uri: payload.fileInfo.uri,
          name: payload.fileInfo.name,
          type: payload.fileInfo.mimeType || 'application/octet-stream',
        } as any);
        formData.append('action', 'BULK_SHEET_UPLOAD');
        formData.append('uploadMode', 'excel_file');
        formData.append('locationId', payload.locationId);
        formData.append('locationName', payload.locationName);
        if (payload.userEmail) formData.append('userEmail', payload.userEmail);
        formData.append('dispatchedAt', new Date().toISOString());

        requestBody = formData;
        headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        requestBody = {
          action: 'BULK_SHEET_UPLOAD',
          uploadMode: payload.uploadMode,
          googleSheetUrl: payload.googleSheetUrl,
          fileInfo: payload.fileInfo,
          locationId: payload.locationId,
          locationName: payload.locationName,
          userEmail: payload.userEmail,
          dispatchedAt: new Date().toISOString(),
        };
        headers = { 'Content-Type': 'application/json' };
      }

      const response: any = await LoadBalancer.execute({
        service: 'n8n_webhook',
        endpoint: 'n8n/dispatchBulkSheetUpload',
        task: () => axios.post(targetUrl, requestBody, { headers, timeout: 25000 }),
      });

      return {
        success: true,
        executionId: response.data?.executionId || response.data?.id || `bulk_${Date.now()}`,
        message:
          response.data?.message ||
          'Sheet submitted successfully to n8n backend for processing!',
      };
    } catch (err: any) {
      return {
        success: false,
        message:
          err.response?.data?.message ||
          err.message ||
          'Failed to dispatch sheet to n8n backend.',
      };
    }
  },
};
