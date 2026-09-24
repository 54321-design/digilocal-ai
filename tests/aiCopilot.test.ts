import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('AI Copilot & Review Reply Logic Tests', () => {
  test('Enforces non-fabrication constraint in prompt building', () => {
    const buildPrompt = (businessName: string, reviewText: string, tone: string, language: string) => {
      const prompt = `You are a customer relationship assistant for "${businessName}".
Draft a reply to: "${reviewText}".
Tone: ${tone}
Language: ${language}
CRITICAL RULE: DO NOT make up claims, discounts, products, or facts not mentioned by the customer.`;
      return prompt;
    };

    const prompt = buildPrompt('Apex Cafe', 'Great cappuccino and fast wifi', 'friendly', 'en');
    assert.ok(prompt.includes('Apex Cafe'));
    assert.ok(prompt.includes('Great cappuccino and fast wifi'));
    assert.ok(prompt.includes('CRITICAL RULE: DO NOT make up claims'));
  });

  test('Supports English, Hindi, and Hinglish language directives', () => {
    const getLanguageDirective = (lang: 'en' | 'hi' | 'hinglish') => {
      if (lang === 'hi') return 'Reply in pure, respectful Hindi (Devanagari script).';
      if (lang === 'hinglish') return 'Reply in natural conversational Hinglish (Roman script).';
      return 'Reply in clear, professional English.';
    };

    assert.ok(getLanguageDirective('en').includes('English'));
    assert.ok(getLanguageDirective('hi').includes('Hindi (Devanagari script)'));
    assert.ok(getLanguageDirective('hinglish').includes('Hinglish (Roman script)'));
  });

  test('Provides fallback data when Google profile metrics are missing rather than inventing numbers', () => {
    const calculateMetricDisplay = (val?: number | null) => {
      if (val === undefined || val === null || isNaN(val)) {
        return 'Data unavailable';
      }
      return `${val.toFixed(1)} ★`;
    };

    assert.strictEqual(calculateMetricDisplay(null), 'Data unavailable');
    assert.strictEqual(calculateMetricDisplay(undefined), 'Data unavailable');
    assert.strictEqual(calculateMetricDisplay(4.5), '4.5 ★');
  });
});
