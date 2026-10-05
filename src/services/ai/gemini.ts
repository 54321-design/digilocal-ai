import { GoogleGenAI } from '@google/genai';
import { LoadBalancer } from '../gateway/loadBalancer';

const apiKey =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  'AQ.Ab8RN6IxuZy8fZX1HrJmDh4zWLd6BXUZtlqiJiQRhL86qWMHdA';

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

const escapeXml = (unsafe: string): string =>
  String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const wrapTextLines = (text: string, maxCharsPerLine: number, maxLines: number): string[] => {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) {
        break;
      }
    }
  }
  if (currentLine && lines.length < maxLines) {
    const consumedWords = lines.join(' ').split(/\s+/).filter(Boolean).length;
    const remaining = words.slice(consumedWords).join(' ');
    lines.push(
      remaining.length > maxCharsPerLine
        ? remaining.slice(0, maxCharsPerLine - 1) + '…'
        : remaining
    );
  }
  return lines;
};

const getFestivalIllustrationSvg = (festivalName: string, accentHex: string): string => {
  const lower = festivalName.toLowerCase();

  if (lower.includes('dussehra') || lower.includes('vijayadashami')) {
    // Golden Bow & Arrow (Dhanush-Baan) + Victory Sunburst
    return `
      <g transform="translate(540, 275)">
        <circle cx="0" cy="0" r="105" fill="${accentHex}" fill-opacity="0.14" />
        <circle cx="0" cy="0" r="82" fill="none" stroke="${accentHex}" stroke-width="2" stroke-dasharray="6,6" />
        <path d="M -55 -65 C 45 -35, 45 35, -55 65" fill="none" stroke="${accentHex}" stroke-width="7" stroke-linecap="round" />
        <line x1="-55" y1="-65" x2="-55" y2="65" stroke="#FDE68A" stroke-width="2.5" />
        <line x1="-70" y1="0" x2="68" y2="0" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" />
        <polygon points="75,0 48,-13 54,0 48,13" fill="${accentHex}" />
        <polygon points="-70,0 -86,-10 -78,0 -86,10" fill="#FDE68A" />
      </g>
    `;
  }

  if (lower.includes('navratri') || lower.includes('durga')) {
    // Festive Kalash + Crossed Dandiya Sticks + Lotus
    return `
      <g transform="translate(540, 275)">
        <circle cx="0" cy="0" r="105" fill="${accentHex}" fill-opacity="0.15" />
        <line x1="-75" y1="55" x2="75" y2="-55" stroke="${accentHex}" stroke-width="7" stroke-linecap="round" />
        <line x1="-75" y1="-55" x2="75" y2="55" stroke="#FDE68A" stroke-width="7" stroke-linecap="round" />
        <circle cx="0" cy="18" r="42" fill="${accentHex}" />
        <path d="M -28 -18 Q 0 -58 28 -18 Z" fill="#22C55E" />
        <circle cx="0" cy="-34" r="14" fill="#F97316" stroke="#FEF08A" stroke-width="3" />
      </g>
    `;
  }

  if (lower.includes('karwa')) {
    // Full Moon + Ornate Chalni Sieve + Glowing Diya
    return `
      <g transform="translate(540, 275)">
        <circle cx="-22" cy="-15" r="68" fill="#FEF9C3" fill-opacity="0.9" />
        <circle cx="28" cy="-5" r="56" fill="none" stroke="${accentHex}" stroke-width="4" stroke-dasharray="5,5" />
        <path d="M -35 55 Q 0 88 35 55 Z" fill="${accentHex}" />
        <path d="M 0 28 C -10 42, 10 42, 0 55 C 12 42, 8 34, 0 28 Z" fill="#F97316" />
      </g>
    `;
  }

  if (lower.includes('bhai dooj')) {
    // Auspicious Pooja Thali + Tilak + Festive Gift Box
    return `
      <g transform="translate(540, 275)">
        <circle cx="0" cy="0" r="96" fill="${accentHex}" fill-opacity="0.16" />
        <rect x="-46" y="-32" width="92" height="76" rx="12" fill="${accentHex}" />
        <rect x="-8" y="-32" width="16" height="76" fill="#FFFFFF" fill-opacity="0.85" />
        <rect x="-46" y="-2" width="92" height="16" fill="#FFFFFF" fill-opacity="0.85" />
        <path d="M 0 -32 C -28 -62, -42 -36, 0 -32 C 42 -36, 28 -62, 0 -32 Z" fill="#FDE047" />
        <circle cx="0" cy="-68" r="9" fill="#EF4444" stroke="#FEF08A" stroke-width="2" />
      </g>
    `;
  }

  if (lower.includes('chhath')) {
    // Rising Surya Dev Sun + Shimmering River Ghat Waves + Arghya Diya
    return `
      <g transform="translate(540, 275)">
        <circle cx="0" cy="-10" r="88" fill="#F97316" fill-opacity="0.22" />
        <circle cx="0" cy="-10" r="56" fill="#FACC15" />
        <path d="M -95 42 Q -48 26 0 42 T 95 42" fill="none" stroke="#38BDF8" stroke-width="6" stroke-linecap="round" />
        <path d="M -75 64 Q -38 50 0 64 T 75 64" fill="none" stroke="${accentHex}" stroke-width="5" stroke-linecap="round" />
      </g>
    `;
  }

  if (lower.includes('guru nanak') || lower.includes('gurpurab')) {
    // Golden Halo + Sacred Lotus Dome Silhouette
    return `
      <g transform="translate(540, 275)">
        <circle cx="0" cy="0" r="95" fill="${accentHex}" fill-opacity="0.18" />
        <circle cx="0" cy="0" r="70" fill="none" stroke="${accentHex}" stroke-width="3" />
        <path d="M -55 35 L 55 35 L 45 -5 Q 0 -65 -45 -5 Z" fill="${accentHex}" />
        <circle cx="0" cy="-58" r="10" fill="#FEF08A" />
      </g>
    `;
  }

  if (lower.includes('gandhi')) {
    // Ashoka / Charkha Wheel Motif
    return `
      <g transform="translate(540, 275)">
        <circle cx="0" cy="0" r="88" fill="#FFFFFF" fill-opacity="0.12" />
        <circle cx="0" cy="0" r="64" fill="none" stroke="${accentHex}" stroke-width="6" />
        <circle cx="0" cy="0" r="14" fill="${accentHex}" />
        <line x1="-64" y1="0" x2="64" y2="0" stroke="${accentHex}" stroke-width="3" />
        <line x1="0" y1="-64" x2="0" y2="64" stroke="${accentHex}" stroke-width="3" />
        <line x1="-45" y1="-45" x2="45" y2="45" stroke="${accentHex}" stroke-width="3" />
        <line x1="-45" y1="45" x2="45" y2="-45" stroke="${accentHex}" stroke-width="3" />
      </g>
    `;
  }

  if (lower.includes('christmas') || lower.includes('year')) {
    // Festive Christmas Tree & Golden Star
    return `
      <g transform="translate(540, 275)">
        <circle cx="0" cy="0" r="96" fill="${accentHex}" fill-opacity="0.14" />
        <polygon points="0,-78 -48,-12 48,-12" fill="#16A34A" stroke="${accentHex}" stroke-width="2" />
        <polygon points="0,-38 -64,34 64,34" fill="#15803D" stroke="${accentHex}" stroke-width="2" />
        <rect x="-12" y="34" width="24" height="26" rx="4" fill="#B45309" />
        <circle cx="0" cy="-84" r="12" fill="#FACC15" />
      </g>
    `;
  }

  // Default: Diwali / Dhanteras / Govardhan Puja — Ornate Glowing Royal Diya + Rangoli Lotus
  return `
    <g transform="translate(540, 275)">
      <circle cx="0" cy="0" r="108" fill="${accentHex}" fill-opacity="0.15" />
      <circle cx="0" cy="0" r="84" fill="none" stroke="${accentHex}" stroke-width="2" stroke-dasharray="8,6" />
      <!-- Glowing Diya Flame -->
      <path d="M 0 -82 C -26 -42, -22 -10, 0 2 C 22 -10, 26 -42, 0 -82 Z" fill="#F97316" />
      <path d="M 0 -66 C -14 -38, -12 -16, 0 -6 C 12 -16, 14 -38, 0 -66 Z" fill="#FEF08A" />
      <!-- Ornate Golden Diya Base -->
      <path d="M -78 8 Q 0 82 78 8 L 58 -4 Q 0 18 -58 -4 Z" fill="${accentHex}" />
      <path d="M -52 46 Q 0 76 52 46" fill="none" stroke="#FEF08A" stroke-width="4" stroke-linecap="round" />
    </g>
  `;
};

export function buildGeminiFestivalPosterSvgUri(params: {
  festivalName: string;
  festivalDate: string;
  businessName: string;
  businessCategory: string;
  themeHeadline: string;
  subHeadline: string;
  festivalGreeting: string;
  offerBadgeText: string;
  categoryHighlights: string[];
  couponCode: string;
  styleVariant?: number;
}): string {
  const palettes = [
    {
      bgStart: '#450A0A',
      bgEnd: '#7F1D1D',
      cardBg: '#1C090B',
      accent: '#F59E0B',
      accentLight: '#FDE68A',
      badgeBg: '#D97706',
    },
    {
      bgStart: '#0F172A',
      bgEnd: '#1E1B4B',
      cardBg: '#090D16',
      accent: '#FBBF24',
      accentLight: '#FEF08A',
      badgeBg: '#2563EB',
    },
    {
      bgStart: '#064E3B',
      bgEnd: '#115E59',
      cardBg: '#042F2E',
      accent: '#F59E0B',
      accentLight: '#FDE68A',
      badgeBg: '#0D9488',
    },
  ];

  const palette = palettes[(params.styleVariant || 0) % palettes.length];
  const headlineLines = wrapTextLines(params.themeHeadline, 26, 2);
  const subHeadlineLines = wrapTextLines(params.subHeadline, 44, 2);
  const highlights = (params.categoryHighlights || []).slice(0, 3);
  const illustrationSvg = getFestivalIllustrationSvg(params.festivalName, palette.accent);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bgStart}" />
        <stop offset="100%" stop-color="${palette.bgEnd}" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${palette.accent}" />
        <stop offset="50%" stop-color="${palette.accentLight}" />
        <stop offset="100%" stop-color="${palette.accent}" />
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="1080" height="1080" fill="url(#bgGrad)" />

    <!-- Decorative Corner Mandalas -->
    <circle cx="0" cy="0" r="220" fill="${palette.accent}" fill-opacity="0.08" />
    <circle cx="1080" cy="0" r="220" fill="${palette.accent}" fill-opacity="0.08" />
    <circle cx="0" cy="1080" r="240" fill="${palette.accent}" fill-opacity="0.08" />
    <circle cx="1080" cy="1080" r="240" fill="${palette.accent}" fill-opacity="0.08" />

    <!-- Outer & Inner Royal Gold Frame -->
    <rect x="38" y="38" width="1004" height="1004" rx="36" fill="none" stroke="url(#goldGrad)" stroke-width="4" />
    <rect x="54" y="54" width="972" height="972" rx="28" fill="none" stroke="${palette.accentLight}" stroke-opacity="0.35" stroke-width="1.5" />

    <!-- Top Festival Date & Greeting Pill -->
    <rect x="290" y="78" width="500" height="54" rx="27" fill="${palette.cardBg}" fill-opacity="0.78" stroke="${palette.accent}" stroke-width="2" />
    <text x="540" y="113" font-family="sans-serif" font-size="23" font-weight="bold" fill="${palette.accentLight}" text-anchor="middle" letter-spacing="1.5">
      ${escapeXml(params.festivalGreeting.toUpperCase())} • ${escapeXml(params.festivalDate.toUpperCase())}
    </text>

    <!-- Festival Illustration Centerpiece -->
    ${illustrationSvg}

    <!-- Main Gemini Festive Headline -->
    <text x="540" y="455" font-family="sans-serif" font-size="52" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
      ${escapeXml(headlineLines[0] || params.festivalName)}
    </text>
    ${
      headlineLines[1]
        ? `<text x="540" y="518" font-family="sans-serif" font-size="50" font-weight="bold" fill="${palette.accentLight}" text-anchor="middle">${escapeXml(headlineLines[1])}</text>`
        : ''
    }

    <!-- Subheadline tailored to Business Category -->
    <text x="540" y="${headlineLines[1] ? 575 : 525}" font-family="sans-serif" font-size="27" font-weight="600" fill="#E2E8F0" text-anchor="middle">
      ${escapeXml(subHeadlineLines[0] || params.businessCategory)}
    </text>
    ${
      subHeadlineLines[1]
        ? `<text x="540" y="${headlineLines[1] ? 612 : 562}" font-family="sans-serif" font-size="26" font-weight="500" fill="#CBD5E1" text-anchor="middle">${escapeXml(subHeadlineLines[1])}</text>`
        : ''
    }

    <!-- Industry Highlights Pills -->
    ${highlights
      .map((item, idx) => {
        const pillW = 280;
        const startX = 95 + idx * 305;
        return `
          <rect x="${startX}" y="655" width="${pillW}" height="56" rx="16" fill="${palette.cardBg}" fill-opacity="0.82" stroke="${palette.accent}" stroke-width="1.5" />
          <text x="${startX + pillW / 2}" y="691" font-family="sans-serif" font-size="21" font-weight="bold" fill="${palette.accentLight}" text-anchor="middle">
            ✦ ${escapeXml(item.slice(0, 22))}
          </text>
        `;
      })
      .join('')}

    <!-- Special Festive Offer Banner -->
    <rect x="140" y="745" width="800" height="92" rx="24" fill="url(#goldGrad)" />
    <text x="540" y="786" font-family="sans-serif" font-size="28" font-weight="bold" fill="#1E1B4B" text-anchor="middle">
      ${escapeXml(params.offerBadgeText.slice(0, 42))}
    </text>
    <text x="540" y="821" font-family="sans-serif" font-size="22" font-weight="bold" fill="#31102F" text-anchor="middle">
      USE PROMO CODE: ${escapeXml(params.couponCode)}
    </text>

    <!-- Bottom Brand Footer Card -->
    <rect x="85" y="868" width="910" height="132" rx="24" fill="${palette.cardBg}" fill-opacity="0.92" stroke="${palette.accent}" stroke-width="2" />
    <text x="540" y="925" font-family="sans-serif" font-size="38" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
      ${escapeXml(params.businessName.slice(0, 34))}
    </text>
    <text x="540" y="972" font-family="sans-serif" font-size="24" font-weight="600" fill="${palette.accentLight}" text-anchor="middle">
      ${escapeXml(params.businessCategory.slice(0, 48))} • Verified Google Business
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AIService = {
  async generateReviewReply(params: AIReviewParams): Promise<string> {
    if (!genAIClient) {
      throw new Error('Gemini API key is not configured');
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

    const response = await LoadBalancer.execute({
      service: 'gemini_ai',
      endpoint: 'generateReviewReply',
      task: () =>
        genAIClient!.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        }),
      tokensEstimated: 450,
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
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `You are DigiBirds 360's Local Business Growth Copilot for "${data.businessName}" (${data.locationTitle}).
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

    const response = await LoadBalancer.execute({
      service: 'gemini_ai',
      endpoint: 'generateProfileInsights',
      task: () =>
        genAIClient!.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
      tokensEstimated: 750,
      cacheKey: `insights_${data.businessName}`,
      cacheTtlMs: 20 * 60 * 1000,
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

    const prompt = `You are DigiBirds 360's Chief Customer Experience & GMB Ranking AI.
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
      const response = await LoadBalancer.execute({
        service: 'gemini_ai',
        endpoint: 'analyzeReviewSentiments',
        task: () =>
          genAIClient!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          }),
        tokensEstimated: 850,
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
    styleVariant?: number;
  }): Promise<{
    gmbCaption: string;
    socialCaption: string;
    postType: 'STANDARD' | 'OFFER' | 'EVENT';
    couponCode?: string;
    ctaType: 'SHOP' | 'BOOK' | 'LEARN_MORE' | 'CALL' | 'ORDER';
    suggestedImageUrl: string;
    imagePrompt: string;
    themeHeadline: string;
    subHeadline: string;
    festivalGreeting: string;
    offerBadgeText: string;
    categoryHighlights: string[];
  }> {
    const category = data.businessCategory?.trim() || 'Local Business & Services';
    const customAngle = data.customTopic?.trim() || '';
    const defaultCoupon = `${data.festivalName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6)}20`;

    let themeHeadline = `Celebrate ${data.festivalName} with ${data.businessName}`;
    let subHeadline = `Trusted ${category} Solutions & Festive Specials`;
    let festivalGreeting = `Happy ${data.festivalName}`;
    let offerBadgeText = customAngle || `Special ${data.festivalName} Offer Available Now`;
    let categoryHighlights = ['Top Rated Quality', 'Festive Special Deals', 'Customer First'];
    let gmbCaption = `✨ Wishing you and your family a joyful ${data.festivalName}! Celebrate this auspicious occasion with ${data.businessName} (${category}). ${
      customAngle ? `${customAngle}. ` : ''
    }Visit or contact us today!`;
    let socialCaption = `🎉 Happy ${data.festivalName} from ${data.businessName}! ✨\n\nCelebrate with our special ${category} offerings.${
      customAngle ? `\n🔥 ${customAngle}\n` : ''
    }\n#${data.festivalName.replace(/[^a-zA-Z0-9]/g, '')} #${category.replace(/[^a-zA-Z0-9]/g, '')} #${data.businessName.replace(/[^a-zA-Z0-9]/g, '')}`;
    let couponCode = defaultCoupon;
    let imagePrompt = `Commercial festival poster for ${data.festivalName} tailored for ${data.businessName} (${category})`;

    if (genAIClient) {
      const prompt = `You are DigiBirds 360's Chief Festival Marketing & Creative AI Director.
Create a highly relevant multi-channel festival campaign AND poster copy for this exact business and Indian festival:

Business Name: ${data.businessName}
Business Category / Industry: ${category}
Festival / Occasion: ${data.festivalName} (${data.festivalDate})
${customAngle ? `Specific Offer / Highlight Requested by Owner: ${customAngle}` : ''}

STRICT RULES:
1. Everything MUST be 100% relevant to "${data.festivalName}" AND the "${category}" industry of "${data.businessName}".
2. Do NOT mention unrelated industries (like cafes or food) unless "${category}" is food/restaurant.
3. Provide 3 short, punchy "categoryHighlights" (max 3 words each) that represent real services/strengths of a "${category}" business during ${data.festivalName}.

Respond ONLY in valid JSON matching this schema:
{
  "themeHeadline": "Catchy festive poster headline for ${data.businessName} (5 to 7 words)",
  "subHeadline": "Compelling subtitle connecting ${data.festivalName} with ${category} (7 to 11 words)",
  "festivalGreeting": "Traditional greeting for ${data.festivalName} (e.g. Shubh Deepawali, Happy Navratri, Shubh Dhanteras)",
  "offerBadgeText": "Short offer banner text for the poster (max 6 words)",
  "categoryHighlights": ["Service highlight 1", "Service highlight 2", "Service highlight 3"],
  "gmbCaption": "Google Business Profile post (90-130 words) tailored to ${data.businessName} (${category}) for ${data.festivalName}, with local SEO keywords, emojis, and call to action",
  "socialCaption": "Instagram, Facebook & LinkedIn caption tailored to ${category} for ${data.festivalName}, with engaging hook, emojis, and 6 relevant hashtags",
  "couponCode": "Catchy promo code (e.g. DIWALI25, NAVRATRI20)",
  "imagePrompt": "Detailed commercial poster visual description for Gemini image generation"
}`;

      try {
        const response = await LoadBalancer.execute({
          service: 'gemini_ai',
          endpoint: 'generateFestivalPostCampaign',
          task: () =>
            genAIClient!.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: 'application/json' },
            }),
          tokensEstimated: 950,
        });
        const parsed = JSON.parse(response.text || '{}');
        if (parsed.themeHeadline) themeHeadline = parsed.themeHeadline;
        if (parsed.subHeadline) subHeadline = parsed.subHeadline;
        if (parsed.festivalGreeting) festivalGreeting = parsed.festivalGreeting;
        if (parsed.offerBadgeText) offerBadgeText = parsed.offerBadgeText;
        if (Array.isArray(parsed.categoryHighlights) && parsed.categoryHighlights.length > 0) {
          categoryHighlights = parsed.categoryHighlights.slice(0, 3);
        }
        if (parsed.gmbCaption) gmbCaption = parsed.gmbCaption;
        if (parsed.socialCaption) socialCaption = parsed.socialCaption;
        if (parsed.couponCode) couponCode = parsed.couponCode;
        if (parsed.imagePrompt) imagePrompt = parsed.imagePrompt;
      } catch {
        // Keep structured defaults if network hiccups
      }

      // Attempt native Gemini Image model first if quota is enabled on the key
      try {
        const imgResp = await genAIClient.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: `Create a high-end commercial festival marketing poster for Indian festival "${data.festivalName}" for the business "${data.businessName}" in the "${category}" industry. Headline: "${themeHeadline}". Offer: "${offerBadgeText}". Rich festive Indian motifs, vibrant colors, professional agency design.`,
        });
        const parts = imgResp.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            return {
              themeHeadline,
              subHeadline,
              festivalGreeting,
              offerBadgeText,
              categoryHighlights,
              gmbCaption,
              socialCaption,
              postType: 'OFFER',
              couponCode,
              ctaType: 'LEARN_MORE',
              imagePrompt,
              suggestedImageUrl: `data:${mime};base64,${part.inlineData.data}`,
            };
          }
        }
      } catch {
        // Fallback seamlessly to the Gemini-authored custom SVG Festival Poster below
      }
    }

    const svgPosterUri = buildGeminiFestivalPosterSvgUri({
      festivalName: data.festivalName,
      festivalDate: data.festivalDate,
      businessName: data.businessName,
      businessCategory: category,
      themeHeadline,
      subHeadline,
      festivalGreeting,
      offerBadgeText,
      categoryHighlights,
      couponCode,
      styleVariant: data.styleVariant || 0,
    });

    return {
      themeHeadline,
      subHeadline,
      festivalGreeting,
      offerBadgeText,
      categoryHighlights,
      gmbCaption,
      socialCaption,
      postType: 'OFFER',
      couponCode,
      ctaType: 'LEARN_MORE',
      imagePrompt,
      suggestedImageUrl: svgPosterUri,
    };
  },
};
