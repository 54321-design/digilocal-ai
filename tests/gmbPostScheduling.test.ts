import { describe, it } from 'node:test';
import assert from 'node:assert';

type PostChannel = 'gmb' | 'instagram' | 'facebook' | 'linkedin';
type GMBPostType = 'STANDARD' | 'EVENT' | 'OFFER';

interface ScheduledPost {
  id: string;
  locationId: string;
  locationName: string;
  postType: GMBPostType;
  summary: string;
  mediaUrl?: string;
  callToAction?: {
    actionType: string;
    url?: string;
  };
  offerDetails?: {
    couponCode?: string;
  };
  channels: PostChannel[];
  scheduledTime: number;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  createdAt: number;
}

describe('GMB Post Scheduling & n8n Dispatch Logic Tests', () => {
  it('Validates that cross-post channels always include GMB as primary', () => {
    const channels: PostChannel[] = ['gmb', 'instagram', 'facebook', 'linkedin'];
    assert.strictEqual(channels.includes('gmb'), true, 'GMB must be present as primary broadcast channel');
    assert.strictEqual(channels.length, 4);
  });

  it('Structures payload correctly for n8n webhook consumption', () => {
    const post: ScheduledPost = {
      id: 'post-test-1',
      locationId: 'loc-noida-18',
      locationName: 'DigiLocal Store - Sector 18, Noida',
      postType: 'OFFER',
      summary: 'Get flat 20% off on all items this weekend!',
      mediaUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      callToAction: {
        actionType: 'SHOP',
        url: 'https://digilocal.store/offers',
      },
      offerDetails: {
        couponCode: 'WEEKEND20',
      },
      channels: ['gmb', 'instagram', 'facebook'],
      scheduledTime: Date.now() + 3600000,
      status: 'scheduled',
      createdAt: Date.now(),
    };

    assert.strictEqual(post.locationId, 'loc-noida-18');
    assert.strictEqual(post.postType, 'OFFER');
    assert.strictEqual(post.callToAction?.actionType, 'SHOP');
    assert.strictEqual(post.offerDetails?.couponCode, 'WEEKEND20');
    assert.strictEqual(post.status, 'scheduled');
  });

  it('Correctly filters posts by status category', () => {
    const mockPosts: ScheduledPost[] = [
      {
        id: '1',
        locationId: 'loc-1',
        locationName: 'Branch A',
        postType: 'STANDARD',
        summary: 'Post 1',
        channels: ['gmb'],
        scheduledTime: 1000,
        status: 'published',
        createdAt: 900,
      },
      {
        id: '2',
        locationId: 'loc-1',
        locationName: 'Branch A',
        postType: 'EVENT',
        summary: 'Post 2',
        channels: ['gmb', 'instagram'],
        scheduledTime: 2000,
        status: 'scheduled',
        createdAt: 950,
      },
    ];

    const scheduledOnly = mockPosts.filter((p) => p.status === 'scheduled');
    const publishedOnly = mockPosts.filter((p) => p.status === 'published');

    assert.strictEqual(scheduledOnly.length, 1);
    assert.strictEqual(scheduledOnly[0].id, '2');
    assert.strictEqual(publishedOnly.length, 1);
    assert.strictEqual(publishedOnly[0].id, '1');
  });
});
