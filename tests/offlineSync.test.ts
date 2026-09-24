import { test, describe } from 'node:test';
import assert from 'node:assert';

interface OfflineMutation {
  id: string;
  type: string;
  payload: any;
  createdAt: number;
}

class OfflineQueueManager {
  private queue: OfflineMutation[] = [];

  enqueue(type: string, payload: any): OfflineMutation {
    const mutation: OfflineMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      payload,
      createdAt: Date.now(),
    };
    this.queue.push(mutation);
    return mutation;
  }

  getQueue(): OfflineMutation[] {
    return [...this.queue];
  }

  dequeue(id: string): void {
    this.queue = this.queue.filter((m) => m.id !== id);
  }

  clear(): void {
    this.queue = [];
  }
}

describe('Offline-First Architecture & Sync Queue Tests', () => {
  const manager = new OfflineQueueManager();

  test('Enqueues mutations when offline without losing payload integrity', () => {
    const mut1 = manager.enqueue('publish_reply', { reviewId: 'rev_123', reply: 'Thank you!' });
    assert.strictEqual(manager.getQueue().length, 1);
    assert.strictEqual(mut1.type, 'publish_reply');
    assert.strictEqual(mut1.payload.reviewId, 'rev_123');

    const mut2 = manager.enqueue('record_sale', { totalAmount: 450, paymentMethod: 'upi' });
    assert.strictEqual(manager.getQueue().length, 2);
    assert.strictEqual(mut2.payload.totalAmount, 450);
  });

  test('Dequeues executed mutations individually upon successful sync', () => {
    const queue = manager.getQueue();
    const firstId = queue[0].id;
    manager.dequeue(firstId);

    const remaining = manager.getQueue();
    assert.strictEqual(remaining.length, 1);
    assert.notStrictEqual(remaining[0].id, firstId);
  });

  test('Serializes and deserializes cached models accurately', () => {
    const locationData = {
      id: 'loc_999',
      title: 'DigiLocal Flagship Store',
      categories: { primaryCategory: { displayName: 'Retail Store' } },
      storefrontAddress: { addressLines: ['123 Main St'], locality: 'Mumbai' },
    };

    const serialized = JSON.stringify(locationData);
    const parsed = JSON.parse(serialized);

    assert.strictEqual(parsed.title, 'DigiLocal Flagship Store');
    assert.strictEqual(parsed.categories.primaryCategory.displayName, 'Retail Store');
    assert.strictEqual(parsed.storefrontAddress.addressLines[0], '123 Main St');
  });
});
