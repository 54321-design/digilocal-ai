import { GoogleGenAI } from '@google/genai';
import { LoadBalancer } from '../gateway/loadBalancer';
import { extractCleanBrandName, getIndustryVisualPreset } from '../../utils/brandExtractor';

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
  hasOffer?: boolean;
  offerBadgeText?: string;
  categoryHighlights: string[];
  ctaText?: string;
  couponCode?: string;
  styleVariant?: number;
  tagline?: string;
  backgroundImageUrl?: string;
  footerQuote?: string;
}): string {
  const cleanName = extractCleanBrandName(params.businessName);
  const preset = getIndustryVisualPreset(params.businessCategory);
  const backdropUrl = params.backgroundImageUrl || preset.photographicBackdropUrl;
  const tagline = params.tagline || preset.tagline;
  const headlineLines = wrapTextLines(params.themeHeadline, 26, 2);
  const subHeadlineLines = wrapTextLines(params.subHeadline, 42, 2);
  const highlights = (
    params.categoryHighlights && params.categoryHighlights.length > 0
      ? params.categoryHighlights
      : preset.defaultHighlights
  ).slice(0, 3);
  const hasValidOffer = Boolean(
    params.hasOffer && params.offerBadgeText && params.offerBadgeText.trim()
  );
  const effectiveCta = params.ctaText || preset.defaultCta;
  const footerQuote =
    params.footerQuote ||
    `May this ${params.festivalName} bring prosperity and happiness to your life.`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
    <defs>
      <!-- Metallic 24K Gold Gradient -->
      <linearGradient id="goldText" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FDE68A" />
        <stop offset="30%" stop-color="#F59E0B" />
        <stop offset="70%" stop-color="#D97706" />
        <stop offset="100%" stop-color="#FEF08A" />
      </linearGradient>

      <!-- Golden CTA Button Gradient -->
      <linearGradient id="goldBtn" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#F59E0B" />
        <stop offset="50%" stop-color="#FBBF24" />
        <stop offset="100%" stop-color="#D97706" />
      </linearGradient>

      <!-- Offer Shield Ribbon Gradient -->
      <linearGradient id="offerGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FEF08A" />
        <stop offset="40%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#B45309" />
      </linearGradient>

      <!-- Top Cinematic Contrast Vignette -->
      <linearGradient id="topVignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#030712" stop-opacity="0.95" />
        <stop offset="30%" stop-color="#030712" stop-opacity="0.80" />
        <stop offset="65%" stop-color="#030712" stop-opacity="0.30" />
        <stop offset="100%" stop-color="#030712" stop-opacity="0.0" />
      </linearGradient>

      <!-- Bottom Cinematic Contrast Vignette -->
      <linearGradient id="bottomVignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" stop-opacity="0.0" />
        <stop offset="30%" stop-color="#020617" stop-opacity="0.65" />
        <stop offset="70%" stop-color="#020617" stop-opacity="0.92" />
        <stop offset="100%" stop-color="#01040D" stop-opacity="0.98" />
      </linearGradient>

      <!-- Glassmorphic Highlights Card -->
      <linearGradient id="glassCard" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0F172A" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.92" />
      </linearGradient>
    </defs>

    <!-- 1. Photorealistic Category Backdrop -->
    <image href="${escapeXml(backdropUrl)}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice" />

    <!-- 2. Dual Cinematic Gradients for Studio Text Legibility -->
    <rect x="0" y="0" width="1080" height="480" fill="url(#topVignette)" />
    <rect x="0" y="620" width="1080" height="730" fill="url(#bottomVignette)" />

    <!-- 3. Top Brand Identity Header -->
    <g transform="translate(540, 70)">
      <!-- Logo Icon (Crown / Geometric Hex) -->
      <path d="M -18 -10 L 0 -26 L 18 -10 L 18 12 L -18 12 Z" fill="none" stroke="url(#goldText)" stroke-width="3" />
      <circle cx="0" cy="-2" r="4" fill="url(#goldText)" />
      
      <!-- Clean Brand Name -->
      <text x="32" y="3" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="start">
        ${escapeXml(cleanName)}
      </text>
      <!-- Tagline -->
      <text x="34" y="24" font-family="sans-serif" font-size="12" font-weight="700" fill="#FDE68A" letter-spacing="3" text-anchor="start">
        ${escapeXml(tagline.toUpperCase())}
      </text>
    </g>

    <!-- 4. Main Headline & Subheadline -->
    <text x="540" y="155" font-family="sans-serif" font-size="26" font-weight="600" fill="#FDE68A" text-anchor="middle" letter-spacing="1">
      Celebrate Victory With
    </text>
    <text x="540" y="215" font-family="Georgia, serif" font-size="52" font-weight="bold" fill="url(#goldText)" text-anchor="middle">
      ${escapeXml(headlineLines[0] || params.themeHeadline)}
    </text>
    ${
      headlineLines[1]
        ? `<text x="540" y="270" font-family="Georgia, serif" font-size="46" font-weight="bold" fill="url(#goldText)" text-anchor="middle">${escapeXml(headlineLines[1])}</text>`
        : ''
    }

    <!-- Subheadline -->
    <text x="540" y="${headlineLines[1] ? 315 : 265}" font-family="sans-serif" font-size="21" font-weight="400" fill="#F1F5F9" text-anchor="middle">
      ${escapeXml(subHeadlineLines[0] || params.subHeadline)}
    </text>
    ${
      subHeadlineLines[1]
        ? `<text x="540" y="${headlineLines[1] ? 345 : 295}" font-family="sans-serif" font-size="19" font-weight="400" fill="#CBD5E1" text-anchor="middle">${escapeXml(subHeadlineLines[1])}</text>`
        : ''
    }

    <!-- 5. Festival Typography Ribbon Badge -->
    <g transform="translate(540, ${headlineLines[1] ? 405 : 355})">
      <line x1="-160" y1="0" x2="-60" y2="0" stroke="url(#goldText)" stroke-width="2" />
      <circle cx="-60" cy="0" r="3.5" fill="#FDE68A" />
      <text x="0" y="8" font-family="Georgia, serif" font-style="italic" font-size="30" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
        ${escapeXml(params.festivalGreeting)}
      </text>
      <circle cx="60" cy="0" r="3.5" fill="#FDE68A" />
      <line x1="60" y1="0" x2="160" y2="0" stroke="url(#goldText)" stroke-width="2" />
    </g>

    <!-- 6. Ornate Festive Offer Badge (Rendered ONLY if user entered an offer!) -->
    ${
      hasValidOffer
        ? `
    <g transform="translate(860, 560)">
      <!-- Gold Ornate Shield Backdrop -->
      <path d="M -130 -70 L 130 -70 Q 140 0 130 50 L 0 92 L -130 50 Q -140 0 -130 -70 Z" fill="url(#offerGold)" stroke="#FFFBEB" stroke-width="2.5" />
      <path d="M -120 -60 L 120 -60 Q 128 0 120 42 L 0 80 L -120 42 Q -128 0 -120 -60 Z" fill="#78350F" fill-opacity="0.92" />
      
      <text x="0" y="-32" font-family="sans-serif" font-size="14" font-weight="bold" fill="#FEF08A" text-anchor="middle" letter-spacing="2">
        FESTIVE OFFER
      </text>
      <text x="0" y="-2" font-family="sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle">
        ${escapeXml(params.offerBadgeText?.slice(0, 24) || '')}
      </text>
      ${
        params.couponCode
          ? `
      <rect x="-85" y="16" width="170" height="28" rx="14" fill="#B45309" stroke="#FDE68A" stroke-width="1" />
      <text x="0" y="35" font-family="sans-serif" font-size="13" font-weight="bold" fill="#FEF08A" text-anchor="middle" letter-spacing="1">
        CODE: ${escapeXml(params.couponCode)}
      </text>
      `
          : ''
      }
    </g>
    `
        : ''
    }

    <!-- 7. Bottom 3 Feature Highlights Cards -->
    <g transform="translate(540, 1070)">
      ${highlights
        .map((hl, i) => {
          const offsetX = (i - 1) * 315;
          return `
        <g transform="translate(${offsetX}, 0)">
          <rect x="-142" y="-45" width="284" height="75" rx="18" fill="url(#glassCard)" stroke="url(#goldText)" stroke-width="1.5" stroke-opacity="0.8" />
          <circle cx="-102" cy="-8" r="18" fill="#F59E0B" fill-opacity="0.22" />
          <text x="-102" y="-2" font-family="sans-serif" font-size="16" fill="#FDE68A" text-anchor="middle">✦</text>
          <text x="-72" y="-2" font-family="sans-serif" font-size="17" font-weight="bold" fill="#FFFFFF" text-anchor="start">
            ${escapeXml(hl.slice(0, 18))}
          </text>
          <text x="-72" y="16" font-family="sans-serif" font-size="12" font-weight="500" fill="#94A3B8" text-anchor="start">
            Verified Service
          </text>
        </g>
        `;
        })
        .join('')}
    </g>

    <!-- 8. Golden CTA Button -->
    <g transform="translate(540, 1195)">
      <rect x="-220" y="-30" width="440" height="60" rx="30" fill="url(#goldBtn)" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.45" />
      <text x="0" y="9" font-family="sans-serif" font-size="22" font-weight="bold" fill="#1E1B4B" text-anchor="middle">
        ${escapeXml(effectiveCta)} ➔
      </text>
    </g>

    <!-- 9. Footer Traditional Blessing Quote & Filigree Border -->
    <rect x="36" y="36" width="1008" height="1278" rx="28" fill="none" stroke="url(#goldText)" stroke-width="2" stroke-opacity="0.4" />
    <text x="540" y="1295" font-family="Georgia, serif" font-style="italic" font-size="17" fill="#E2E8F0" text-anchor="middle">
      — ${escapeXml(footerQuote)} —
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
    businessDescription?: string;
    businessServices?: string;
    businessLocation?: string;
    brandColors?: string;
    businessLogo?: string;
    keyword: string;
    offer?: string;
    selectedPlatforms?: string[];
    styleVariant?: number;
  }): Promise<{
    gmbCaption: string;
    socialCaption: string;
    postType: 'STANDARD' | 'OFFER' | 'EVENT';
    couponCode?: string;
    ctaType: 'SHOP' | 'BOOK' | 'LEARN_MORE' | 'CALL' | 'ORDER';
    ctaText: string;
    suggestedImageUrl: string;
    imagePrompt: string;
    themeHeadline: string;
    subHeadline: string;
    festivalGreeting: string;
    hasOffer: boolean;
    offerBadgeText: string;
    categoryHighlights: string[];
    backdropImageUrl?: string;
  }> {
    const category = data.businessCategory?.trim() || 'Local Business & Services';
    const keyword = data.keyword?.trim() || 'Festive Quality & Service Excellence';
    const bDesc = data.businessDescription?.trim() || 'Trusted local professional business delivering exceptional quality and service.';
    const bServices = data.businessServices?.trim() || category;
    const bLocation = data.businessLocation?.trim() || 'Local Service Area';
    const bLogo = data.businessLogo?.trim() || 'Official Brand Logo';
    const brandColors = data.brandColors?.trim() || 'Crimson Gold, Deep Navy, Warm Amber';
    const platforms =
      data.selectedPlatforms && data.selectedPlatforms.length > 0
        ? data.selectedPlatforms.join(', ')
        : 'Google Business Profile, Instagram, Facebook, LinkedIn';

    // Rule 9, 10 & 11: Strict Offer Logic
    const rawOffer = (data.offer || '').trim();
    const isNoOffer =
      !rawOffer ||
      [
        'empty',
        'blank',
        'null',
        'undefined',
        'n/a',
        'na',
        'none',
        'no offer',
        'not applicable',
        'not provided',
        'no',
        '-',
        'nil',
        'no discount',
      ].includes(rawOffer.toLowerCase());

    let themeHeadline = `Celebrate ${data.festivalName} with ${data.businessName}`;
    let subHeadline = `Trusted ${category} Excellence & Authentic Festive Greetings`;
    let festivalGreeting = `Happy ${data.festivalName}`;
    let hasOffer = !isNoOffer;
    let offerBadgeText = hasOffer ? rawOffer : '';
    let categoryHighlights = [keyword.slice(0, 18), 'Verified Quality', 'Customer First'];
    let ctaText = hasOffer ? 'Claim Festive Offer' : 'Explore Services';
    let ctaType: 'SHOP' | 'BOOK' | 'LEARN_MORE' | 'CALL' | 'ORDER' = hasOffer ? 'SHOP' : 'LEARN_MORE';
    let gmbCaption = `✨ Wishing you and your family a blessed ${data.festivalName}! Celebrate this auspicious festival with ${data.businessName} (${category}). Discover our ${keyword} solutions designed for you. ${
      hasOffer ? `Special Festive Offer: ${rawOffer}. ` : ''
    }Visit or contact us today!`;
    let socialCaption = `🎉 Warm festive greetings on ${data.festivalName} from ${data.businessName}! ✨\n\nCelebrate with our ${keyword} solutions for ${category}.${
      hasOffer ? `\n🔥 Festive Special: ${rawOffer}\n` : '\n'
    }\n#${data.festivalName.replace(/[^a-zA-Z0-9]/g, '')} #${category.replace(/[^a-zA-Z0-9]/g, '')} #${data.businessName.replace(/[^a-zA-Z0-9]/g, '')} #LocalBusiness`;
    let couponCode: string | undefined = undefined;
    let imagePrompt = `High-end commercial festival poster for ${data.festivalName} for ${data.businessName} (${category}) highlighting ${keyword}`;

    if (genAIClient) {
      const prompt = `You are an expert Indian advertising creative director, festival campaign strategist and premium commercial poster designer.

Your task is to create ONE highly relevant, beautiful, professional, ready-to-publish festival marketing campaign and poster copy for a REAL business.

This is a DYNAMIC AI FESTIVAL POST GENERATOR.

The business can belong to ANY industry.
The user can enter ANY keyword.
The user MAY provide an offer OR leave the offer completely blank.
The user can select Google Business Profile, Instagram, Facebook, LinkedIn, or multiple publishing destinations.

NEVER assume that the business belongs to any particular industry.
NEVER hardcode Digital Marketing Agency, Restaurant, Salon, Real Estate, Dental Clinic, Jewellery, Gym, etc.
Always use the actual business information supplied below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. BUSINESS INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Business Name: ${data.businessName}
Business Category: ${category}
Business Description: ${bDesc}
Business Products / Services: ${bServices}
Business Location: ${bLocation}
Business Logo: ${bLogo}
Brand Colors: ${brandColors}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. FESTIVAL INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Festival / Occasion: ${data.festivalName}
Festival Date: ${data.festivalDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. USER CAMPAIGN INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User Keyword: ${keyword} (REQUIRED creative context)
User Offer: ${isNoOffer ? 'NONE (NO OFFER PROVIDED)' : rawOffer} (OPTIONAL)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. SELECTED PUBLISHING DESTINATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Selected Platform(s): ${platforms}
(Use this to optimize presentation, tone and CTA style. DO NOT put platform names or social icons inside the poster).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. CORE CREATIVE OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create ONE cohesive commercial campaign by combining:
${data.businessName} + ${category} + ${keyword} + ${data.festivalName} + ${isNoOffer ? 'NO OFFER' : rawOffer}
The viewer should immediately understand:
THIS IS ${data.businessName}
THIS BUSINESS IS RELATED TO ${category}
THIS CAMPAIGN IS ABOUT ${keyword}
THIS IS A ${data.festivalName} CAMPAIGN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. BUSINESS + KEYWORD INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Turn the keyword "${keyword}" into the MAIN VISUAL & COPY CONCEPT within the context of ${category}.
Identify the most relevant Product, Service, Customer, Environment, Tool, Benefit, Result, or Business Outcome associated with "${keyword}".
Do NOT simply print the keyword on the poster.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. FESTIVAL INTEGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Naturally connect FESTIVAL + BUSINESS + KEYWORD into ONE visual story with authentic Indian cultural aesthetics for ${data.festivalName}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. OFFER LOGIC — CRITICAL STRICT ENFORCEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${
  isNoOffer
    ? `OFFER STATUS: NO OFFER PROVIDED.
STRICT RULE (Rule 11): DO NOT invent an offer!
DO NOT generate fake discounts, fake percentages, fake prices, fake coupons, fake promotional claims such as "20% OFF", "50% OFF", "FLAT ₹X OFF", "SPECIAL DISCOUNT", "FESTIVE DISCOUNT", "LIMITED TIME OFFER", "FREE CONSULTATION", "BUY 1 GET 1", "SPECIAL PRICE", "BEST PRICE".
Instead, make the campaign compelling through the keyword "${keyword}", customer benefit, product/service excellence, festival emotion, and a strong commercial CTA.`
    : `OFFER STATUS: VALID USER OFFER: "${rawOffer}".
STRICT RULE (Rule 10): Use the EXACT offer provided by the user. Make it prominent. Do NOT change its meaning, do NOT exaggerate it, do NOT invent different discounts.`
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. CALL TO ACTION (CTA) RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Select an appropriate commercial CTA for ${category} and ${keyword}:
(e.g., Book Consultation, Enquire Today, Visit Showroom, Schedule Visit, Explore Collection, Order Now, Call Today).
${isNoOffer ? 'Focus CTA on consultation, inquiry, visit, or booking.' : 'Reference the user offer naturally.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. CAPTION GENERATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- GMB Caption: Local search optimized, local keywords, clear CTA, direct tone, business contact intent.
- Social Caption: Formatted for the selected platform(s) (${platforms}) with strong hook line, festive storytelling, formatted spacing, clear CTA, and 8-12 relevant hashtags.

Respond ONLY in valid JSON matching this schema:
{
  "themeHeadline": "Catchy headline combining keyword, business and festival (max 6-7 words)",
  "subHeadline": "Compelling subtitle reinforcing service/product value and festival spirit (8-12 words)",
  "festivalGreeting": "Traditional authentic greeting for ${data.festivalName}",
  "hasOffer": ${!isNoOffer},
  "offerBadgeText": "${!isNoOffer ? rawOffer : ''}",
  "categoryHighlights": ["Service highlight 1", "Service highlight 2", "Service highlight 3"],
  "ctaText": "Short compelling commercial CTA (max 3 words, e.g. Book Consultation, Enquire Today, Visit Showroom)",
  "ctaType": "LEARN_MORE",
  "gmbCaption": "Google Business Profile post (90-130 words) tailored to ${data.businessName} (${category}) for ${data.festivalName} with local keywords and CTA",
  "socialCaption": "Social media post tailored to ${platforms} with hook line, emojis, festive storytelling, CTA, and 8-12 relevant hashtags",
  "imagePrompt": "Detailed commercial poster visual prompt combining ${data.festivalName}, ${data.businessName}, ${category}, and ${keyword} in 4:5 vertical aspect ratio"
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
          tokensEstimated: 1100,
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.themeHeadline) themeHeadline = parsed.themeHeadline;
        if (parsed.subHeadline) subHeadline = parsed.subHeadline;
        if (parsed.festivalGreeting) festivalGreeting = parsed.festivalGreeting;
        if (Array.isArray(parsed.categoryHighlights) && parsed.categoryHighlights.length > 0) {
          categoryHighlights = parsed.categoryHighlights.slice(0, 3);
        }
        if (parsed.ctaText) ctaText = parsed.ctaText;
        if (parsed.ctaType) ctaType = parsed.ctaType;
        if (parsed.gmbCaption) gmbCaption = parsed.gmbCaption;
        if (parsed.socialCaption) socialCaption = parsed.socialCaption;
        if (parsed.imagePrompt) imagePrompt = parsed.imagePrompt;

        // Strict enforcement: if user did not provide an offer, never allow an offer badge
        if (isNoOffer) {
          hasOffer = false;
          offerBadgeText = '';
          couponCode = undefined;
        } else {
          hasOffer = true;
          offerBadgeText = parsed.offerBadgeText || rawOffer;
        }
      } catch {
        // Fallback to structured defaults if network interrupts
      }

      // Rule 19: High-End Master Hybrid Commercial Advertising Poster Engine
      const cleanBusinessName = extractCleanBrandName(data.businessName);
      const cleanCategory = category?.trim() || 'Commercial Services';
      const cleanFestival = data.festivalName?.trim() || 'Festival';
      const preset = getIndustryVisualPreset(cleanCategory, keyword);

      const effectiveHighlights =
        Array.isArray(categoryHighlights) && categoryHighlights.length > 0
          ? categoryHighlights
          : preset.defaultHighlights;

      const svgPosterUri = buildGeminiFestivalPosterSvgUri({
        festivalName: cleanFestival,
        festivalDate: data.festivalDate,
        businessName: cleanBusinessName,
        businessCategory: cleanCategory,
        themeHeadline: themeHeadline || preset.defaultHeadline,
        subHeadline: subHeadline || preset.defaultSubheadline,
        festivalGreeting,
        hasOffer,
        offerBadgeText,
        categoryHighlights: effectiveHighlights,
        ctaText: ctaText || preset.defaultCta,
        couponCode,
        styleVariant: data.styleVariant || 0,
        tagline: preset.tagline,
        backgroundImageUrl: preset.photographicBackdropUrl,
      });

      return {
        themeHeadline: themeHeadline || preset.defaultHeadline,
        subHeadline: subHeadline || preset.defaultSubheadline,
        festivalGreeting,
        hasOffer,
        offerBadgeText,
        categoryHighlights: effectiveHighlights,
        ctaText: ctaText || preset.defaultCta,
        ctaType,
        gmbCaption,
        socialCaption,
        postType: hasOffer ? 'OFFER' : 'STANDARD',
        couponCode,
        imagePrompt,
        suggestedImageUrl: svgPosterUri,
        backdropImageUrl: preset.photographicBackdropUrl,
      };
    }

    const cleanFallbackName = extractCleanBrandName(data.businessName);
    const fallbackPreset = getIndustryVisualPreset(category, keyword);
    const svgPosterUri = buildGeminiFestivalPosterSvgUri({
      festivalName: data.festivalName,
      festivalDate: data.festivalDate,
      businessName: cleanFallbackName,
      businessCategory: category,
      themeHeadline: themeHeadline || fallbackPreset.defaultHeadline,
      subHeadline: subHeadline || fallbackPreset.defaultSubheadline,
      festivalGreeting,
      hasOffer,
      offerBadgeText,
      categoryHighlights: categoryHighlights.length > 0 ? categoryHighlights : fallbackPreset.defaultHighlights,
      ctaText: ctaText || fallbackPreset.defaultCta,
      couponCode,
      styleVariant: data.styleVariant || 0,
      tagline: fallbackPreset.tagline,
      backgroundImageUrl: fallbackPreset.photographicBackdropUrl,
    });

    return {
      themeHeadline: themeHeadline || fallbackPreset.defaultHeadline,
      subHeadline: subHeadline || fallbackPreset.defaultSubheadline,
      festivalGreeting,
      hasOffer,
      offerBadgeText,
      categoryHighlights: categoryHighlights.length > 0 ? categoryHighlights : fallbackPreset.defaultHighlights,
      ctaText: ctaText || fallbackPreset.defaultCta,
      ctaType,
      gmbCaption,
      socialCaption,
      postType: hasOffer ? 'OFFER' : 'STANDARD',
      couponCode,
      imagePrompt,
      suggestedImageUrl: svgPosterUri,
      backdropImageUrl: fallbackPreset.photographicBackdropUrl,
    };
  },
};
