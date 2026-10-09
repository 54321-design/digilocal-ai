/**
 * Brand Name & Industry Intelligence Extractor
 * Extracts clean brand names from GMB listings and maps industry-specific
 * photorealistic imagery and poster templates.
 */

export interface IndustryVisualPreset {
  industryKey: string;
  tagline: string;
  defaultHeadline: string;
  defaultSubheadline: string;
  defaultHighlights: [string, string, string];
  defaultCta: string;
  /** High-resolution commercial 4K photographic backdrop tailored to the industry */
  photographicBackdropUrl: string;
  /** Prompt description for AI image engines (DALL-E 3 / Flux) */
  sceneDescription: string;
}

/**
 * Extracts a clean, short, professional brand name from GMB location titles.
 * E.g.:
 * - "DigiBirds Digital Marketing & Cafe - Best SEO & Social Media Agency" -> "DigiBirds 360"
 * - "Shreeji Homes Real Estate Builders & Construction Pvt Ltd" -> "Shreeji Homes"
 * - "Apex Realty | Luxury 2 & 3 BHK Apartments Noida" -> "Apex Realty"
 * - "Dr. Sharma Dental Clinic & Implant Center" -> "Dr. Sharma Dental Clinic"
 * - "Haldiram's Sweets & Restaurant - Connaught Place" -> "Haldiram's Sweets"
 */
export function extractCleanBrandName(rawTitle?: string): string {
  if (!rawTitle) return 'Our Business';

  // Normalize DigiBirds locations to agency brand
  if (/^digibirds/i.test(rawTitle)) {
    return 'DigiBirds 360';
  }

  // 1. Split by common GMB title delimiters: ' - ', ' | ', ' – ', ' — ', ' : ', ' • ', ' / ', ' ( '
  let clean = rawTitle.split(/\s*[-|–—:•/(]\s*/)[0].trim();

  // 2. Remove corporate suffixes (Pvt Ltd, LLC, Inc, Co., etc.)
  clean = clean
    .replace(/,\s*(Pvt\.?\s*Ltd\.?|Private\s*Limited|LLP|Ltd\.?|Inc\.?|LLC|Corp\.?)$/i, '')
    .trim();

  // 3. Remove trailing comma-separated branch/location names
  clean = clean.split(/,\s*/)[0].trim();

  // 4. Word-level intelligence: extract core brand identity
  const words = clean.split(/\s+/);
  if (words.length > 2) {
    const firstLower = words[0].toLowerCase();
    const secondLower = words[1].toLowerCase();

    // Recognize prefixes that need 3-4 words: "Dr.", "Shree", "Shri", "The"
    if (firstLower.startsWith('dr')) {
      if (words.length >= 4 && /clinic|dental|hospital|care/i.test(words[3])) {
        clean = words.slice(0, 4).join(' ');
      } else {
        clean = words.slice(0, 3).join(' ');
      }
    } else if (firstLower === 'shree' || firstLower === 'shri' || firstLower === 'the') {
      clean = words.slice(0, 2).join(' ');
    } else {
      const brandDescriptors = [
        'homes',
        'realty',
        'builders',
        'properties',
        'estates',
        'sweets',
        'bakers',
        'jewellers',
        'jewelers',
        'clinic',
        'hospital',
        'dental',
        'studio',
        'agency',
        'academy',
        'school',
        'institute',
        'motors',
        'cafe',
        'fitness',
        'gym',
        'salon',
        'spa',
        'consultancy',
      ];
      if (brandDescriptors.includes(secondLower)) {
        clean = words.slice(0, 2).join(' ');
      } else if (words.length >= 3 && brandDescriptors.includes(words[2].toLowerCase())) {
        clean = words.slice(0, 3).join(' ');
      } else {
        clean = words.slice(0, 2).join(' ');
      }
    }
  }

  return clean || rawTitle.slice(0, 24);
}

/**
 * Returns tailored visual presets, high-res photography backdrops,
 * and commercial advertising themes matching the user's business industry.
 */
export function getIndustryVisualPreset(
  categoryInput?: string,
  keywordInput?: string
): IndustryVisualPreset {
  const combined = `${categoryInput || ''} ${keywordInput || ''}`.toLowerCase();

  // 1. Real Estate / Building Homes / Construction / Builders / Architecture
  if (
    combined.includes('real estate') ||
    combined.includes('home') ||
    combined.includes('build') ||
    combined.includes('construct') ||
    combined.includes('flat') ||
    combined.includes('propert') ||
    combined.includes('villa') ||
    combined.includes('architect')
  ) {
    return {
      industryKey: 'real_estate',
      tagline: 'BUILDING BETTER TOMORROWS',
      defaultHeadline: 'Celebrate Victory With Your Dream Home',
      defaultSubheadline:
        'This festive season, choose a space where happiness, comfort and new beginnings live.',
      defaultHighlights: ['Premium Homes', 'Green Living', 'Safe & Secure'],
      defaultCta: 'Explore Our Projects',
      // High-res luxury modern illuminated villa with sunset sky
      photographicBackdropUrl:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1080&q=85',
      sceneDescription:
        'A magnificent modern luxury two-story illuminated glass villa glowing with warm interior lights and festive floral garlands, happy Indian family in traditional festive attire admiring their dream home, under a majestic golden sunset dusk sky with warm festive aura.',
    };
  }

  // 2. Digital Marketing / Agency / Advertising / Tech / Software / IT
  if (
    combined.includes('digital') ||
    combined.includes('marketing') ||
    combined.includes('agency') ||
    combined.includes('seo') ||
    combined.includes('software') ||
    combined.includes('tech') ||
    combined.includes('web') ||
    combined.includes('social media') ||
    combined.includes('advertis')
  ) {
    return {
      industryKey: 'digital_marketing',
      tagline: 'STRATEGY • CREATIVITY • GROWTH',
      defaultHeadline: 'Burn Old Strategies & Welcome New Growth',
      defaultSubheadline:
        'This festive season, choose digital marketing to overcome competition and achieve your business goals.',
      defaultHighlights: ['Social Media Growth', 'SEO Services', 'Performance Ads'],
      defaultCta: "Let's Grow Together",
      // Sleek creative agency workspace with analytics laptop and festive diya
      photographicBackdropUrl:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1080&q=85',
      sceneDescription:
        'A sleek modern creative agency desk with high-end laptop displaying upward analytics charts, festive golden diya illumination, notebook with business growth notes, warm ambient festive lighting.',
    };
  }

  // 3. Restaurant / Cafe / Sweets / Bakery / Food / Catering / Halwai
  if (
    combined.includes('food') ||
    combined.includes('restaur') ||
    combined.includes('sweet') ||
    combined.includes('cafe') ||
    combined.includes('bakery') ||
    combined.includes('mithai') ||
    combined.includes('cater')
  ) {
    return {
      industryKey: 'food_sweets',
      tagline: 'PURE TASTE • SWEET TRADITIONS',
      defaultHeadline: 'Sweeten Your Celebrations With Pure Delight',
      defaultSubheadline:
        'Celebrate this festive season with authentic traditional flavors and festive gift hampers.',
      defaultHighlights: ['Pure Desi Ghee', 'Handcrafted Sweets', 'Festive Gift Packs'],
      defaultCta: 'Order Festive Sweets',
      photographicBackdropUrl:
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1080&q=85',
      sceneDescription:
        'Lavish festive Indian sweets gift hampers, royal golden thali with motichoor laddoos and kaju katli, glowing earthen diyas, marigold floral decorations, warm ambient luxury lighting.',
    };
  }

  // 4. Healthcare / Doctor / Dental / Clinic / Hospital / Wellness
  if (
    combined.includes('doctor') ||
    combined.includes('dent') ||
    combined.includes('clinic') ||
    combined.includes('health') ||
    combined.includes('medic') ||
    combined.includes('hospital') ||
    combined.includes('ayurv')
  ) {
    return {
      industryKey: 'healthcare',
      tagline: 'EXCELLENCE IN CARING HEARTS',
      defaultHeadline: 'A Healthy Smile For Every Festive Moment',
      defaultSubheadline:
        'This festive season, gift your loved ones the blessing of complete health and bright smiles.',
      defaultHighlights: ['Advanced Care', 'Experienced Doctors', 'Painless Treatments'],
      defaultCta: 'Book Health Consultation',
      photographicBackdropUrl:
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1080&q=85',
      sceneDescription:
        'Modern high-tech clinic environment, warm caring atmosphere, happy healthy Indian family smiling with vitality, festive golden ambient lighting.',
    };
  }

  // 5. Salon / Beauty / Spa / Makeup / Hair
  if (
    combined.includes('salon') ||
    combined.includes('beauty') ||
    combined.includes('spa') ||
    combined.includes('makeup') ||
    combined.includes('hair') ||
    combined.includes('parlour')
  ) {
    return {
      industryKey: 'beauty_salon',
      tagline: 'ELEGANCE • GLOW • PERFECTION',
      defaultHeadline: 'Glow Radiantly This Festive Season',
      defaultSubheadline:
        'Step into celebration with luxury festive makeovers, skincare rituals, and signature styling.',
      defaultHighlights: ['Festive Glow Facials', 'Bridal & Party Makeup', 'Luxury Hair Spa'],
      defaultCta: 'Book Your Makeover',
      photographicBackdropUrl:
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1080&q=85',
      sceneDescription:
        'Luxurious modern beauty salon studio, elegant festive makeover setting, glowing mirrors, traditional festive glow and elegance, warm golden ambient lighting.',
    };
  }

  // 6. Jewelry / Gold / Diamond / Fashion / Retail / Clothing
  if (
    combined.includes('jewel') ||
    combined.includes('gold') ||
    combined.includes('diamond') ||
    combined.includes('fashion') ||
    combined.includes('cloth') ||
    combined.includes('saree') ||
    combined.includes('retail')
  ) {
    return {
      industryKey: 'jewelry_retail',
      tagline: 'TIMELESS HERITAGE • PURE PURITY',
      defaultHeadline: 'Celebrate Prosperity With Pure Gold',
      defaultSubheadline:
        'Adorn your celebrations with timeless handcrafted heritage jewelry designs.',
      defaultHighlights: ['100% BIS Hallmarked', 'Antique & Modern Designs', 'Certified Diamonds'],
      defaultCta: 'Explore Collection',
      photographicBackdropUrl:
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1080&q=85',
      sceneDescription:
        'Sparkling royal Indian gold jewelry collection on velvet display, festive diwali lights, glowing lamps, luxurious retail showroom.',
    };
  }

  // 7. Automobile / Car Dealer / Bike / Garage / EV
  if (
    combined.includes('car') ||
    combined.includes('auto') ||
    combined.includes('motor') ||
    combined.includes('bike') ||
    combined.includes('garage') ||
    combined.includes('ev ')
  ) {
    return {
      industryKey: 'automotive',
      tagline: 'PERFORMANCE • TRUST • INNOVATION',
      defaultHeadline: 'Drive Home Your Dream Ride This Festive Season',
      defaultSubheadline:
        'Celebrate auspicious new beginnings with exclusive festive benefits on new models.',
      defaultHighlights: ['Zero Down Payment', 'Exchange Bonus', 'Fast Delivery'],
      defaultCta: 'Book Test Drive',
      photographicBackdropUrl:
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1080&q=85',
      sceneDescription:
        'Gleaming new modern luxury automobile in a premium showroom adorned with festive floral garlands, warm golden spotlights.',
    };
  }

  // 8. Fitness / Gym / Yoga / Sports
  if (
    combined.includes('gym') ||
    combined.includes('fit') ||
    combined.includes('yoga') ||
    combined.includes('sport') ||
    combined.includes('crossfit')
  ) {
    return {
      industryKey: 'fitness',
      tagline: 'POWER • DISCIPLINE • RESULTS',
      defaultHeadline: 'Celebrate Strength, Energy & Fitness',
      defaultSubheadline:
        'Transform your lifestyle with personalized training and festive membership benefits.',
      defaultHighlights: ['Certified Trainers', 'State-of-Art Equipment', 'Personalized Diet Plans'],
      defaultCta: 'Start Free Trial',
      photographicBackdropUrl:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1080&q=85',
      sceneDescription:
        'Modern premium fitness center with state-of-the-art equipment, motivational energetic atmosphere, warm golden festive lighting.',
    };
  }

  // 9. Default / General Business & Professional Services
  return {
    industryKey: 'general_services',
    tagline: 'INNOVATION • TRUST • RESULTS',
    defaultHeadline: 'Elevate Your Success This Festive Season',
    defaultSubheadline:
      'Trusted professional solutions crafted to accelerate your growth and deliver peace of mind.',
    defaultHighlights: ['Trusted Expertise', 'Fast Execution', '100% Satisfaction'],
    defaultCta: 'Get Started Today',
    photographicBackdropUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1080&q=85',
    sceneDescription:
      'Grand modern luxury corporate setting with warm festive ambient lighting, glowing golden celebratory atmosphere, award-winning commercial quality.',
  };
}
