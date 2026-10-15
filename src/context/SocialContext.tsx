import React, { createContext, useContext, useState, useEffect } from 'react';
import { SocialConnector } from '../types';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import { FirestoreDatabase } from '../services/database/firestoreService';

interface SocialContextType {
  connectors: SocialConnector[];
  isLoading: boolean;
  toggleAutoCrossPost: (id: string) => Promise<void>;
  connectAccount: (
    platform: 'gmb' | 'instagram' | 'facebook' | 'linkedin',
    accountName: string,
    handle: string,
    email?: string
  ) => Promise<void>;
  disconnectAccount: (id: string) => Promise<void>;
  connectedCount: number;
}

const defaultConnectors: SocialConnector[] = [
  {
    id: 'soc_gmb',
    platform: 'gmb',
    name: 'Google Business Profile',
    handle: 'Not Connected',
    connected: false,
    autoCrossPost: true,
  },
  {
    id: 'soc_insta',
    platform: 'instagram',
    name: 'Instagram Business Account',
    handle: 'Not Connected',
    connected: false,
    autoCrossPost: false,
  },
  {
    id: 'soc_fb',
    platform: 'facebook',
    name: 'Facebook Business Page',
    handle: 'Not Connected',
    connected: false,
    autoCrossPost: false,
  },
  {
    id: 'soc_linkedin',
    platform: 'linkedin',
    name: 'LinkedIn Company Page',
    handle: 'Not Connected',
    connected: false,
    autoCrossPost: false,
  },
];

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { activeBusiness } = useBusiness();
  const [connectors, setConnectors] = useState<SocialConnector[]>(defaultConnectors);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const businessId =
    activeBusiness?.id || (user?.uid ? `biz_${user.uid.slice(0, 8)}` : 'default_biz');

  useEffect(() => {
    if (businessId) {
      loadConnectorsFromCloud();
    }
  }, [businessId, user?.email]);

  const loadConnectorsFromCloud = async () => {
    setIsLoading(true);
    try {
      const cloudList = await FirestoreDatabase.fetchSocialConnectors(businessId);
      let merged = cloudList && cloudList.length > 0 ? cloudList : [...defaultConnectors];

      // Auto-bind Google Business Profile if user has active Google session
      if (user?.email) {
        merged = merged.map((c) => {
          if (c.platform === 'gmb') {
            return {
              ...c,
              connected: true,
              name: 'Google Business Profile',
              handle: user.displayName || user.email.split('@')[0],
              connectedEmail: user.email,
              autoCrossPost: true,
              lastSyncAt: Date.now(),
            };
          }
          return c;
        });
      }

      setConnectors(merged);
      await FirestoreDatabase.saveSocialConnectors(businessId, merged);
    } catch {
      setConnectors(defaultConnectors);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConnectors = async (updated: SocialConnector[]) => {
    setConnectors(updated);
    await FirestoreDatabase.saveSocialConnectors(businessId, updated);
  };

  const toggleAutoCrossPost = async (id: string) => {
    const updated = connectors.map((c) =>
      c.id === id ? { ...c, autoCrossPost: !c.autoCrossPost } : c
    );
    await saveConnectors(updated);
  };

  const connectAccount = async (
    platform: 'gmb' | 'instagram' | 'facebook' | 'linkedin',
    accountName: string,
    handle: string,
    email?: string
  ) => {
    const updated = connectors.map((c) =>
      c.platform === platform
        ? {
            ...c,
            connected: true,
            name: accountName.trim(),
            handle: handle.trim(),
            connectedEmail: email?.trim(),
            autoCrossPost: true,
            lastSyncAt: Date.now(),
          }
        : c
    );
    await saveConnectors(updated);
  };

  const disconnectAccount = async (id: string) => {
    const updated = connectors.map((c) =>
      c.id === id
        ? {
            ...c,
            connected: false,
            handle: 'Not Connected',
            connectedEmail: undefined,
            autoCrossPost: false,
          }
        : c
    );
    await saveConnectors(updated);
  };

  const connectedCount = connectors.filter((c) => c.connected).length;

  return (
    <SocialContext.Provider
      value={{
        connectors,
        isLoading,
        toggleAutoCrossPost,
        connectAccount,
        disconnectAccount,
        connectedCount,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) throw new Error('useSocial must be used within SocialProvider');
  return context;
};
