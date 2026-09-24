import React, { createContext, useContext, useState, useEffect } from 'react';
import { SemrushService, SemrushDomainData, SemrushKeywordData } from '../services/google/semrush';
import { SEOAudit, SEOCheckItem } from '../types';
import { useGoogle } from './GoogleContext';
import { useReviews } from './ReviewsContext';
import { useBusiness } from './BusinessContext';
import { LocalCache } from '../offline/storage';

interface SEOContextType {
  audit: SEOAudit | null;
  runAudit: () => void;
  isLoadingAudit: boolean;
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

  useEffect(() => {
    if (selectedLocation) {
      evaluateLocalSEO();
    } else if (activeBusiness) {
      LocalCache.getCachedSEOAudit(activeBusiness.id).then((cached) => {
        if (cached) setAudit(cached);
      });
    }
  }, [selectedLocation?.id, reviews.length]);

  const evaluateLocalSEO = () => {
    if (!selectedLocation) return;
    setIsLoadingAudit(true);

    const answeredReviews = reviews.filter((r) => Boolean(r.reviewReply?.comment)).length;
    const responseRate = reviews.length > 0 ? (answeredReviews / reviews.length) * 100 : 100;

    const checks: SEOCheckItem[] = [
      {
        id: 'category',
        title: 'Primary Google Category',
        status: selectedLocation.categories?.primaryCategory?.displayName ? 'pass' : 'fail',
        evidence: selectedLocation.categories?.primaryCategory?.displayName
          ? `Primary Category: "${selectedLocation.categories.primaryCategory.displayName}"`
          : 'No primary category assigned',
        action: selectedLocation.categories?.primaryCategory?.displayName
          ? 'Category is verified.'
          : 'Set your primary business category to rank for search queries.',
        priority: 'critical',
        source: 'Google Business Information API',
      },
      {
        id: 'address',
        title: 'Storefront Physical Address',
        status: selectedLocation.storefrontAddress?.addressLines?.length ? 'pass' : 'warning',
        evidence: selectedLocation.storefrontAddress?.addressLines?.length
          ? selectedLocation.storefrontAddress.addressLines.join(', ')
          : 'Missing street address or service area only',
        action: selectedLocation.storefrontAddress?.addressLines?.length
          ? 'Physical location verified.'
          : 'Add physical street address to show on Google Maps local pack.',
        priority: 'critical',
        source: 'Google Business Information API',
      },
      {
        id: 'phone',
        title: 'Contact Phone Number',
        status: selectedLocation.phoneNumbers?.primaryPhone ? 'pass' : 'fail',
        evidence: selectedLocation.phoneNumbers?.primaryPhone || 'No phone number configured',
        action: selectedLocation.phoneNumbers?.primaryPhone
          ? 'Customer click-to-call active.'
          : 'Add a verified phone number for call leads.',
        priority: 'high',
        source: 'Google Business Information API',
      },
      {
        id: 'website',
        title: 'Website Link',
        status: selectedLocation.websiteUri ? 'pass' : 'fail',
        evidence: selectedLocation.websiteUri || 'No website URL configured in profile',
        action: selectedLocation.websiteUri
          ? `Linked to ${selectedLocation.websiteUri}`
          : 'Connect your business website to drive online traffic.',
        priority: 'high',
        source: 'Google Business Information API',
      },
      {
        id: 'hours',
        title: 'Regular Operating Hours',
        status: selectedLocation.regularHours?.periods?.length ? 'pass' : 'fail',
        evidence: selectedLocation.regularHours?.periods?.length
          ? `${selectedLocation.regularHours.periods.length} open periods configured`
          : 'Business hours not specified',
        action: selectedLocation.regularHours?.periods?.length
          ? 'Hours are up to date.'
          : 'Specify operating hours so customers know when you are open.',
        priority: 'medium',
        source: 'Google Business Information API',
      },
      {
        id: 'review_response',
        title: 'Review Response Engagement',
        status: responseRate >= 80 ? 'pass' : responseRate >= 50 ? 'warning' : 'fail',
        evidence: `${responseRate.toFixed(0)}% response rate (${answeredReviews}/${reviews.length} replied)`,
        action: responseRate >= 80
          ? 'Excellent response rate.'
          : 'Reply to unanswered reviews to improve Google local ranking trust.',
        priority: 'high',
        source: 'DigiLocal Reviews Engine',
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

  return (
    <SEOContext.Provider
      value={{
        audit,
        runAudit: evaluateLocalSEO,
        isLoadingAudit,
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
