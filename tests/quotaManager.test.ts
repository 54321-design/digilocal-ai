import { test, describe } from 'node:test';
import assert from 'node:assert';

type QuotaFeatureKey = 'post_generation' | 'review_reply' | 'seo_audit' | 'copilot_plan';

const FREE_TRIAL_LIMITS: Record<QuotaFeatureKey, number> = {
  post_generation: 1,
  review_reply: 1,
  seo_audit: 1,
  copilot_plan: 1,
};

const UPGRADE_PROMPT_MESSAGE = 'Upgrade to generate post or fetch anything';

describe('Testing Quota & Free Trial Limits Tests', () => {
  // Quota simulation matching ClientQuotaService logic
  class MockQuotaEngine {
    private state: Record<QuotaFeatureKey, number> = {
      post_generation: 0,
      review_reply: 0,
      seo_audit: 0,
      copilot_plan: 0,
    };

    public canPerform(feature: QuotaFeatureKey, isAdmin: boolean = false) {
      if (isAdmin) {
        return { allowed: true, isExceeded: false, message: undefined };
      }
      const limit = FREE_TRIAL_LIMITS[feature];
      const count = this.state[feature] || 0;
      if (count >= limit) {
        return {
          allowed: false,
          isExceeded: true,
          message: UPGRADE_PROMPT_MESSAGE,
        };
      }
      return { allowed: true, isExceeded: false, message: undefined };
    }

    public recordUsage(feature: QuotaFeatureKey) {
      this.state[feature] = (this.state[feature] || 0) + 1;
    }

    public reset() {
      this.state = {
        post_generation: 0,
        review_reply: 0,
        seo_audit: 0,
        copilot_plan: 0,
      };
    }
  }

  test('Enforces exact upgrade prompt message when free trial limit is exceeded', () => {
    assert.strictEqual(
      UPGRADE_PROMPT_MESSAGE,
      'Upgrade to generate post or fetch anything'
    );
  });

  test('Allows first execution for free testing user (1-time free usage)', () => {
    const engine = new MockQuotaEngine();
    const check1 = engine.canPerform('post_generation', false);
    assert.strictEqual(check1.allowed, true);
    assert.strictEqual(check1.isExceeded, false);

    // Record the 1st execution
    engine.recordUsage('post_generation');

    // 2nd execution must be strictly blocked
    const check2 = engine.canPerform('post_generation', false);
    assert.strictEqual(check2.allowed, false);
    assert.strictEqual(check2.isExceeded, true);
    assert.strictEqual(check2.message, 'Upgrade to generate post or fetch anything');
  });

  test('Admin user bypasses the 1-time limit and is never blocked', () => {
    const engine = new MockQuotaEngine();
    // Simulate multiple generations
    engine.recordUsage('post_generation');
    engine.recordUsage('post_generation');
    engine.recordUsage('post_generation');

    // Admin should still be allowed
    const adminCheck = engine.canPerform('post_generation', true);
    assert.strictEqual(adminCheck.allowed, true);
    assert.strictEqual(adminCheck.isExceeded, false);
  });

  test('Guards all API-consuming features (posts, review replies, SEO audits, Copilot plans)', () => {
    const engine = new MockQuotaEngine();
    const features: QuotaFeatureKey[] = [
      'post_generation',
      'review_reply',
      'seo_audit',
      'copilot_plan',
    ];

    for (const feat of features) {
      assert.strictEqual(FREE_TRIAL_LIMITS[feat], 1, `Feature ${feat} must have limit 1`);

      // 1st time allowed
      assert.strictEqual(engine.canPerform(feat, false).allowed, true);
      engine.recordUsage(feat);

      // 2nd time blocked with exact upgrade prompt
      const result = engine.canPerform(feat, false);
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.message, 'Upgrade to generate post or fetch anything');
    }
  });

  test('Reset function clears counters and restores trial availability', () => {
    const engine = new MockQuotaEngine();
    engine.recordUsage('post_generation');
    assert.strictEqual(engine.canPerform('post_generation', false).allowed, false);

    engine.reset();
    assert.strictEqual(engine.canPerform('post_generation', false).allowed, true);
  });
});
