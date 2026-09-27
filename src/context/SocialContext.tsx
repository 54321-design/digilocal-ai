import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SocialConnector } from '../types';

const SOCIAL_STORAGE_KEY = '@digilocal_social_accounts_v2';

interface SocialContextType {
  connectors: SocialConnector[];
  isLoading: boolean;
  toggleAutoCrossPost: (id: string) => Promise<void>;
  connectAccount: (
    platform: 'instagram' | 'facebook' | 'linkedin',
    accountName: string,
    handle: string,
    email?: string
  ) => Promise<void>;
  disconnectAccount: (id: string) => Promise<void>;
  connectedCount: number;
}

const defaultConnectors: SocialConnector[] = [
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
  const [connectors, setConnectors] = useState<SocialConnector[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      const stored = await AsyncStorage.getItem(SOCIAL_STORAGE_KEY);
      if (stored) {
        setConnectors(JSON.parse(stored));
      } else {
        setConnectors(defaultConnectors);
        await AsyncStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(defaultConnectors));
      }
    } catch {
      setConnectors(defaultConnectors);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConnectors = async (updated: SocialConnector[]) => {
    setConnectors(updated);
    await AsyncStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleAutoCrossPost = async (id: string) => {
    const updated = connectors.map((c) =>
      c.id === id ? { ...c, autoCrossPost: !c.autoCrossPost } : c
    );
    await saveConnectors(updated);
  };

  const connectAccount = async (
    platform: 'instagram' | 'facebook' | 'linkedin',
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
