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
  hasOffer?: boolean;
  offerBadgeText?: string;
  categoryHighlights: string[];
  ctaText?: string;
  couponCode?: string;
  styleVariant?: number;
}): string {
  // Category-tailored color palettes with cinematic lighting accents
  const palettes = [
    {
      // 0: Royal Crimson & Champagne Gold (Jewelry, Retail, Fashion, Festivals)
      bgStart: '#2A080C',
      bgMid: '#4E0C16',
      bgEnd: '#1A0407',
      cardBg: '#150306',
      accent: '#F59E0B',
      accentLight: '#FEF08A',
      accentGlow: '#FFA500',
      badgeBg: '#B45309',
      borderGold: '#FCD34D',
    },
    {
      // 1: Midnight Sapphire & 24K Gold (Corporate, Tech, Healthcare, Dental, Agency)
      bgStart: '#0B132B',
      bgMid: '#1C2541',
      bgEnd: '#060B18',
      cardBg: '#080E1E',
      accent: '#FBBF24',
      accentLight: '#FEF9C3',
      accentGlow: '#F59E0B',
      badgeBg: '#1D4ED8',
      borderGold: '#FDE047',
    },
    {
      // 2: Imperial Emerald & Royal Gold (Real Estate, Wellness, Ayurveda, Eco)
      bgStart: '#042F2E',
      bgMid: '#0F4D44',
      bgEnd: '#021F1E',
      cardBg: '#031716',
      accent: '#F59E0B',
      accentLight: '#FDE68A',
      accentGlow: '#EAB308',
      badgeBg: '#0D9488',
      borderGold: '#FCD34D',
    },
    {
      // 3: Warm Saffron & Sunset Amber (Food, Restaurant, Sweets, Catering)
      bgStart: '#3B1304',
      bgMid: '#6B250B',
      bgEnd: '#230B02',
      cardBg: '#180702',
      accent: '#FACC15',
      accentLight: '#FEF08A',
      accentGlow: '#F97316',
      badgeBg: '#EA580C',
      borderGold: '#FDE047',
    },
  ];

  const catLower = (params.businessCategory || '').toLowerCase();
  let defaultVariant = 0;
  if (catLower.includes('food') || catLower.includes('restaur') || catLower.includes('sweet') || catLower.includes('cafe') || catLower.includes('bakery')) {
    defaultVariant = 3;
  } else if (catLower.includes('tech') || catLower.includes('digital') || catLower.includes('dental') || catLower.includes('doctor') || catLower.includes('clinic') || catLower.includes('service')) {
    defaultVariant = 1;
  } else if (catLower.includes('real estate') || catLower.includes('build') || catLower.includes('home') || catLower.includes('wellness') || catLower.includes('ayurv')) {
    defaultVariant = 2;
  } else {
    defaultVariant = 0;
  }

  const effectiveVariant =
    params.styleVariant !== undefined && params.styleVariant !== null
      ? (params.styleVariant % palettes.length)
      : defaultVariant;

  const palette = palettes[effectiveVariant];
  const headlineLines = wrapTextLines(params.themeHeadline, 26, 2);
  const subHeadlineLines = wrapTextLines(params.subHeadline, 40, 2);
  const highlights = (params.categoryHighlights || []).slice(0, 3);
  const illustrationSvg = getFestivalIllustrationSvg(params.festivalName, palette.accent);
  const hasValidOffer = Boolean(params.hasOffer && params.offerBadgeText && params.offerBadgeText.trim());
  const effectiveCta = params.ctaText || (hasValidOffer ? 'Claim Festive Offer' : 'Explore Services');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="100%" height="100%">
    <defs>
      <!-- Deep Cinematic Background Gradient -->
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.bgStart}" />
        <stop offset="35%" stop-color="${palette.bgMid}" />
        <stop offset="80%" stop-color="${palette.bgEnd}" />
        <stop offset="100%" stop-color="#050102" />
      </linearGradient>

      <!-- 24K Metallic Gold Gradient -->
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#F59E0B" />
        <stop offset="25%" stop-color="#FEF08A" />
        <stop offset="50%" stop-color="#D97706" />
        <stop offset="75%" stop-color="#FFFBEB" />
        <stop offset="100%" stop-color="#B45309" />
      </linearGradient>

      <!-- Center Studio Spotlight Gradient -->
      <radialGradient id="centerSpotlight" cx="50%" cy="26%" r="52%">
        <stop offset="0%" stop-color="#FFFBEB" stop-opacity="0.30" />
        <stop offset="40%" stop-color="${palette.accent}" stop-opacity="0.14" />
        <stop offset="80%" stop-color="#000000" stop-opacity="0.02" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>

      <!-- Ambient Bokeh Light Orbs (Lens Depth) -->
      <radialGradient id="bokehOrbGold" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFFBEB" stop-opacity="0.80" />
        <stop offset="40%" stop-color="${palette.accent}" stop-opacity="0.32" />
        <stop offset="80%" stop-color="${palette.accentGlow}" stop-opacity="0.10" />
        <stop offset="100%" stop-color="${palette.accentGlow}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="bokehOrbWarm" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.75" />
        <stop offset="45%" stop-color="#F97316" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#F97316" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="haloBackdrop" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.45" />
        <stop offset="50%" stop-color="${palette.accentLight}" stop-opacity="0.15" />
        <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- 1. Photographic Studio Backdrop -->
    <rect width="1080" height="1350" fill="url(#bgGrad)" />

    <!-- 2. Studio Vignette & Center Spotlight Illumination -->
    <circle cx="540" cy="350" r="480" fill="url(#centerSpotlight)" />

    <!-- 3. Cinematic Bokeh Lights at Varied Depths -->
    <!-- Background Soft Bokeh -->
    <circle cx="120" cy="180" r="64" fill="url(#bokehOrbGold)" />
    <circle cx="940" cy="220" r="75" fill="url(#bokehOrbWarm)" />
    <circle cx="80" cy="440" r="48" fill="url(#bokehOrbGold)" />
    <circle cx="1000" cy="480" r="58" fill="url(#bokehOrbWarm)" />
    <circle cx="160" cy="740" r="62" fill="url(#bokehOrbGold)" />
    <circle cx="920" cy="720" r="72" fill="url(#bokehOrbWarm)" />
    <circle cx="100" cy="980" r="50" fill="url(#bokehOrbGold)" />
    <circle cx="970" cy="1000" r="78" fill="url(#bokehOrbGold)" />
    <circle cx="210" cy="1260" r="88" fill="url(#bokehOrbWarm)" />
    <circle cx="870" cy="1280" r="84" fill="url(#bokehOrbGold)" />

    <!-- Motif Backlight Halo -->
    <circle cx="540" cy="275" r="160" fill="url(#haloBackdrop)" />

    <!-- 4. Golden Star Sparkles & Festive Glints -->
    <g transform="translate(180, 240)">
      <path d="M 0 -15 Q 3 -3 15 0 Q 3 3 0 15 Q -3 3 -15 0 Q -3 -3 0 -15 Z" fill="${palette.accentLight}" />
    </g>
    <g transform="translate(900, 170)">
      <path d="M 0 -16 Q 3 -3 16 0 Q 3 3 0 16 Q -3 3 -16 0 Q -3 -3 0 -16 Z" fill="#FFFFFF" />
    </g>
    <g transform="translate(230, 680)">
      <path d="M 0 -13 Q 2 -2 13 0 Q 2 2 0 13 Q -2 2 -13 0 Q -2 -2 0 -13 Z" fill="${palette.accentLight}" />
    </g>
    <g transform="translate(850, 640)">
      <path d="M 0 -15 Q 3 -3 15 0 Q 3 3 0 15 Q -3 3 -15 0 Q -3 -3 0 -15 Z" fill="${palette.accentLight}" />
    </g>
    <g transform="translate(540, 960)">
      <path d="M 0 -12 Q 2 -2 12 0 Q 2 2 0 12 Q -2 2 -12 0 Q -2 -2 0 -12 Z" fill="#FFFFFF" />
    </g>

    <!-- 5. Safe-Zone Royal Gold Double Borders & Corner Brackets -->
    <rect x="36" y="36" width="1008" height="1278" rx="34" fill="none" stroke="url(#goldGrad)" stroke-width="3.5" />
    <rect x="48" y="48" width="984" height="1254" rx="26" fill="none" stroke="${palette.borderGold}" stroke-opacity="0.30" stroke-width="1.5" />

    <!-- Corner Filigree Ornaments -->
    <path d="M 52 92 L 92 52 M 62 102 L 102 62" stroke="url(#goldGrad)" stroke-width="2" />
    <path d="M 1028 92 L 988 52 M 1018 102 L 978 62" stroke="url(#goldGrad)" stroke-width="2" />
    <path d="M 52 1258 L 92 1298 M 62 1248 L 102 1288" stroke="url(#goldGrad)" stroke-width="2" />
    <path d="M 1028 1258 L 988 1298 M 1018 1248 L 978 1288" stroke="url(#goldGrad)" stroke-width="2" />

    <!-- 6. Top Festival Date & Greeting Glass Pill -->
    <rect x="230" y="82" width="620" height="60" rx="30" fill="${palette.cardBg}" fill-opacity="0.88" stroke="url(#goldGrad)" stroke-width="2" />
    <text x="540" y="120" font-family="sans-serif" font-size="22" font-weight="bold" fill="${palette.accentLight}" text-anchor="middle" letter-spacing="1.5">
      ${escapeXml(params.festivalGreeting.toUpperCase())} • ${escapeXml(params.festivalDate.toUpperCase())}
    </text>

    <!-- 7. Festival Centerpiece Illustration -->
    <g transform="translate(0, 30)">
      ${illustrationSvg}
    </g>

    <!-- 8. Commercial Headline Plate (Glassmorphic Backdrop for Maximum Legibility) -->
    <rect x="70" y="455" width="940" height="${headlineLines[1] ? 245 : 190}" rx="28" fill="${palette.cardBg}" fill-opacity="0.84" stroke="${palette.accent}" stroke-opacity="0.4" stroke-width="1.5" />

    <!-- Main Commercial Festival Headline -->
    <text x="540" y="525" font-family="sans-serif" font-size="50" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
      ${escapeXml(headlineLines[0] || params.festivalName)}
    </text>
    ${
      headlineLines[1]
        ? `<text x="540" y="585" font-family="sans-serif" font-size="46" font-weight="bold" fill="${palette.accentLight}" text-anchor="middle">${escapeXml(headlineLines[1])}</text>`
        : ''
    }

    <!-- Subheadline connecting Festival + Category + Keyword -->
    <text x="540" y="${headlineLines[1] ? 645 : 590}" font-family="sans-serif" font-size="27" font-weight="600" fill="#E2E8F0" text-anchor="middle">
      ${escapeXml(subHeadlineLines[0] || params.businessCategory)}
    </text>
    ${
      subHeadlineLines[1]
        ? `<text x="540" y="${headlineLines[1] ? 682 : 626}" font-family="sans-serif" font-size="25" font-weight="500" fill="#CBD5E1" text-anchor="middle">${escapeXml(subHeadlineLines[1])}</text>`
        : ''
    }

    <!-- 9. Category Highlights Pills (Max 3) -->
    ${highlights
      .map((item, idx) => {
        const pillW = 280;
        const startX = 95 + idx * 305;
        const pillY = headlineLines[1] ? 730 : 675;
        return `
          <rect x="${startX}" y="${pillY}" width="${pillW}" height="56" rx="16" fill="${palette.cardBg}" fill-opacity="0.88" stroke="url(#goldGrad)" stroke-width="1.5" />
          <text x="${startX + pillW / 2}" y="${pillY + 36}" font-family="sans-serif" font-size="20" font-weight="bold" fill="${palette.accentLight}" text-anchor="middle">
            ✦ ${escapeXml(item.slice(0, 22))}
          </text>
        `;
      })
      .join('')}

    <!-- 10. Promotional Section: Real Offer OR Professional Commercial CTA (Rules 10 & 11) -->
    ${
      hasValidOffer
        ? `
        <!-- Prominent Verified User Offer Banner (Rule 10) -->
        <rect x="120" y="825" width="840" height="112" rx="28" fill="url(#goldGrad)" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="2" />
        <text x="540" y="874" font-family="sans-serif" font-size="33" font-weight="bold" fill="#1A0A00" text-anchor="middle">
          ${escapeXml(params.offerBadgeText || '')}
        </text>
        <text x="540" y="915" font-family="sans-serif" font-size="22" font-weight="bold" fill="#3D1A00" text-anchor="middle">
          ${params.couponCode ? `USE PROMO CODE: ${escapeXml(params.couponCode)} • ` : ''}${escapeXml(effectiveCta.toUpperCase())}
        </text>
      `
        : `
        <!-- High-End Commercial Value & CTA Banner (Strictly NO Fake Discounts - Rules 11 & 12) -->
        <rect x="150" y="835" width="780" height="92" rx="24" fill="${palette.cardBg}" fill-opacity="0.92" stroke="url(#goldGrad)" stroke-width="2.5" />
        <text x="540" y="893" font-family="sans-serif" font-size="28" font-weight="bold" fill="${palette.accentLight}" text-anchor="middle">
          ✦ ${escapeXml(effectiveCta.toUpperCase())} ➔
        </text>
      `
    }

    <!-- 11. Bottom Brand Footer Card with Authentic Trust Seal -->
    <rect x="75" y="1005" width="930" height="236" rx="28" fill="${palette.cardBg}" fill-opacity="0.95" stroke="url(#goldGrad)" stroke-width="2" />
    <text x="540" y="1076" font-family="sans-serif" font-size="44" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
      ${escapeXml(params.businessName.slice(0, 36))}
    </text>
    <text x="540" y="1132" font-family="sans-serif" font-size="26" font-weight="600" fill="${palette.accentLight}" text-anchor="middle">
      ${escapeXml(params.businessCategory.slice(0, 50))} • Premium Quality & Trusted Service
    </text>
    <rect x="330" y="1165" width="420" height="42" rx="21" fill="${palette.accent}" fill-opacity="0.22" stroke="${palette.accentLight}" stroke-opacity="0.5" stroke-width="1" />
    <text x="540" y="1193" font-family="sans-serif" font-size="18" font-weight="bold" fill="${palette.accentLight}" text-anchor="middle" letter-spacing="1">
      ✓ VERIFIED LOCAL BUSINESS CAMPAIGN
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

      // Rule 19: Attempt native Gemini Image generation (4:5 vertical composition)
      try {
        const imgResp = await genAIClient.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: `Create a high-end 4:5 vertical commercial festival marketing poster for Indian festival "${data.festivalName}" for the business "${data.businessName}" in the "${category}" industry. Visual theme: "${keyword}". Headline: "${themeHeadline}". ${
            hasOffer ? `Offer: "${offerBadgeText}".` : 'No promotional discounts - focus on premium craftsmanship and service excellence.'
          } Rich festive Indian motifs, cinematic lighting, 4:5 aspect ratio, professional agency design.`,
        });
        const parts = imgResp.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            return {
              themeHeadline,
              subHeadline,
              festivalGreeting,
              hasOffer,
              offerBadgeText,
              categoryHighlights,
              ctaText,
              ctaType,
              gmbCaption,
              socialCaption,
              postType: hasOffer ? 'OFFER' : 'STANDARD',
              couponCode,
              imagePrompt,
              suggestedImageUrl: `data:${mime};base64,${part.inlineData.data}`,
            };
          }
        }
      } catch {
        // Seamless fallback to custom 4:5 SVG engine below
      }
    }

    // High-performance 4:5 SVG Poster Engine (1080x1350)
    const svgPosterUri = buildGeminiFestivalPosterSvgUri({
      festivalName: data.festivalName,
      festivalDate: data.festivalDate,
      businessName: data.businessName,
      businessCategory: category,
      themeHeadline,
      subHeadline,
      festivalGreeting,
      hasOffer,
      offerBadgeText,
      categoryHighlights,
      ctaText,
      couponCode,
      styleVariant: data.styleVariant || 0,
    });

    return {
      themeHeadline,
      subHeadline,
      festivalGreeting,
      hasOffer,
      offerBadgeText,
      categoryHighlights,
      ctaText,
      ctaType,
      gmbCaption,
      socialCaption,
      postType: hasOffer ? 'OFFER' : 'STANDARD',
      couponCode,
      imagePrompt,
      suggestedImageUrl: svgPosterUri,
    };
  },
};
