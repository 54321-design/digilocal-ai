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
    customTopic?: string;
  }): Promise<{
    gmbCaption: string;
    socialCaption: string;
    postType: 'STANDARD' | 'OFFER' | 'EVENT';
    couponCode?: string;
    ctaType: 'SHOP' | 'BOOK' | 'LEARN_MORE' | 'CALL' | 'ORDER';
    suggestedImageUrl: string;
    imagePrompt: string;
    themeHeadline: string;
  }> {
    const category = data.businessCategory?.trim() || 'Local Business & Services';
    const customAngle = data.customTopic?.trim() || '';
    const seed = Math.floor(10000 + Math.random() * 90000);

    const buildFluxImageUrl = (visualPrompt: string) =>
      `https://image.pollinations.ai/prompt/${encodeURIComponent(
        visualPrompt
      )}?width=1024&height=576&nologo=true&model=flux&seed=${seed}`;

    const defaultVisualPrompt = `Professional commercial festival marketing banner for Indian festival ${data.festivalName}, tailored for a ${category} business named ${data.businessName}. ${
      customAngle ? `Focus on: ${customAngle}.` : ''
    } Authentic Indian festive elements for ${data.festivalName} (traditional decor, marigold flowers, warm festive lighting, gift boxes), modern high-end ${category} branding aesthetic, ultra-detailed, 8k resolution, vibrant colors, no text watermark, no unrelated restaurant or cafe tables`;

    if (!genAIClient) {
      return {
        themeHeadline: `${data.festivalName} Specials at ${data.businessName}`,
        gmbCaption: `✨ Wishing you and your family a joyful ${data.festivalName}! Celebrate this special occasion with ${data.businessName} (${category}). ${
          customAngle ? `${customAngle} ` : ''
        }Contact us or visit today to avail our exclusive ${data.festivalName} offer!`,
        socialCaption: `🎉 Happy ${data.festivalName} from ${data.businessName}! ✨\n\nMake this ${data.festivalName} extra memorable with our special ${category} offerings. ${
          customAngle ? `\n🔥 ${customAngle}\n` : ''
        }\n📩 DM us or visit today!\n\n#${data.festivalName.replace(/[^a-zA-Z0-9]/g, '')} #${category.replace(/[^a-zA-Z0-9]/g, '')} #${data.businessName.replace(/[^a-zA-Z0-9]/g, '')} #FestiveOffer #LocalBusinessIndia`,
        postType: 'OFFER',
        couponCode: `${data.festivalName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6)}20`,
        ctaType: 'LEARN_MORE',
        imagePrompt: defaultVisualPrompt,
        suggestedImageUrl: buildFluxImageUrl(defaultVisualPrompt),
      };
    }

    const prompt = `You are DigiLocal's Chief Festival Marketing & Creative AI Director.
Create a highly relevant multi-channel post campaign AND a custom AI image generation prompt for this specific business and festival:

Business Name: ${data.businessName}
Business Category / Industry: ${category}
Festival / Occasion: ${data.festivalName} (${data.festivalDate})
${customAngle ? `Specific Offer / Topic Requested by Owner: ${customAngle}` : ''}

STRICT RULES:
1. Both the captions and the image prompt MUST be 100% relevant to "${data.festivalName}" AND the "${category}" industry.
2. NEVER generate cafe/restaurant/food imagery unless the Business Category is explicitly a cafe or restaurant.
3. For "imagePrompt": Describe a rich, photorealistic commercial advertisement scene (50-70 words) combining authentic "${data.festivalName}" cultural/festive symbols (e.g., for Bhai Dooj: brother-sister bond, festive tilak thali, gift hampers, marigold & diyas; for Chhath Puja: sacred sunrise arghya, river ghat, festive basket; for Diwali: glowing diyas, rangoli, golden lights) seamlessly blended with "${category}" professional visual elements.

Respond ONLY in valid JSON matching this schema:
{
  "themeHeadline": "Catchy festive title tailored to ${category} (max 8 words)",
  "gmbCaption": "Google Business Profile post (100-140 words) tailored specifically to ${data.businessName} (${category}) for ${data.festivalName}, with local SEO keywords, emojis, and call to action",
  "socialCaption": "Instagram, Facebook & LinkedIn caption tailored to ${category} for ${data.festivalName}, with engaging hook, emojis, and 6 relevant hashtags",
  "postType": "OFFER",
  "couponCode": "Catchy promo code (e.g. BHAIDOOJ20, DIWALI25)",
  "ctaType": "LEARN_MORE",
  "imagePrompt": "Detailed commercial photography prompt for AI image generator combining ${data.festivalName} aesthetics with ${category} business visuals"
}`;

    try {
      const response = await genAIClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '{}');
      const finalImagePrompt = parsed.imagePrompt || defaultVisualPrompt;

      return {
        themeHeadline:
          parsed.themeHeadline || `${data.festivalName} Specials at ${data.businessName}`,
        gmbCaption:
          parsed.gmbCaption ||
          `✨ Celebrate ${data.festivalName} with ${data.businessName} (${category})! ${customAngle}`,
        socialCaption:
          parsed.socialCaption ||
          `🎉 Happy ${data.festivalName}! Celebrate with ${data.businessName}. #${data.festivalName.replace(/[^a-zA-Z0-9]/g, '')}`,
        postType: parsed.postType || 'OFFER',
        couponCode:
          parsed.couponCode ||
          `${data.festivalName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6)}20`,
        ctaType: parsed.ctaType || 'LEARN_MORE',
        imagePrompt: finalImagePrompt,
        suggestedImageUrl: buildFluxImageUrl(finalImagePrompt),
      };
    } catch {
      return {
        themeHeadline: `${data.festivalName} Specials at ${data.businessName}`,
        gmbCaption: `✨ Wishing everyone a blessed ${data.festivalName}! Celebrate with ${data.businessName} (${category}) and explore our special festive offerings. ${customAngle}`,
        socialCaption: `🎉 Happy ${data.festivalName} from ${data.businessName}! ✨\n\nExplore our special ${category} festive deals today! #${data.festivalName.replace(/[^a-zA-Z0-9]/g, '')}`,
        postType: 'OFFER',
        couponCode: `${data.festivalName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6)}20`,
        ctaType: 'LEARN_MORE',
        imagePrompt: defaultVisualPrompt,
        suggestedImageUrl: buildFluxImageUrl(defaultVisualPrompt),
      };
    }
  },
};
