import { GoogleGenAI } from '@google/genai';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenAI({ apiKey });
}

export type ReplyTone = 'professional' | 'friendly' | 'warm' | 'concise' | 'apologetic';
export type ReplyLanguage = 'en' | 'hi' | 'hinglish';

export interface GenerateReviewReplyParams {
  businessName: string;
  reviewerName?: string;
  starRating: number;
  reviewComment?: string;
  tone: ReplyTone;
  language: ReplyLanguage;
}

export async function generateAIReviewReply(params: GenerateReviewReplyParams): Promise<string> {
  const genAI = getGenAI();

  const langInstruction =
    params.language === 'hi'
      ? 'Reply in pure, respectful Hindi (Devanagari script).'
      : params.language === 'hinglish'
      ? 'Reply in natural, contemporary conversational Hinglish (Hindi written in Roman script) as commonly used by urban Indian businesses and customers.'
      : 'Reply in clear, professional English.';

  const toneInstruction = {
    professional: 'Tone: Respectful, polite, courteous, and professional.',
    friendly: 'Tone: Warm, enthusiastic, cheerful, and approachable.',
    warm: 'Tone: Heartfelt, deeply appreciative, and welcoming.',
    concise: 'Tone: Direct, brief, polite, and to-the-point without fluff.',
    apologetic: 'Tone: Sincere, apologetic, empathetic, and constructive offering to resolve any concerns.',
  }[params.tone];

  const prompt = `You are a customer relationship assistant for "${params.businessName}".
Generate a response to this Google Review.

Review details:
- Reviewer: ${params.reviewerName || 'Customer'}
- Rating: ${params.starRating} / 5 Stars
- Customer Review: "${params.reviewComment || '(No text comment provided, star rating only)'}"

Guidelines:
1. ${toneInstruction}
2. ${langInstruction}
3. CRITICAL: NEVER invent facts, services, products, or discounts that the customer did not mention.
4. If the review was negative, apologize for the shortfall and invite them to reach out directly to resolve the issue.
5. Keep the reply authentic, concise, and natural (between 2 to 4 sentences).
6. Do NOT include placeholders like [Your Name] or [Phone Number]. End with a generic sign-off like "Warm regards, Team ${params.businessName}".`;

  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text?.trim() || 'Thank you for your feedback. We appreciate your support!';
}

export interface GrowthCopilotAuditInput {
  businessName: string;
  categories: string[];
  hasWebsite: boolean;
  hasPhone: boolean;
  hasHours: boolean;
  hasAddress: boolean;
  totalReviews: number;
  averageRating: number;
  unansweredReviewsCount: number;
  hasPhotos: boolean;
}

export async function generateGrowthCopilotPlan(input: GrowthCopilotAuditInput): Promise<{
  actionPlan: string[];
  seoInsights: string[];
  postIdeas: string[];
  summary: string;
}> {
  const genAI = getGenAI();

  const prompt = `You are the DigiLocal.ai Local Business Growth Copilot for "${input.businessName}".
Analyze this actual business profile data and generate actionable, evidence-based recommendations:

Business Profile State:
- Business Name: ${input.businessName}
- Category: ${input.categories.join(', ') || 'None specified'}
- Has Verified Address: ${input.hasAddress ? 'Yes' : 'No (Needs Address verification)'}
- Has Website Link: ${input.hasWebsite ? 'Yes' : 'Missing website URL'}
- Has Phone Number: ${input.hasPhone ? 'Yes' : 'Missing phone number'}
- Has Regular Hours: ${input.hasHours ? 'Yes' : 'Missing opening hours'}
- Total Google Reviews: ${input.totalReviews}
- Average Google Rating: ${input.averageRating > 0 ? input.averageRating.toFixed(1) : 'No reviews yet'}
- Unanswered Reviews: ${input.unansweredReviewsCount}
- Photos Uploaded: ${input.hasPhotos ? 'Yes' : 'Missing photos'}

Rules:
1. Ground your advice ONLY in the above facts. Do NOT invent fake rankings, fake competitor data, or fake scores.
2. Provide a JSON response with the following schema:
{
  "summary": "Brief 2-sentence executive summary of current local profile health",
  "actionPlan": ["Top 3-4 high-priority specific actions the business owner must take this week"],
  "seoInsights": ["3 specific local SEO recommendations based on the missing or present profile fields"],
  "postIdeas": ["2 engaging Google Business Profile update post topics to boost local engagement"]
}`;

  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  try {
    const parsed = JSON.parse(response.text || '{}');
    return {
      summary: parsed.summary || 'Profile audit complete. Follow recommendations to optimize your Google presence.',
      actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan : [],
      seoInsights: Array.isArray(parsed.seoInsights) ? parsed.seoInsights : [],
      postIdeas: Array.isArray(parsed.postIdeas) ? parsed.postIdeas : [],
    };
  } catch (e) {
    return {
      summary: 'Review your Google profile completeness and respond to unanswered reviews.',
      actionPlan: ['Respond to any pending customer reviews.', 'Ensure store opening hours are up-to-date.'],
      seoInsights: ['Complete all profile fields to improve Google Maps discovery.'],
      postIdeas: ['Share a behind-the-scenes photo of your team or new arrivals.'],
    };
  }
}
