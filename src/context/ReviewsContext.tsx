import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { GMBService } from '../services/google/gmb';
import { AIService, ReplyLanguage, ReplyTone } from '../services/ai/gemini';
import { GoogleReview } from '../types';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import { useGoogle } from './GoogleContext';
import { LocalCache } from '../offline/storage';

export interface SentimentReport {
  averageRating: number;
  totalReviews: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  actionableAdvice: string;
}

interface ReviewsContextType {
  reviews: GoogleReview[];
  totalReviewCount: number;
  isLoading: boolean;
  error: string | null;
  refreshReviews: () => Promise<void>;
  filter: 'all' | 'unanswered' | 'answered' | 'positive' | 'negative';
  setFilter: (filter: 'all' | 'unanswered' | 'answered' | 'positive' | 'negative') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredReviews: GoogleReview[];
  sentimentReport: SentimentReport | null;
  isAnalyzingSentiment: boolean;
  runSentimentAnalysis: () => Promise<void>;
  generateAIReply: (
    review: GoogleReview,
    tone?: ReplyTone,
    language?: ReplyLanguage
  ) => Promise<string>;
  publishReply: (review: GoogleReview, replyText: string) => Promise<boolean>;
  isPublishing: boolean;
  isGeneratingAI: boolean;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken, refreshTokens } = useAuth();
  const { activeBusiness } = useBusiness();
  const { locations, selectedLocation, isAllLocationsSelected } = useGoogle();

  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [totalReviewCount, setTotalReviewCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered' | 'positive' | 'negative'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [sentimentReport, setSentimentReport] = useState<SentimentReport | null>(null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState<boolean>(false);

  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const cacheKey = isAllLocationsSelected
    ? `all_locations_${user?.email || 'gmb'}`
    : selectedLocation?.googleName || user?.email || 'gmb_reviews';

  useEffect(() => {
    if (!accessToken) {
      setReviews([]);
      setTotalReviewCount(0);
      setSentimentReport(null);
      setError(null);
      return;
    }

    if (isAllLocationsSelected && locations.length > 0) {
      loadAllLocationsReviews(accessToken);
    } else if (selectedLocation) {
      loadSingleLocationReviews(accessToken, selectedLocation.googleName);
    } else {
      setReviews([]);
      setTotalReviewCount(0);
      setSentimentReport(null);
      setError(null);
    }
  }, [accessToken, selectedLocation?.googleName, isAllLocationsSelected, locations.length]);

  const computeSentimentStats = (
    revs: GoogleReview[],
    officialTotal?: number,
    officialAvg?: number
  ) => {
    const loadedCount = revs.length;
    const finalTotal = Math.max(officialTotal || 0, loadedCount);
    setTotalReviewCount(finalTotal);

    if (loadedCount === 0 && finalTotal === 0) {
      setSentimentReport(null);
      return;
    }
    const pos = revs.filter((r) => r.numericRating >= 4).length;
    const neu = revs.filter((r) => r.numericRating === 3).length;
    const computedAvg =
      loadedCount > 0
        ? Number((revs.reduce((s, r) => s + r.numericRating, 0) / loadedCount).toFixed(1))
        : 0;
    const avg = officialAvg && officialAvg > 0 ? Number(officialAvg.toFixed(1)) : computedAvg;
    const posPct = loadedCount > 0 ? Math.round((pos / loadedCount) * 100) : 100;
    const neuPct = loadedCount > 0 ? Math.round((neu / loadedCount) * 100) : 0;
    const negPct = Math.max(0, 100 - posPct - neuPct);

    setSentimentReport({
      averageRating: avg,
      totalReviews: finalTotal,
      positivePercentage: posPct,
      neutralPercentage: neuPct,
      negativePercentage: negPct,
      summary: `Based on ${finalTotal} verified Google reviews, the average rating is ${avg}★ (${posPct}% positive, ${neuPct}% average, ${negPct}% negative).`,
      strengths: pos > 0 ? ['Verified positive customer ratings'] : [],
      improvementAreas: negPct > 0 ? ['Respond promptly to low-star reviews'] : [],
      actionableAdvice:
        'Reply to unanswered reviews to boost local search visibility and customer trust.',
    });
  };

  const loadSingleLocationReviews = async (token: string, locationGoogleName: string) => {
    setError(null);

    // Fast-path for Demo Mode
    if (token.startsWith('demo_')) {
      const demoReviews: GoogleReview[] = [
        {
          id: 'rev-01',
          googleName: 'accounts/demo-101/locations/demo/reviews/rev-01',
          locationGoogleName: locationGoogleName || 'accounts/demo-101/locations/digibirds-gurugram',
          reviewer: { displayName: 'Amit Singhal', profilePhotoUrl: '' },
          starRating: 'FIVE',
          numericRating: 5,
          comment: 'Outstanding festival marketing and local SEO results! Our business footfall has surged by 40% after using DigiLocal.',
          createTime: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
          updateTime: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
          replyStatus: 'unanswered',
        },
        {
          id: 'rev-02',
          googleName: 'accounts/demo-101/locations/demo/reviews/rev-02',
          locationGoogleName: locationGoogleName || 'accounts/demo-101/locations/digibirds-gurugram',
          reviewer: { displayName: 'Pooja Verma', profilePhotoUrl: '' },
          starRating: 'FIVE',
          numericRating: 5,
          comment: 'Best digital marketing and GMB optimization agency in Delhi NCR. Always responsive and proactive with review replies.',
          createTime: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
          updateTime: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
          replyStatus: 'published',
          reviewReply: {
            comment: 'Thank you Pooja! We take pride in delivering exceptional service for our clients.',
            updateTime: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
          },
        },
        {
          id: 'rev-03',
          googleName: 'accounts/demo-101/locations/demo/reviews/rev-03',
          locationGoogleName: locationGoogleName || 'accounts/demo-101/locations/digibirds-gurugram',
          reviewer: { displayName: 'Vikram Malhotra', profilePhotoUrl: '' },
          starRating: 'FOUR',
          numericRating: 4,
          comment: 'Very professional creative design and social media campaign automation. Happy with the overall ROI.',
          createTime: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
          updateTime: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
          replyStatus: 'unanswered',
        },
        {
          id: 'rev-04',
          googleName: 'accounts/demo-101/locations/demo/reviews/rev-04',
          locationGoogleName: locationGoogleName || 'accounts/demo-101/locations/digibirds-gurugram',
          reviewer: { displayName: 'Neha Gupta', profilePhotoUrl: '' },
          starRating: 'FIVE',
          numericRating: 5,
          comment: 'The automated festival poster graphics with photographic bokeh are top-tier commercial grade. Super impressed!',
          createTime: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
          updateTime: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
          replyStatus: 'unanswered',
        },
        {
          id: 'rev-05',
          googleName: 'accounts/demo-101/locations/demo/reviews/rev-05',
          locationGoogleName: locationGoogleName || 'accounts/demo-101/locations/digibirds-gurugram',
          reviewer: { displayName: 'Karan Mehra', profilePhotoUrl: '' },
          starRating: 'THREE',
          numericRating: 3,
          comment: 'Good overall marketing quality, but draft turnaround time could be slightly faster during peak festival rush.',
          createTime: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString(),
          updateTime: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString(),
          replyStatus: 'unanswered',
        },
      ];
      setReviews(demoReviews);
      computeSentimentStats(demoReviews, 28, 4.8);
      setIsLoading(false);
      return;
    }

    // 1. Hydrate from local cache first for instant UI response
    try {
      const [cached, cachedMeta] = await Promise.all([
        LocalCache.getCachedReviews(locationGoogleName),
        LocalCache.getCachedReviewsMeta(locationGoogleName),
      ]);
      if (cached && cached.length > 0) {
        setReviews(cached);
        computeSentimentStats(
          cached,
          cachedMeta?.totalReviewCount,
          cachedMeta?.averageRating
        );
      }
    } catch {
      // ignore
    }

    setIsLoading(true);
    try {
      let result: {
        reviews: GoogleReview[];
        totalReviewCount: number;
        averageRating: number;
      };

      try {
        result = await GMBService.fetchReviewsWithMeta(token, locationGoogleName);
      } catch (firstErr: any) {
        if (firstErr?.response?.status === 401) {
          const refreshedToken = await refreshTokens();
          if (refreshedToken) {
            result = await GMBService.fetchReviewsWithMeta(refreshedToken, locationGoogleName);
          } else {
            throw new Error(
              'Google session expired. Tap "Reconnect Google" to sync all your reviews.'
            );
          }
        } else {
          throw firstErr;
        }
      }

      setReviews(result.reviews);
      computeSentimentStats(result.reviews, result.totalReviewCount, result.averageRating);
      await LocalCache.cacheReviews(locationGoogleName, result.reviews, {
        totalReviewCount: result.totalReviewCount,
        averageRating: result.averageRating,
      });
    } catch (err: any) {
      const apiMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Unable to load reviews from Google Business Profile API';
      setError(apiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllLocationsReviews = async (token: string) => {
    setError(null);
    setIsLoading(true);
    try {
      let activeTok = token;
      let results = await Promise.allSettled(
        locations.map((loc) => GMBService.fetchReviewsWithMeta(activeTok, loc.googleName))
      );

      const allRejected401 =
        results.length > 0 &&
        results.every(
          (r) => r.status === 'rejected' && (r.reason as any)?.response?.status === 401
        );

      if (allRejected401) {
        const refreshedToken = await refreshTokens();
        if (refreshedToken) {
          activeTok = refreshedToken;
          results = await Promise.allSettled(
            locations.map((loc) => GMBService.fetchReviewsWithMeta(activeTok, loc.googleName))
          );
        } else {
          throw new Error(
            'Google session expired. Tap "Reconnect Google" to sync all your reviews.'
          );
        }
      }

      const combined: GoogleReview[] = [];
      let sumOfficialTotal = 0;
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          combined.push(...res.value.reviews);
          sumOfficialTotal += res.value.totalReviewCount;
        }
      }
      combined.sort(
        (a, b) => new Date(b.createTime || 0).getTime() - new Date(a.createTime || 0).getTime()
      );
      const finalTotal = Math.max(sumOfficialTotal, combined.length);
      setReviews(combined);
      computeSentimentStats(combined, finalTotal);
      await LocalCache.cacheReviews(cacheKey, combined, {
        totalReviewCount: finalTotal,
        averageRating:
          combined.length > 0
            ? Number(
                (combined.reduce((s, r) => s + r.numericRating, 0) / combined.length).toFixed(1)
              )
            : 0,
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to aggregate reviews across locations');
    } finally {
      setIsLoading(false);
    }
  };

  const runSentimentAnalysis = async () => {
    if (reviews.length === 0) return;
    setIsAnalyzingSentiment(true);
    try {
      const report = await AIService.analyzeReviewSentiments(
        reviews.map((r) => ({
          reviewerName: r.reviewer.displayName,
          starRating: r.numericRating,
          comment: r.comment,
        }))
      );
      setSentimentReport({
        ...report,
        totalReviews: Math.max(totalReviewCount, report.totalReviews),
      });
    } catch (e) {
      console.warn('Sentiment analysis error:', e);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  const refreshReviews = async () => {
    if (!accessToken) return;
    if (isAllLocationsSelected && locations.length > 0) {
      await loadAllLocationsReviews(accessToken);
    } else if (selectedLocation) {
      await loadSingleLocationReviews(accessToken, selectedLocation.googleName);
    }
  };

  const generateAIReply = async (
    review: GoogleReview,
    tone: ReplyTone = 'professional',
    language: ReplyLanguage = 'en'
  ): Promise<string> => {
    setIsGeneratingAI(true);
    try {
      const reply = await AIService.generateReviewReply({
        businessName: selectedLocation?.title || activeBusiness?.name || 'Our Business',
        reviewerName: review.reviewer.displayName,
        starRating: review.numericRating,
        reviewComment: review.comment,
        tone,
        language,
      });
      return reply;
    } catch (err: any) {
      Alert.alert('AI Generation Error', err.message || 'Failed to generate AI reply');
      return '';
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const publishReply = async (review: GoogleReview, replyText: string): Promise<boolean> => {
    if (!accessToken) {
      Alert.alert('Authentication Required', 'Please sign in with Google to publish replies.');
      return false;
    }

    if (accessToken.startsWith('demo_')) {
      const updated = reviews.map((r) =>
        r.googleName === review.googleName || r.id === review.id
          ? {
              ...r,
              reviewReply: {
                comment: replyText,
                updateTime: new Date().toISOString(),
              },
              replyStatus: 'published' as const,
            }
          : r
      );
      setReviews(updated);
      Alert.alert('Published (Demo Mode)', 'Your reply has been saved and displayed on the review.');
      return true;
    }

    setIsPublishing(true);
    try {
      const result = await GMBService.publishReply(accessToken, review.googleName, replyText);

      const updated = reviews.map((r) =>
        r.googleName === review.googleName
          ? {
              ...r,
              reviewReply: {
                comment: replyText,
                updateTime: result.updateTime || new Date().toISOString(),
              },
              replyStatus: 'published' as const,
            }
          : r
      );

      setReviews(updated);
      await LocalCache.cacheReviews(cacheKey, updated);
      Alert.alert('Published to Google', 'Your reply has been posted directly to your GMB listing.');
      return true;
    } catch (err: any) {
      const apiMsg =
        err.response?.data?.error?.message || err.message || 'Failed to publish reply to Google';
      Alert.alert('Google API Error', apiMsg);
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (r.reviewer.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.comment || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case 'unanswered':
        return !r.reviewReply?.comment;
      case 'answered':
        return Boolean(r.reviewReply?.comment);
      case 'positive':
        return r.numericRating >= 4;
      case 'negative':
        return r.numericRating <= 2;
      default:
        return true;
    }
  });

  return (
    <ReviewsContext.Provider
      value={{
        reviews,
        totalReviewCount,
        isLoading,
        error,
        refreshReviews,
        filter,
        setFilter,
        searchQuery,
        setSearchQuery,
        filteredReviews,
        sentimentReport,
        isAnalyzingSentiment,
        runSentimentAnalysis,
        generateAIReply,
        publishReply,
        isPublishing,
        isGeneratingAI,
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) throw new Error('useReviews must be used within ReviewsProvider');
  return context;
};
