import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduledPost, PostChannel, GMBPostType, PostCallToAction } from '../types';
import { N8NService, DEFAULT_N8N_WEBHOOK_URL } from '../services/n8n/webhook';
import { useGoogle } from './GoogleContext';

const POSTS_STORAGE_KEY = '@digilocal_scheduled_posts';

interface CreatePostInput {
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
  scheduledTime: number;
}

interface PostsContextType {
  posts: ScheduledPost[];
  isLoading: boolean;
  n8nWebhookUrl: string;
  updateWebhookUrl: (url: string) => Promise<void>;
  testWebhook: () => Promise<{ success: boolean; message: string; latencyMs?: number }>;
  schedulePost: (input: CreatePostInput) => Promise<{ success: boolean; message: string }>;
  publishNow: (postId: string) => Promise<{ success: boolean; message: string }>;
  deletePost: (postId: string) => Promise<void>;
  filter: 'all' | 'scheduled' | 'published' | 'draft';
  setFilter: (filter: 'all' | 'scheduled' | 'published' | 'draft') => void;
  filteredPosts: ScheduledPost[];
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedLocation } = useGoogle();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [n8nWebhookUrl, setN8nWebhookUrlState] = useState<string>(DEFAULT_N8N_WEBHOOK_URL);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'published' | 'draft'>('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const storedUrl = await N8NService.getWebhookUrl();
      setN8nWebhookUrlState(storedUrl);

      const storedPosts = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      if (storedPosts) {
        setPosts(JSON.parse(storedPosts));
      } else {
        // Sample scheduled and published posts for rich instant preview
        const initialSamplePosts: ScheduledPost[] = [
          {
            id: 'post_sample_1',
            locationId: 'accounts/101/locations/201',
            locationName: 'DigiLocal Super Store (Sector 18)',
            postType: 'OFFER',
            summary: '🔥 Weekend Flash Sale! Flat 25% off on all fresh organic groceries & daily essentials. Show this Google post at billing.',
            mediaUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
            callToAction: { actionType: 'ORDER', url: 'https://digilocal.ai/store' },
            offerDetails: {
              couponCode: 'WEEKEND25',
              termsConditions: 'Valid on in-store purchases above ₹500. One per customer.',
            },
            channels: ['gmb', 'instagram', 'facebook'],
            scheduledTime: Date.now() + 1000 * 60 * 60 * 24, // Tomorrow
            status: 'scheduled',
            createdAt: Date.now() - 1000 * 60 * 60 * 2,
          },
          {
            id: 'post_sample_2',
            locationId: 'accounts/101/locations/201',
            locationName: 'DigiLocal Super Store (Sector 18)',
            postType: 'STANDARD',
            summary: '✨ Fresh harvest alert! Direct from farm hydroponic greens and seasonal fruits now restocked. Open till 10 PM tonight!',
            mediaUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80',
            callToAction: { actionType: 'CALL' },
            channels: ['gmb', 'facebook'],
            scheduledTime: Date.now() + 1000 * 60 * 60 * 48, // 2 days later
            status: 'scheduled',
            createdAt: Date.now() - 1000 * 60 * 60 * 6,
          },
          {
            id: 'post_sample_3',
            locationId: 'accounts/101/locations/201',
            locationName: 'DigiLocal Super Store (Sector 18)',
            postType: 'STANDARD',
            summary: 'We now accept contactless UPI & high-speed home deliveries within 30 minutes in Sector 18 & nearby areas!',
            channels: ['gmb', 'linkedin'],
            scheduledTime: Date.now() - 1000 * 60 * 60 * 24 * 3,
            status: 'published',
            n8nWebhookResponse: 'Dispatched to GMB + LinkedIn via n8n workflow #8410',
            createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
          },
        ];
        setPosts(initialSamplePosts);
        await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(initialSamplePosts));
      }
    } catch (e) {
      console.warn('Error loading posts data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const savePosts = async (updated: ScheduledPost[]) => {
    setPosts(updated);
    await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
  };

  const updateWebhookUrl = async (url: string) => {
    await N8NService.setWebhookUrl(url);
    setN8nWebhookUrlState(url);
  };

  const testWebhook = async () => {
    return await N8NService.testConnection(n8nWebhookUrl);
  };

  const schedulePost = async (input: CreatePostInput): Promise<{ success: boolean; message: string }> => {
    const newPost: ScheduledPost = {
      id: `post_${Date.now()}`,
      locationId: selectedLocation?.id || selectedLocation?.googleName || 'loc_active',
      locationName: selectedLocation?.title || 'Selected Business Location',
      postType: input.postType,
      summary: input.summary,
      mediaUrl: input.mediaUrl,
      callToAction: input.callToAction,
      offerDetails: input.offerDetails,
      eventDetails: input.eventDetails,
      channels: input.channels,
      scheduledTime: input.scheduledTime,
      status: input.scheduledTime <= Date.now() + 60000 ? 'published' : 'scheduled',
      createdAt: Date.now(),
    };

    // If immediate or close, dispatch to n8n backend
    let n8nResult = null;
    try {
      n8nResult = await N8NService.dispatchScheduledPost(newPost);
      if (n8nResult.success) {
        newPost.n8nWebhookResponse = n8nResult.message;
      }
    } catch {
      // offline fallback
    }

    const updated = [newPost, ...posts];
    await savePosts(updated);

    return {
      success: true,
      message:
        newPost.status === 'published'
          ? 'Post published to channels via n8n backend!'
          : 'Post scheduled successfully in n8n automation queue.',
    };
  };

  const publishNow = async (postId: string): Promise<{ success: boolean; message: string }> => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return { success: false, message: 'Post not found' };

    const dispatchResult = await N8NService.dispatchScheduledPost(target);
    const updated = posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            status: 'published' as const,
            n8nWebhookResponse: dispatchResult.message,
          }
        : p
    );
    await savePosts(updated);
    return dispatchResult;
  };

  const deletePost = async (postId: string) => {
    const updated = posts.filter((p) => p.id !== postId);
    await savePosts(updated);
  };

  const filteredPosts = posts.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <PostsContext.Provider
      value={{
        posts,
        isLoading,
        n8nWebhookUrl,
        updateWebhookUrl,
        testWebhook,
        schedulePost,
        publishNow,
        deletePost,
        filter,
        setFilter,
        filteredPosts,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) throw new Error('usePosts must be used within PostsProvider');
  return context;
};
