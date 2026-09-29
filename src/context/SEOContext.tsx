import React, { createContext, useContext, useState, useEffect } from 'react';
import { SemrushService, SemrushDomainData, SemrushKeywordData } from '../services/google/semrush';
import { SEOAudit, SEOCheckItem, WebAuditResult } from '../types';
import { useGoogle } from './GoogleContext';
import { useReviews } from './ReviewsContext';
import { useBusiness } from './BusinessContext';
import { LocalCache } from '../offline/storage';

interface SEOContextType {
  audit: SEOAudit | null;
  runAudit: () => void;
  isLoadingAudit: boolean;
  // Comprehensive Web & Technical Audit
  webAudit: WebAuditResult | null;
  runWebAudit: (targetUrl?: string) => Promise<void>;
  isLoadingWebAudit: boolean;
  // Semrush research
  domainData: SemrushDomainData | null;
  competitorData: SemrushDomainData | null;
  keywordData: SemrushKeywordData | null;
  isResearching: boolean;
  researchError: string | null;
  analyzeDomain: (domain: string, isCompetitor?: boolean) => Promise<void>;
  researchKeyword: (keyword: string) => Promise<void>;
}

const SEOContext = createContext<SEOContextType | undefined>(undefined);

export const SEOProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedLocation } = useGoogle();
  const { reviews } = useReviews();
  const { activeBusiness } = useBusiness();

  const [audit, setAudit] = useState<SEOAudit | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);

  const [domainData, setDomainData] = useState<SemrushDomainData | null>(null);
  const [competitorData, setCompetitorData] = useState<SemrushDomainData | null>(null);
  const [keywordData, setKeywordData] = useState<SemrushKeywordData | null>(null);
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [researchError, setResearchError] = useState<string | null>(null);

  const [webAudit, setWebAudit] = useState<WebAuditResult | null>(null);
  const [isLoadingWebAudit, setIsLoadingWebAudit] = useState<boolean>(false);

  useEffect(() => {
    if (selectedLocation) {
      evaluateLocalSEO();
      if (selectedLocation.websiteUri) {
        runWebAudit(selectedLocation.websiteUri);
      } else {
        setWebAudit(null);
      }
    } else {
      setAudit(null);
      setWebAudit(null);
    }
  }, [selectedLocation?.id, selectedLocation?.websiteUri, reviews.length]);

  const evaluateLocalSEO = () => {
    if (!selectedLocation) return;
    setIsLoadingAudit(true);

    const answeredReviews = reviews.filter((r) => Boolean(r.reviewReply?.comment)).length;
    const responseRate = reviews.length > 0 ? (answeredReviews / reviews.length) * 100 : 0;

    const checks: SEOCheckItem[] = [
      {
        id: 'category',
        title: 'Primary Google Category',
        status: selectedLocation.categories?.primaryCategory?.displayName ? 'pass' : 'fail',
        evidence: selectedLocation.categories?.primaryCategory?.displayName
          ? `Primary Category: "${selectedLocation.categories.primaryCategory.displayName}"`
          : 'No primary category assigned on Google Business Profile',
        action: selectedLocation.categories?.primaryCategory?.displayName
          ? 'Category is verified on Google.'
          : 'Set your primary business category to rank for local search queries.',
        priority: 'critical',
        source: 'Google Business Information API',
      },
      {
        id: 'address',
        title: 'Storefront Physical Address',
        status: selectedLocation.storefrontAddress?.addressLines?.length ? 'pass' : 'warning',
        evidence: selectedLocation.storefrontAddress?.addressLines?.length
          ? [
              ...(selectedLocation.storefrontAddress.addressLines || []),
              selectedLocation.storefrontAddress.locality,
              selectedLocation.storefrontAddress.postalCode,
            ]
              .filter(Boolean)
              .join(', ')
          : 'Service-area business or street address not listed',
        action: selectedLocation.storefrontAddress?.addressLines?.length
          ? 'Physical storefront address verified.'
          : 'Add physical street address to improve Google Maps local pack ranking.',
        priority: 'critical',
        source: 'Google Business Information API',
      },
      {
        id: 'phone',
        title: 'Contact Phone Number',
        status: selectedLocation.phoneNumbers?.primaryPhone ? 'pass' : 'fail',
        evidence: selectedLocation.phoneNumbers?.primaryPhone || 'No phone number configured',
        action: selectedLocation.phoneNumbers?.primaryPhone
          ? 'Customer click-to-call phone number active.'
          : 'Add a verified phone number for customer call leads.',
        priority: 'high',
        source: 'Google Business Information API',
      },
      {
        id: 'website',
        title: 'Website Link on GMB',
        status: selectedLocation.websiteUri ? 'pass' : 'fail',
        evidence: selectedLocation.websiteUri || 'No website URL linked on this GMB listing',
        action: selectedLocation.websiteUri
          ? `Linked to ${selectedLocation.websiteUri}`
          : 'Link your business website in Google Business Profile.',
        priority: 'high',
        source: 'Google Business Information API',
      },
      {
        id: 'hours',
        title: 'Regular Operating Hours',
        status: selectedLocation.regularHours?.periods?.length ? 'pass' : 'fail',
        evidence: selectedLocation.regularHours?.periods?.length
          ? `${selectedLocation.regularHours.periods.length} operating day periods configured`
          : 'Business operating hours not specified',
        action: selectedLocation.regularHours?.periods?.length
          ? 'Operating hours are configured.'
          : 'Specify operating hours so customers see Open Now status on Google Maps.',
        priority: 'medium',
        source: 'Google Business Information API',
      },
      {
        id: 'review_response',
        title: 'Review Response Engagement',
        status:
          reviews.length === 0
            ? 'warning'
            : responseRate >= 80
            ? 'pass'
            : responseRate >= 50
            ? 'warning'
            : 'fail',
        evidence:
          reviews.length === 0
            ? '0 reviews recorded on this listing yet'
            : `${responseRate.toFixed(0)}% response rate (${answeredReviews}/${reviews.length} replied)`,
        action:
          reviews.length === 0
            ? 'Share your Google review link with customers to collect reviews.'
            : responseRate >= 80
            ? 'Strong owner reply rate on customer reviews.'
            : 'Reply to unanswered customer reviews to improve local ranking.',
        priority: 'high',
        source: 'Google My Business Reviews API',
      },
    ];

    const passedCount = checks.filter((c) => c.status === 'pass').length;
    const newAudit: SEOAudit = {
      locationId: selectedLocation.id,
      checkedAt: Date.now(),
      checks,
      passedCount,
      totalChecks: checks.length,
    };

    setAudit(newAudit);
    if (activeBusiness) {
      LocalCache.cacheSEOAudit(activeBusiness.id, newAudit);
    }
    setIsLoadingAudit(false);
  };

  const analyzeDomain = async (domain: string, isCompetitor = false) => {
    setIsResearching(true);
    setResearchError(null);
    try {
      const data = await SemrushService.fetchDomainSummary(domain);
      if (isCompetitor) {
        setCompetitorData(data);
      } else {
        setDomainData(data);
      }
    } catch (err: any) {
      setResearchError(err.message || 'Domain analysis failed');
    } finally {
      setIsResearching(false);
    }
  };

  const researchKeyword = async (keyword: string) => {
    setIsResearching(true);
    setResearchError(null);
    try {
      const data = await SemrushService.fetchKeywordData(keyword);
      setKeywordData(data);
    } catch (err: any) {
      setResearchError(err.message || 'Keyword research failed');
    } finally {
      setIsResearching(false);
    }
  };

  const runWebAudit = async (targetUrl?: string) => {
    const rawUrl = (targetUrl ?? selectedLocation?.websiteUri ?? '').trim();
    if (!rawUrl) {
      setWebAudit(null);
      return;
    }

    const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    setIsLoadingWebAudit(true);
    const startMs = Date.now();

    try {
      const response = await fetch(normalizedUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      const responseTimeMs = Math.max(1, Date.now() - startMs);
      const html = await response.text();
      const lowerHtml = html.toLowerCase();

      const isHttps = normalizedUrl.toLowerCase().startsWith('https://');
      const hasViewport = lowerHtml.includes('name="viewport"') || lowerHtml.includes("name='viewport'");
      const hasSchema =
        lowerHtml.includes('application/ld+json') || lowerHtml.includes('localbusiness');
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1].trim() : '';
      const hasMetaDesc =
        lowerHtml.includes('name="description"') || lowerHtml.includes("name='description'");

      const locality = selectedLocation?.storefrontAddress?.locality || '';
      const hasLocalityInHtml = locality
        ? lowerHtml.includes(locality.toLowerCase())
        : Boolean(pageTitle);

      const rawPhone = selectedLocation?.phoneNumbers?.primaryPhone || '';
      const cleanPhoneDigits = rawPhone.replace(/\D/g, '').slice(-8);
      const hasPhoneOnPage = cleanPhoneDigits ? html.replace(/\D/g, '').includes(cleanPhoneDigits) : false;

      const speedScore =
        responseTimeMs <= 600 ? 95 : responseTimeMs <= 1400 ? 80 : responseTimeMs <= 2500 ? 65 : 45;
      const seoScore =
        (pageTitle ? 30 : 0) +
        (hasMetaDesc ? 25 : 0) +
        (hasSchema ? 25 : 0) +
        (hasLocalityInHtml ? 20 : 0);
      const mobileScore = hasViewport ? 95 : 45;
      const securityScore = isHttps && response.ok ? 100 : isHttps ? 75 : 40;
      const overallScore = Math.round((speedScore + seoScore + mobileScore + securityScore) / 4);

      const result: WebAuditResult = {
        url: normalizedUrl,
        overallScore,
        performanceScore: speedScore,
        seoScore,
        mobileScore,
        securityScore,
        schemaValid: hasSchema,
        sslValid: isHttps,
        responseTimeMs,
        scannedAt: Date.now(),
        checks: [
          {
            id: 'check_title_meta',
            category: 'Schema & SEO',
            title: 'HTML Title & Meta Description',
            status: pageTitle && hasMetaDesc ? 'pass' : pageTitle ? 'warning' : 'fail',
            detail: pageTitle
              ? `Title found: "${pageTitle.slice(0, 80)}" (${
                  hasMetaDesc ? 'Meta description present' : 'Missing meta description'
                })`
              : 'No <title> tag detected on page.',
            fixAction:
              pageTitle && hasMetaDesc
                ? 'Title and meta description tags are present.'
                : 'Add a descriptive <title> and <meta name="description"> tag.',
          },
          {
            id: 'check_schema',
            category: 'Schema & SEO',
            title: 'Schema.org Structured Data (JSON-LD)',
            status: hasSchema ? 'pass' : 'warning',
            detail: hasSchema
              ? 'Structured data (JSON-LD / LocalBusiness) detected in page HTML.'
              : 'No JSON-LD LocalBusiness schema markup detected in page HTML.',
            fixAction: hasSchema
              ? 'Keep Schema.org fields synced with your GMB profile.'
              : 'Add LocalBusiness JSON-LD schema with your business name, address, and phone.',
          },
          {
            id: 'check_gmb_nap',
            category: 'GMB 3-Pack',
            title: 'GMB Location & Phone Match on Website',
            status: hasPhoneOnPage && hasLocalityInHtml ? 'pass' : hasLocalityInHtml ? 'warning' : 'fail',
            detail: `City "${locality || 'N/A'}": ${
              hasLocalityInHtml ? 'Found on page' : 'Not found on page'
            } | GMB Phone: ${hasPhoneOnPage ? 'Found on page' : 'Not matched on page'}`,
            fixAction:
              'Ensure your exact GMB phone number and city name appear in your website footer.',
          },
          {
            id: 'check_mobile',
            category: 'Mobile Friendly',
            title: 'Mobile Viewport Meta Tag',
            status: hasViewport ? 'pass' : 'fail',
            detail: hasViewport
              ? 'Responsive <meta name="viewport"> tag is configured.'
              : 'Missing <meta name="viewport"> tag for mobile devices.',
            fixAction: hasViewport
              ? 'Mobile viewport configuration verified.'
              : 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
          },
          {
            id: 'check_speed',
            category: 'Page Speed',
            title: 'Live HTTP Response Time',
            status: responseTimeMs <= 1000 ? 'pass' : responseTimeMs <= 2200 ? 'warning' : 'fail',
            detail: `Live HTTP status ${response.status} received in ${responseTimeMs} ms.`,
            fixAction:
              responseTimeMs <= 1000
                ? 'Server response time is fast.'
                : 'Optimize server caching and compress images to reduce response time under 1000 ms.',
          },
          {
            id: 'check_ssl',
            category: 'Security',
            title: 'HTTPS Encryption',
            status: isHttps ? 'pass' : 'fail',
            detail: isHttps
              ? `Connected securely over HTTPS (${normalizedUrl}).`
              : `Website URL uses unencrypted HTTP (${normalizedUrl}).`,
            fixAction: isHttps
              ? 'HTTPS is active.'
              : 'Enable SSL/HTTPS and update your GMB website link to https://.',
          },
        ],
      };

      setWebAudit(result);
    } catch (err: any) {
      const responseTimeMs = Math.max(1, Date.now() - startMs);
      setWebAudit({
        url: normalizedUrl,
        overallScore: 0,
        performanceScore: 0,
        seoScore: 0,
        mobileScore: 0,
        securityScore: normalizedUrl.startsWith('https://') ? 50 : 0,
        schemaValid: false,
        sslValid: normalizedUrl.startsWith('https://'),
        responseTimeMs,
        scannedAt: Date.now(),
        checks: [
          {
            id: 'check_reachability',
            category: 'Page Speed',
            title: 'Website Reachability',
            status: 'fail',
            detail: `Could not reach ${normalizedUrl}: ${err?.message || 'Network or DNS error'}`,
            fixAction: 'Verify that the website URL on your Google Business Profile is live and publicly reachable.',
          },
        ],
      });
    } finally {
      setIsLoadingWebAudit(false);
    }
  };

  return (
    <SEOContext.Provider
      value={{
        audit,
        runAudit: evaluateLocalSEO,
        isLoadingAudit,
        webAudit,
        runWebAudit,
        isLoadingWebAudit,
        domainData,
        competitorData,
        keywordData,
        isResearching,
        researchError,
        analyzeDomain,
        researchKeyword,
      }}
    >
      {children}
    </SEOContext.Provider>
  );
};

export const useSEO = () => {
  const context = useContext(SEOContext);
  if (!context) throw new Error('useSEO must be used within SEOProvider');
  return context;
};
