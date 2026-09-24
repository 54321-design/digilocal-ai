import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

let genAIClient: GoogleGenAI | null = null;
if (apiKey) {
  genAIClient = new GoogleGenAI({ apiKey });
}

export type ReplyTone = 'professional' | 'friendly' | 'warm' | 'concise' | 'apologetic';
export type ReplyLanguage = 'en' | 'hi' | 'hinglish';

export interface AIReviewParams {
  businessName: string;
  reviewerName?: string;
  starRating: number;
  reviewComment?: string;
  tone: ReplyTone;
  language: ReplyLanguage;
}

export const AIService = {
  async generateReviewReply(params: AIReviewParams): Promise<string> {
    if (!genAIClient) {
      throw new Error('Gemini API key is not configured in .env');
    }

    const langInstruction =
      params.language === 'hi'
        ? 'Reply in pure, respectful Hindi (in Devanagari script).'
        : params.language === 'hinglish'
        ? 'Reply in natural, contemporary conversational Hinglish (Hindi words written in English/Roman script) as used by modern Indian customers.'
        : 'Reply in clear, professional English.';

    const toneInstruction = {
      professional: 'Tone: Polite, formal, respectful, and courteous.',
      friendly: 'Tone: Warm, enthusiastic, cheerful, and welcoming.',
      warm: 'Tone: Heartfelt, genuine, and deeply appreciative.',
      concise: 'Tone: Short, direct, respectful, and strictly to the point.',
      apologetic: 'Tone: Empathetic, sincere apology for the issue, and proactive resolution offer.',
    }[params.tone];

    const prompt = `You are the Google Business Profile manager for "${params.businessName}".
Draft a response to this customer's Google Review.

Review:
- Reviewer: ${params.reviewerName || 'Customer'}
- Rating: ${params.starRating} Stars out of 5
- Review Text: "${params.reviewComment || '(Customer did not leave text, rating only)'}"

Instructions:
1. ${toneInstruction}
2. ${langInstruction}
3. Length: 2 to 4 concise sentences.
4. STRICT RULE: DO NOT make up claims, discounts, products, or facts not mentioned by the customer.
5. End with a polite closing like "Warm regards, Team ${params.businessName}". Do not use bracketed placeholders.`;

    const response = await genAIClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || 'Thank you for your valuable feedback!';
  },

  async generateGrowthCopilotRecommendations(data: {
    businessName: string;
    locationTitle: string;
    categories: string[];
    hasAddress: boolean;
    hasPhone: boolean;
    hasWebsite: boolean;
    hasHours: boolean;
    reviewCount: number;
    avgRating: number;
    unansweredCount: number;
  }): Promise<{
    summary: string;
    actionPlan: string[];
    seoInsights: string[];
    postIdeas: string[];
  }> {
    if (!genAIClient) {
      throw new Error('Gemini API key is not configured in .env');
    }

    const prompt = `You are DigiLocal.ai's Local Business Growth Copilot for "${data.businessName}" (${data.locationTitle}).
Analyze this real connected Google Business Profile data and return evidence-grounded recommendations:

Current Profile State:
- Business: ${data.businessName}
- Category: ${data.categories.join(', ') || 'Unspecified'}
- Verified Storefront Address: ${data.hasAddress ? 'Yes' : 'Missing address'}
- Phone Number: ${data.hasPhone ? 'Yes' : 'Missing contact number'}
- Website: ${data.hasWebsite ? 'Yes' : 'Missing website URL'}
- Regular Hours: ${data.hasHours ? 'Configured' : 'Missing business hours'}
- Total Google Reviews: ${data.reviewCount}
- Average Star Rating: ${data.avgRating > 0 ? data.avgRating.toFixed(1) : 'No reviews'}
- Unanswered Reviews: ${data.unansweredCount}

Respond ONLY in valid JSON matching this schema:
{
  "summary": "2-sentence executive summary of the business profile status",
  "actionPlan": ["3 specific immediate steps the owner should do this week"],
  "seoInsights": ["3 local SEO optimizations based strictly on the above data"],
  "postIdeas": ["2 engaging Google Post ideas for this local business"]
}`;

    const response = await genAIClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch {
      return {
        summary: 'Profile analyzed. Focus on addressing unanswered reviews and maintaining up-to-date business hours.',
        actionPlan: [
          'Reply to all pending reviews promptly.',
          'Verify that business hours and contact info are accurate.',
        ],
        seoInsights: ['Complete all available fields in Google Business Profile to boost local pack ranking.'],
        postIdeas: ['Share an update on current offerings or weekly specials.'],
      };
    }
  },
};
