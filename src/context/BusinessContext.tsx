import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase/config';
import { collection, doc, getDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { Business, BusinessMember, UserRole } from '../types';
import { useAuth } from './AuthContext';
import { LocalCache } from '../offline/storage';

interface BusinessContextType {
  activeBusiness: Business | null;
  businesses: Business[];
  currentRole: UserRole;
  isLoading: boolean;
  selectBusiness: (businessId: string) => Promise<void>;
  createBusiness: (name: string) => Promise<Business>;
  members: BusinessMember[];
  loadMembers: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user?.uid) {
      loadUserBusinesses();
    } else {
      setActiveBusiness(null);
      setBusinesses([]);
      setIsLoading(false);
    }
  }, [user?.uid]);

  const loadUserBusinesses = async () => {
    setIsLoading(true);
    try {
      if (!user) return;
      // Fetch businesses where user is owner or member
      const bizList: Business[] = [];

      try {
        const q = query(collection(db, 'businesses'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        snap.forEach((d) => {
          bizList.push({ id: d.id, ...d.data() } as Business);
        });
      } catch (fbErr) {
        console.warn('Firestore loadBusinesses note:', fbErr);
      }

      // If no business found in Firestore, load or fallback to local default
      if (bizList.length === 0) {
        const cachedId = await LocalCache.getActiveBusinessId();
        if (cachedId) {
          const cached = await LocalCache.getCachedBusiness(cachedId);
          if (cached) bizList.push(cached);
        }
      }

      // If still empty, create default personal business
      if (bizList.length === 0) {
        const defaultBiz: Business = {
          id: `biz_${user.uid.slice(0, 8)}`,
          name: `${user.displayName}'s Business`,
          ownerId: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          plan: 'growth',
        };
        try {
          await setDoc(doc(db, 'businesses', defaultBiz.id), defaultBiz);
          await setDoc(doc(db, `businesses/${defaultBiz.id}/members`, user.uid), {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'owner',
            joinedAt: Date.now(),
          });
        } catch (e) {
          console.warn('Firestore save defaultBiz note:', e);
        }
        await LocalCache.cacheBusiness(defaultBiz);
        bizList.push(defaultBiz);
      }

      setBusinesses(bizList);
      const active = bizList[0];
      setActiveBusiness(active);
      await LocalCache.setActiveBusinessId(active.id);
      await LocalCache.cacheBusiness(active);
    } catch (err) {
      console.warn('loadUserBusinesses error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectBusiness = async (businessId: string) => {
    const selected = businesses.find((b) => b.id === businessId);
    if (selected) {
      setActiveBusiness(selected);
      await LocalCache.setActiveBusinessId(selected.id);
      loadMembers();
    }
  };

  const createBusiness = async (name: string): Promise<Business> => {
    if (!user) throw new Error('User not authenticated');
    const newBiz: Business = {
      id: `biz_${Date.now()}`,
      name,
      ownerId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      plan: 'growth',
    };

    try {
      await setDoc(doc(db, 'businesses', newBiz.id), newBiz);
      await setDoc(doc(db, `businesses/${newBiz.id}/members`, user.uid), {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'owner',
        joinedAt: Date.now(),
      });
    } catch (e) {
      console.warn('Create business Firestore note:', e);
    }

    await LocalCache.cacheBusiness(newBiz);
    setBusinesses((prev) => [...prev, newBiz]);
    setActiveBusiness(newBiz);
    return newBiz;
  };

  const loadMembers = async () => {
    if (!activeBusiness) return;
    try {
      const snap = await getDocs(collection(db, `businesses/${activeBusiness.id}/members`));
      const list: BusinessMember[] = [];
      snap.forEach((d) => list.push(d.data() as BusinessMember));
      setMembers(list);
    } catch (e) {
      // Fallback
      if (user) {
        setMembers([
          {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'owner',
            joinedAt: Date.now(),
          },
        ]);
      }
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        activeBusiness,
        businesses,
        currentRole,
        isLoading,
        selectBusiness,
        createBusiness,
        members,
        loadMembers,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within BusinessProvider');
  return context;
};
