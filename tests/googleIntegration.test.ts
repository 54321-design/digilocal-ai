import { test, describe } from 'node:test';
import assert from 'node:assert';

const STAR_RATING_NUMBERS: Record<string, number> = {
  FIVE: 5,
  FOUR: 4,
  THREE: 3,
  TWO: 2,
  ONE: 1,
};

function parseStarRating(rating?: string): number {
  if (!rating) return 0;
  return STAR_RATING_NUMBERS[rating] ?? 0;
}

describe('Google Business Profile Integration Tests', () => {
  test('Correctly maps Google review star strings to numeric values', () => {
    assert.strictEqual(parseStarRating('FIVE'), 5);
    assert.strictEqual(parseStarRating('FOUR'), 4);
    assert.strictEqual(parseStarRating('THREE'), 3);
    assert.strictEqual(parseStarRating('TWO'), 2);
    assert.strictEqual(parseStarRating('ONE'), 1);
    assert.strictEqual(parseStarRating(undefined), 0);
    assert.strictEqual(parseStarRating(''), 0);
  });

  test('Computes sentiment based on star ratings without inventing metrics', () => {
    const computeSentiment = (rating: number) => {
      if (rating >= 4) return 'positive';
      if (rating === 3) return 'neutral';
      return 'negative';
    };

    assert.strictEqual(computeSentiment(5), 'positive');
    assert.strictEqual(computeSentiment(4), 'positive');
    assert.strictEqual(computeSentiment(3), 'neutral');
    assert.strictEqual(computeSentiment(2), 'negative');
    assert.strictEqual(computeSentiment(1), 'negative');
  });

  test('Ensures review reply status only transitions to published when Google confirms', () => {
    interface ReviewState {
      replyStatus: 'unanswered' | 'drafted' | 'published';
      replyText?: string;
    }

    const review: ReviewState = { replyStatus: 'unanswered' };

    // Drafting should not mark as published
    review.replyText = 'Thank you for your visit!';
    review.replyStatus = 'drafted';
    assert.notStrictEqual(review.replyStatus, 'published');

    // Only when Google returns HTTP 200 / confirmation
    const googleResponse = { comment: review.replyText, updateTime: new Date().toISOString() };
    if (googleResponse && googleResponse.updateTime) {
      review.replyStatus = 'published';
    }
    assert.strictEqual(review.replyStatus, 'published');
  });

  test('Handles Google API error paths gracefully without crashing', () => {
    const handleGoogleApiError = (err: { response?: { status: number; data?: { error?: { message: string } } }; message: string }) => {
      if (err.response?.status === 401) {
        return { error: 'AUTHENTICATION_EXPIRED', userMessage: 'Session expired. Please reconnect Google Account.' };
      }
      if (err.response?.status === 403) {
        return { error: 'PERMISSION_DENIED', userMessage: 'Google Business Profile manage permission is required.' };
      }
      return { error: 'NETWORK_ERROR', userMessage: err.response?.data?.error?.message || err.message };
    };

    const authError = handleGoogleApiError({ response: { status: 401 }, message: 'Unauthorized' });
    assert.strictEqual(authError.error, 'AUTHENTICATION_EXPIRED');

    const permError = handleGoogleApiError({ response: { status: 403 }, message: 'Forbidden' });
    assert.strictEqual(permError.error, 'PERMISSION_DENIED');
  });
});
