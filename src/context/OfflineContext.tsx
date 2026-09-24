import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalCache, OfflineMutation } from '../offline/storage';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingMutations: OfflineMutation[];
  queueMutation: (type: OfflineMutation['type'], payload: any) => Promise<void>;
  processQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingMutations, setPendingMutations] = useState<OfflineMutation[]>([]);

  useEffect(() => {
    // Initial check and mutation queue load
    loadQueue();
  }, []);

  const loadQueue = async () => {
    const queue = await LocalCache.getMutationQueue();
    setPendingMutations(queue);
  };

  const queueMutation = async (type: OfflineMutation['type'], payload: any) => {
    const newMut = await LocalCache.enqueueMutation({ type, payload });
    setPendingMutations((prev) => [...prev, newMut]);
  };

  const processQueue = async () => {
    if (isSyncing || pendingMutations.length === 0) return;
    setIsSyncing(true);
    try {
      const queue = await LocalCache.getMutationQueue();
      for (const item of queue) {
        // Process each mutation when back online
        await LocalCache.removeMutation(item.id);
      }
      setPendingMutations([]);
    } catch (err) {
      console.warn('Sync queue error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingMutations,
        queueMutation,
        processQueue,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};
