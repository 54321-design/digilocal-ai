import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { GMBService } from '../services/google/gmb';
import { AIService, ReplyLanguage, ReplyTone } from '../services/ai/gemini';
import { GoogleReview } from '../types';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import { useGoogle } from './GoogleContext';
import { LocalCache } from '../offline/storage';

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
  // AI reply actions
  generateAIReply: (review: GoogleReview, tone?: ReplyTone, language?: ReplyLanguage) => Promise<string>;
  publishReply: (review: GoogleReview, replyText: string) => Promise<boolean>;
  isPublishing: boolean;
  isGeneratingAI: boolean;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken } = useAuth();
  const { activeBusiness } = useBusiness();
  const { selectedLocation } = useGoogle();

  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered' | 'positive' | 'negative'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  useEffect(() => {
    if (accessToken && selectedLocation && activeBusiness) {
      loadReviews(accessToken, selectedLocation.googleName);
    } else if (activeBusiness) {
      LocalCache.getCachedReviews(activeBusiness.id).then((cached) => {
        if (cached && cached.length > 0) {
          setReviews(cached);
        }
      });
    }
  }, [accessToken, selectedLocation?.googleName, activeBusiness?.id]);

  const loadReviews = async (token: string, locationGoogleName: string) => {
    if (!activeBusiness) return;
    setIsLoading(true);
    setError(null);
    try {
      if (token === 'demo_preview_token') {
        const previewReviews: GoogleReview[] = [
          {
            id: 'rev_1',
            googleName: 'accounts/101/locations/201/reviews/rev_1',
            locationGoogleName: 'accounts/101/locations/201',
            reviewer: { displayName: 'Aman Verma' },
            starRating: 'FIVE',
            numericRating: 5,
            comment: 'Bohot acchi service hai aur products fresh hain. Delivery bhi timely thi!',
            createTime: new Date(Date.now() - 3600000 * 24).toISOString(),
            replyStatus: 'unanswered',
            sentiment: 'positive',
          },
          {
            id: 'rev_2',
            googleName: 'accounts/101/locations/201/reviews/rev_2',
            locationGoogleName: 'accounts/101/locations/201',
            reviewer: { displayName: 'Pooja Sharma' },
            starRating: 'TWO',
            numericRating: 2,
            comment: 'Waited 20 minutes in billing line during evening peak hours. Please add more counters.',
            createTime: new Date(Date.now() - 3600000 * 48).toISOString(),
            replyStatus: 'unanswered',
            sentiment: 'negative',
          },
          {
            id: 'rev_3',
            googleName: 'accounts/101/locations/201/reviews/rev_3',
            locationGoogleName: 'accounts/101/locations/201',
            reviewer: { displayName: 'Vikram Mehta' },
            starRating: 'FOUR',
            numericRating: 4,
            comment: 'Great store selection and friendly staff.',
            createTime: new Date(Date.now() - 3600000 * 72).toISOString(),
            reviewReply: {
              comment: 'Thank you for your visit Vikram! We look forward to seeing you again.',
              updateTime: new Date().toISOString(),
            },
            replyStatus: 'published',
            sentiment: 'positive',
          },
        ];
        setReviews(previewReviews);
        setIsLoading(false);
        return;
      }

      const fetched = await GMBService.fetchReviews(token, locationGoogleName);
      setReviews(fetched);
      await LocalCache.cacheReviews(activeBusiness.id, fetched);
    } catch (err: any) {
      console.warn('loadReviews error:', err);
      // Fallback to cache
      const cached = await LocalCache.getCachedReviews(activeBusiness.id);
      if (cached && cached.length > 0) {
        setReviews(cached);
      } else {
        setError(err.response?.data?.error?.message || err.message || 'Unable to load reviews from Google');
      }
    } finally {
      setIsLoading(false);
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
        businessName: activeBusiness?.name || selectedLocation?.title || 'Our Business',
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
      Alert.alert('Authentication Required', 'Please connect your Google Account to publish replies.');
      return false;
    }
    setIsPublishing(true);
    try {
      let result = { comment: replyText, updateTime: new Date().toISOString() };
      if (accessToken !== 'demo_preview_token') {
        result = await GMBService.publishReply(accessToken, review.googleName, replyText);
      }
      // Update local state ONLY AFTER Google API confirms publication
      setReviews((prev) =>
        prev.map((r) =>
          r.googleName === review.googleName
            ? {
                ...r,
                reviewReply: {
                  comment: replyText,
                  updateTime: result.updateTime || new Date().toISOString(),
                },
                replyStatus: 'published',
              }
            : r
        )
      );

      if (activeBusiness) {
        // Update local cache
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
        await LocalCache.cacheReviews(activeBusiness.id, updated);
      }

      Alert.alert('Published', 'Your reply has been published to Google.');
      return true;
    } catch (err: any) {
      Alert.alert(
        'Publishing Failed',
        err.response?.data?.error?.message || err.message || 'Google API rejected the reply.'
      );
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    // Status filter
    if (filter === 'unanswered' && r.reviewReply?.comment) return false;
    if (filter === 'answered' && !r.reviewReply?.comment) return false;
    if (filter === 'positive' && r.numericRating < 4) return false;
    if (filter === 'negative' && r.numericRating > 2) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComment = r.comment?.toLowerCase().includes(q);
      const matchName = r.reviewer.displayName?.toLowerCase().includes(q);
      return matchComment || matchName;
    }

    return true;
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
