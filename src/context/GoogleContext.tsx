import React, { createContext, useContext, useState, useEffect } from 'react';
import { GMBService } from '../services/google/gmb';
import { GoogleLocation } from '../types';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import { LocalCache } from '../offline/storage';

interface GoogleContextType {
  isConnected: boolean;
  accounts: Array<{ name: string; accountName: string }>;
  locations: GoogleLocation[];
  selectedLocation: GoogleLocation | null;
  isLoading: boolean;
  error: string | null;
  refreshGoogleData: () => Promise<void>;
  selectLocation: (locationId: string) => void;
}

const GoogleContext = createContext<GoogleContextType | undefined>(undefined);

export const GoogleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken } = useAuth();
  const { activeBusiness } = useBusiness();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Array<{ name: string; accountName: string }>>([]);
  const [locations, setLocations] = useState<GoogleLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GoogleLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken && activeBusiness) {
      setIsConnected(true);
      loadGoogleData(accessToken);
    } else {
      setIsConnected(false);
      // Try loading cached locations if offline
      if (activeBusiness) {
        LocalCache.getCachedLocations(activeBusiness.id).then((cached) => {
          if (cached && cached.length > 0) {
            setLocations(cached);
            setSelectedLocation(cached[0]);
          }
        });
      }
    }
  }, [accessToken, activeBusiness?.id]);

  const loadGoogleData = async (token: string) => {
    if (!activeBusiness) return;
    setIsLoading(true);
    setError(null);
    try {
      if (token === 'demo_preview_token') {
        const previewLoc: GoogleLocation = {
          id: 'accounts/101/locations/201',
          googleName: 'accounts/101/locations/201',
          title: 'DigiLocal Super Store (Demo)',
          categories: { primaryCategory: { displayName: 'Grocery & Department Store' } },
          storefrontAddress: {
            addressLines: ['Plot 42, Sector 18, Commercial Belt'],
            locality: 'Noida',
            administrativeArea: 'UP',
            postalCode: '201301',
          },
          phoneNumbers: { primaryPhone: '+91 98765 43210' },
          websiteUri: 'https://digilocal.ai',
          regularHours: {
            periods: [
              { openDay: 'MONDAY', openTime: '09:00', closeDay: 'MONDAY', closeTime: '21:00' },
              { openDay: 'TUESDAY', openTime: '09:00', closeDay: 'TUESDAY', closeTime: '21:00' },
              { openDay: 'WEDNESDAY', openTime: '09:00', closeDay: 'WEDNESDAY', closeTime: '21:00' },
            ],
          },
        };
        setLocations([previewLoc]);
        setSelectedLocation(previewLoc);
        setIsLoading(false);
        return;
      }

      const fetchedAccounts = await GMBService.fetchAccounts(token);
      setAccounts(fetchedAccounts);

      if (fetchedAccounts.length > 0) {
        const firstAccount = fetchedAccounts[0].name;
        const fetchedLocations = await GMBService.fetchLocations(token, firstAccount);
        setLocations(fetchedLocations);
        await LocalCache.cacheLocations(activeBusiness.id, fetchedLocations);

        if (fetchedLocations.length > 0) {
          setSelectedLocation(fetchedLocations[0]);
        } else {
          setSelectedLocation(null);
        }
      } else {
        setLocations([]);
        setSelectedLocation(null);
        setError('No Google Business Profile account found for this Google Account.');
      }
    } catch (err: any) {
      console.warn('loadGoogleData error:', err);
      // Fallback to cache
      const cached = await LocalCache.getCachedLocations(activeBusiness.id);
      if (cached && cached.length > 0) {
        setLocations(cached);
        setSelectedLocation(cached[0]);
      } else {
        setError(err.response?.data?.error?.message || err.message || 'Failed to fetch Google Business data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshGoogleData = async () => {
    if (accessToken) {
      await loadGoogleData(accessToken);
    }
  };

  const selectLocation = (locationId: string) => {
    const loc = locations.find((l) => l.id === locationId || l.googleName === locationId);
    if (loc) {
      setSelectedLocation(loc);
    }
  };

  return (
    <GoogleContext.Provider
      value={{
        isConnected,
        accounts,
        locations,
        selectedLocation,
        isLoading,
        error,
        refreshGoogleData,
        selectLocation,
      }}
    >
      {children}
    </GoogleContext.Provider>
  );
};

export const useGoogle = () => {
  const context = useContext(GoogleContext);
  if (!context) throw new Error('useGoogle must be used within GoogleProvider');
  return context;
};
