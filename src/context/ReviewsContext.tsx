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
  isLoading: boolean;
  error: string | null;
  refreshReviews: () => Promise<void>;
  filter: 'all' | 'unanswered' | 'answered' | 'positive' | 'negative';
  setFilter: (filter: 'all' | 'unanswered' | 'answered' | 'positive' | 'negative') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredReviews: GoogleReview[];
  // AI Sentiment Analysis
  sentimentReport: SentimentReport | null;
  isAnalyzingSentiment: boolean;
  runSentimentAnalysis: () => Promise<void>;
  // AI reply actions
  generateAIReply: (review: GoogleReview, tone?: ReplyTone, language?: ReplyLanguage) => Promise<string>;
  publishReply: (review: GoogleReview, replyText: string) => Promise<boolean>;
  isPublishing: boolean;
  isGeneratingAI: boolean;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const { activeBusiness } = useBusiness();
  const { selectedLocation } = useGoogle();

  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered' | 'positive' | 'negative'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [sentimentReport, setSentimentReport] = useState<SentimentReport | null>(null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState<boolean>(false);

  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const cacheKey = selectedLocation?.googleName || user?.email || 'gmb_reviews';

  useEffect(() => {
    if (accessToken && selectedLocation) {
      loadReviews(accessToken, selectedLocation.googleName);
    } else {
      setReviews([]);
      setSentimentReport(null);
      setError(null);
    }
  }, [accessToken, selectedLocation?.googleName]);

  const computeSentimentStats = (revs: GoogleReview[]) => {
    const total = revs.length;
    if (total === 0) {
      setSentimentReport(null);
      return;
    }
    const pos = revs.filter((r) => r.numericRating >= 4).length;
    const neu = revs.filter((r) => r.numericRating === 3).length;
    const avg = Number((revs.reduce((s, r) => s + r.numericRating, 0) / total).toFixed(1));
    const posPct = Math.round((pos / total) * 100);
    const neuPct = Math.round((neu / total) * 100);
    const negPct = Math.max(0, 100 - posPct - neuPct);

    setSentimentReport({
      averageRating: avg,
      totalReviews: total,
      positivePercentage: posPct,
      neutralPercentage: neuPct,
      negativePercentage: negPct,
      summary: `Based on ${total} verified Google reviews, this listing has a ${avg}★ average rating (${posPct}% positive, ${neuPct}% average, ${negPct}% negative).`,
      strengths: pos > 0 ? ['Verified positive customer ratings'] : [],
      improvementAreas: negPct > 0 ? ['Address low-star reviews promptly'] : [],
      actionableAdvice:
        'Tap "Refresh Deep AI Sentiment Analysis" to run Gemini AI analysis on your customer comments.',
    });
  };

  const loadReviews = async (token: string, locationGoogleName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await GMBService.fetchReviews(token, locationGoogleName);
      setReviews(fetched);
      computeSentimentStats(fetched);
      await LocalCache.cacheReviews(cacheKey, fetched);
    } catch (err: any) {
      const apiMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Unable to load reviews from Google Business Profile API';
      setReviews([]);
      setSentimentReport(null);
      setError(apiMsg);
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
      setSentimentReport(report);
    } catch (e) {
      console.warn('Sentiment analysis error:', e);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  const refreshReviews = async () => {
    if (accessToken && selectedLocation) {
      await loadReviews(accessToken, selectedLocation.googleName);
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
