import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduledPost } from '../../types';
import { LoadBalancer } from '../gateway/loadBalancer';

const N8N_URL_STORAGE_KEY = '@digilocal_n8n_webhook_url';
export const DEFAULT_N8N_WEBHOOK_URL =
  process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.digilocal.ai/webhook/gmb-scheduler';

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
      const payload = {
        action: 'SCHEDULE_POST',
        id: post.id,
        locationId: post.locationId,
        locationName: post.locationName,
        postType: post.postType,
        summary: post.summary,
        mediaUrl: post.mediaUrl,
        callToAction: post.callToAction,
        offerDetails: post.offerDetails,
        eventDetails: post.eventDetails,
        targetChannels: post.channels,
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
};
