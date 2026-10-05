import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ClientQuotaService,
  QuotaFeatureKey,
  QuotaUsageState,
  QuotaCheckResult,
  UPGRADE_PROMPT_MESSAGE,
  FREE_TRIAL_LIMITS,
} from '../services/quota/quotaService';
import { useAuth } from './AuthContext';
import { useAdmin } from './AdminContext';
import { UpgradeModal } from '../components/UpgradeModal';

interface QuotaContextType {
  usage: QuotaUsageState;
  isLoading: boolean;
  refreshUsage: () => Promise<void>;
  canExecuteAction: (feature: QuotaFeatureKey) => Promise<QuotaCheckResult>;
  runWithQuota: (
    feature: QuotaFeatureKey,
    featureTitle: string,
    action: () => Promise<void>
  ) => Promise<boolean>;
  recordUsage: (feature: QuotaFeatureKey) => Promise<void>;
  openUpgradeModal: (featureTitle?: string, message?: string) => void;
  closeUpgradeModal: () => void;
  upgradePlan: (plan: 'growth' | 'enterprise') => Promise<void>;
  resetQuotas: () => Promise<void>;
}

const defaultUsageState: QuotaUsageState = {
  post_generation: 0,
  review_reply: 0,
  seo_audit: 0,
  copilot_plan: 0,
  totalApiCalls: 0,
  plan: 'free_trial',
  lastUpdatedAt: Date.now(),
};

const QuotaContext = createContext<QuotaContextType | undefined>(undefined);

export const QuotaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  const [usage, setUsage] = useState<QuotaUsageState>(defaultUsageState);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Upgrade Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalFeatureTitle, setModalFeatureTitle] = useState<string>('AI Post Generation');
  const [modalMessage, setModalMessage] = useState<string>(UPGRADE_PROMPT_MESSAGE);

  useEffect(() => {
    refreshUsage();
  }, [user?.uid, isAdmin]);

  const refreshUsage = async () => {
    setIsLoading(true);
    try {
      const data = await ClientQuotaService.getUsage(user?.uid);
      setUsage(data);
    } catch (err) {
      console.log('[QuotaContext] Failed to load usage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const canExecuteAction = async (feature: QuotaFeatureKey): Promise<QuotaCheckResult> => {
    return ClientQuotaService.canPerformAction(feature, isAdmin, user?.uid);
  };

  const openUpgradeModal = (
    featureTitle: string = 'AI Generation & Fetch',
    message: string = UPGRADE_PROMPT_MESSAGE
  ) => {
    setModalFeatureTitle(featureTitle);
    setModalMessage(message);
    setModalVisible(true);
  };

  const closeUpgradeModal = () => {
    setModalVisible(false);
  };

  /**
   * Helper that checks quota before executing.
   * If free trial credit is exhausted, blocks execution and pops up UpgradeModal.
   * If allowed, executes the action and increments usage by 1.
   */
  const runWithQuota = async (
    feature: QuotaFeatureKey,
    featureTitle: string,
    action: () => Promise<void>
  ): Promise<boolean> => {
    const check = await canExecuteAction(feature);

    if (!check.allowed) {
      openUpgradeModal(featureTitle, check.message || UPGRADE_PROMPT_MESSAGE);
      return false;
    }

    try {
      await action();
      // Record usage only after action successfully runs
      await ClientQuotaService.recordUsage(feature, user?.uid);
      await refreshUsage();
      return true;
    } catch (err) {
      throw err;
    }
  };

  const recordUsage = async (feature: QuotaFeatureKey) => {
    await ClientQuotaService.recordUsage(feature, user?.uid);
    await refreshUsage();
  };

  const upgradePlan = async (plan: 'growth' | 'enterprise') => {
    await ClientQuotaService.upgradePlan(plan, user?.uid);
    await refreshUsage();
  };

  const resetQuotas = async () => {
    await ClientQuotaService.resetQuotas(user?.uid);
    await refreshUsage();
  };

  return (
    <QuotaContext.Provider
      value={{
        usage,
        isLoading,
        refreshUsage,
        canExecuteAction,
        runWithQuota,
        recordUsage,
        openUpgradeModal,
        closeUpgradeModal,
        upgradePlan,
        resetQuotas,
      }}
    >
      {children}
      <UpgradeModal
        visible={modalVisible}
        onClose={closeUpgradeModal}
        featureTitle={modalFeatureTitle}
        customMessage={modalMessage}
        onUnlocked={refreshUsage}
      />
    </QuotaContext.Provider>
  );
};

export const useQuota = () => {
  const context = useContext(QuotaContext);
  if (!context) {
    throw new Error('useQuota must be used within a QuotaProvider');
  }
  return context;
};
