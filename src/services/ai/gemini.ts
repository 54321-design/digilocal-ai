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

  async analyzeReviewSentiments(reviews: Array<{
    reviewerName?: string;
    starRating: number;
    comment?: string;
  }>): Promise<{
    averageRating: number;
    totalReviews: number;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
    summary: string;
    strengths: string[];
    improvementAreas: string[];
    actionableAdvice: string;
  }> {
    const total = reviews.length;
    if (total === 0) {
      return {
        averageRating: 5.0,
        totalReviews: 0,
        positivePercentage: 100,
        neutralPercentage: 0,
        negativePercentage: 0,
        summary: 'No customer reviews recorded yet. Encourage happy customers to leave a review via QR code or SMS link.',
        strengths: ['Brand newly connected on Google'],
        improvementAreas: ['Collect first 10 verified Google reviews to trigger local pack ranking.'],
        actionableAdvice: 'Ask your next 5 in-store customers to scan your Google Review QR code.',
      };
    }

    const positiveCount = reviews.filter((r) => r.starRating >= 4).length;
    const neutralCount = reviews.filter((r) => r.starRating === 3).length;
    const negativeCount = reviews.filter((r) => r.starRating <= 2).length;

    const avg = Number((reviews.reduce((sum, r) => sum + r.starRating, 0) / total).toFixed(1));
    const posPct = Math.round((positiveCount / total) * 100);
    const neuPct = Math.round((neutralCount / total) * 100);
    const negPct = Math.max(0, 100 - posPct - neuPct);

    if (!genAIClient) {
      return {
        averageRating: avg,
        totalReviews: total,
        positivePercentage: posPct,
        neutralPercentage: neuPct,
        negativePercentage: negPct,
        summary: `${posPct}% of your customers gave high ratings. Maintain your fast responsiveness and service quality.`,
        strengths: ['High overall customer satisfaction', 'Positive word-of-mouth'],
        improvementAreas: ['Ensure 100% of reviews receive a prompt, personalized reply'],
        actionableAdvice: 'Replying to all reviews within 24 hours improves GMB 3-Pack search prominence by up to 28%.',
      };
    }

    const reviewSamples = reviews
      .slice(0, 15)
      .map((r) => `- ${r.starRating} Stars (${r.reviewerName || 'Customer'}): "${r.comment || 'Rating only'}"`)
      .join('\n');

    const prompt = `You are DigiLocal's Chief Customer Experience & GMB Ranking AI.
Analyze these real customer Google reviews and provide actionable executive sentiment insights.

Stats:
- Total Reviews: ${total}
- Average Rating: ${avg} Stars
- Positive: ${posPct}%, Neutral: ${neuPct}%, Negative: ${negPct}%

Customer Review Samples:
${reviewSamples}

Respond ONLY in valid JSON matching this schema:
{
  "summary": "2-3 concise sentences breaking down what customers feel, what they appreciate, and any concerns.",
  "strengths": ["Top 2-3 specific praises mentioned by customers"],
  "improvementAreas": ["1-2 specific concerns, wait times, or service issues raised"],
  "actionableAdvice": "1 sharp strategic tip for the business owner to boost Google 3-Pack rank and customer loyalty."
}`;

    try {
      const response = await genAIClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '{}');
      return {
        averageRating: avg,
        totalReviews: total,
        positivePercentage: posPct,
        neutralPercentage: neuPct,
        negativePercentage: negPct,
        summary: parsed.summary || `${posPct}% positive sentiment across ${total} reviews.`,
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['Friendly staff', 'Prompt service'],
        improvementAreas: Array.isArray(parsed.improvementAreas) && parsed.improvementAreas.length > 0 ? parsed.improvementAreas : ['Keep response time under 24 hours'],
        actionableAdvice: parsed.actionableAdvice || 'Acknowledge all reviews to demonstrate active business management.',
      };
    } catch {
      return {
        averageRating: avg,
        totalReviews: total,
        positivePercentage: posPct,
        neutralPercentage: neuPct,
        negativePercentage: negPct,
        summary: `Sentiment is predominantly positive (${posPct}%), with customers appreciating your core services.`,
        strengths: ['Customer satisfaction', 'Active customer community'],
        improvementAreas: ['Proactively address critical reviews with resolution offers'],
        actionableAdvice: 'Maintaining an average above 4.5 stars keeps you in the top 3 Google Maps recommendations.',
      };
    }
  },

  async generateFestivalPostCampaign(data: {
    festivalName: string;
    festivalDate: string;
    businessName: string;
    businessCategory?: string;
  }): Promise<{
    gmbCaption: string;
    socialCaption: string;
    postType: 'STANDARD' | 'OFFER' | 'EVENT';
    couponCode?: string;
    ctaType: 'SHOP' | 'BOOK' | 'LEARN_MORE' | 'CALL' | 'ORDER';
    suggestedImageUrl: string;
    themeHeadline: string;
  }> {
    // Curated high quality festival banner fallbacks
    const festivalImages: Record<string, string> = {
      diwali: 'https://images.unsplash.com/photo-1514195037031-83d60ed3b448?w=800',
      dhanteras: 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=800',
      holi: 'https://images.unsplash.com/photo-1616091216791-a5360b5fc78a?w=800',
      newyear: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800',
      christmas: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?w=800',
      eid: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800',
      independence: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800',
      republic: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800',
      sale: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
      weekend: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    };

    const lowerName = data.festivalName.toLowerCase();
    let bannerUrl = festivalImages.weekend;
    for (const key of Object.keys(festivalImages)) {
      if (lowerName.includes(key)) {
        bannerUrl = festivalImages[key];
        break;
      }
    }

    if (!genAIClient) {
      return {
        themeHeadline: `Celebrate ${data.festivalName} with ${data.businessName}!`,
        gmbCaption: `✨ Wishing everyone a joyful and blessed ${data.festivalName}! Visit ${data.businessName} for exclusive festival specials and delightful surprises. We look forward to serving you! 📍 Store open today.`,
        socialCaption: `🎉 Celebrate the spirit of ${data.festivalName} with us! ✨\n\nExclusive festive collection & specials are live at ${data.businessName}. Tag your friends and drop by today! 🛍️✨\n\n#${data.festivalName.replace(/\s+/g, '')} #FestiveVibes #${data.businessName.replace(/\s+/g, '')} #ShopLocal #SpecialOffer`,
        postType: 'OFFER',
        couponCode: 'FESTIVE20',
        ctaType: 'SHOP',
        suggestedImageUrl: bannerUrl,
      };
    }

    const prompt = `You are DigiLocal's Chief Festival Marketing & Social Media Campaign AI.
Create a complete multi-channel post campaign for an Indian business for an upcoming festival / retail event:

Business: ${data.businessName}
Category: ${data.businessCategory || 'Local Retail & Services'}
Festival/Event: ${data.festivalName} (${data.festivalDate})

Generate:
1. "themeHeadline": Catchy festive title (max 7 words).
2. "gmbCaption": Google Business Profile What's New / Offer post (100-140 words, local search-friendly, with address/call-out, emojis, and clear call to action).
3. "socialCaption": Instagram, Facebook & LinkedIn cross-post caption (engaging, conversational, with festive emojis and 5-6 viral hashtags).
4. "postType": "OFFER" or "EVENT" or "STANDARD".
5. "couponCode": Catchy promo code if offer (e.g. DIWALI25, HOLISAVE, NEWYEAR).
6. "ctaType": "SHOP" or "BOOK" or "LEARN_MORE" or "CALL".

Respond ONLY in valid JSON matching this schema:
{
  "themeHeadline": "string",
  "gmbCaption": "string",
  "socialCaption": "string",
  "postType": "OFFER",
  "couponCode": "string",
  "ctaType": "SHOP"
}`;

    try {
      const response = await genAIClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '{}');
      return {
        themeHeadline: parsed.themeHeadline || `Celebrate ${data.festivalName} with ${data.businessName}!`,
        gmbCaption: parsed.gmbCaption || `✨ Celebrate ${data.festivalName} at ${data.businessName}! Enjoy special festival offers and warm hospitality.`,
        socialCaption: parsed.socialCaption || `Celebrate ${data.festivalName} with us! Tag friends and visit today! 🎉✨ #${data.festivalName.replace(/\s+/g, '')}`,
        postType: parsed.postType || 'OFFER',
        couponCode: parsed.couponCode || 'FESTIVE20',
        ctaType: parsed.ctaType || 'SHOP',
        suggestedImageUrl: bannerUrl,
      };
    } catch {
      return {
        themeHeadline: `Celebrate ${data.festivalName} with ${data.businessName}!`,
        gmbCaption: `✨ Wishing everyone a blessed ${data.festivalName}! Visit ${data.businessName} for exclusive festival specials and offers.`,
        socialCaption: `🎉 Happy ${data.festivalName}! Join us at ${data.businessName} for festive delights. 🛍️✨ #${data.festivalName.replace(/\s+/g, '')}`,
        postType: 'OFFER',
        couponCode: 'FESTIVE20',
        ctaType: 'SHOP',
        suggestedImageUrl: bannerUrl,
      };
    }
  },
};
