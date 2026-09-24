import React, { createContext, useContext, useState, useEffect } from 'react';
import { AIService } from '../services/ai/gemini';
import { AICopilotPlan } from '../types';
import { useGoogle } from './GoogleContext';
import { useReviews } from './ReviewsContext';
import { useBusiness } from './BusinessContext';
import { LocalCache } from '../offline/storage';

interface CopilotContextType {
  plan: AICopilotPlan | null;
  isLoading: boolean;
  error: string | null;
  generatePlan: () => Promise<void>;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export const CopilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedLocation } = useGoogle();
  const { reviews } = useReviews();
  const { activeBusiness } = useBusiness();

  const [plan, setPlan] = useState<AICopilotPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeBusiness) {
      LocalCache.getCachedCopilotPlan(activeBusiness.id).then((cached) => {
        if (cached) setPlan(cached);
      });
    }
  }, [activeBusiness?.id]);

  const generatePlan = async () => {
    if (!selectedLocation) {
      setError('Please select a Google Business location first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const unanswered = reviews.filter((r) => !r.reviewReply?.comment).length;
    let avg = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.numericRating, 0);
      avg = sum / reviews.length;
    }

    try {
      const result = await AIService.generateGrowthCopilotRecommendations({
        businessName: activeBusiness?.name || selectedLocation.title,
        locationTitle: selectedLocation.title,
        categories: selectedLocation.categories?.primaryCategory?.displayName
          ? [selectedLocation.categories.primaryCategory.displayName]
          : [],
        hasAddress: Boolean(selectedLocation.storefrontAddress?.addressLines?.length),
        hasPhone: Boolean(selectedLocation.phoneNumbers?.primaryPhone),
        hasWebsite: Boolean(selectedLocation.websiteUri),
        hasHours: Boolean(selectedLocation.regularHours?.periods?.length),
        reviewCount: reviews.length,
        avgRating: avg,
        unansweredCount: unanswered,
      });

      const newPlan: AICopilotPlan = {
        ...result,
        generatedAt: Date.now(),
      };

      setPlan(newPlan);
      if (activeBusiness) {
        await LocalCache.cacheCopilotPlan(activeBusiness.id, newPlan);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate Copilot recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CopilotContext.Provider
      value={{
        plan,
        isLoading,
        error,
        generatePlan,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
};

export const useCopilot = () => {
  const context = useContext(CopilotContext);
  if (!context) throw new Error('useCopilot must be used within CopilotProvider');
  return context;
};
