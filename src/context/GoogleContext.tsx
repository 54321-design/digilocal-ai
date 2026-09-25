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
        const previewLocations: GoogleLocation[] = [
          {
            id: 'accounts/101/locations/201',
            googleName: 'accounts/101/locations/201',
            title: 'DigiLocal Super Store (Sector 18, Noida)',
            storeCode: 'NOIDA-01',
            categories: { primaryCategory: { displayName: 'Department & Grocery Store' } },
            verificationStatus: 'VERIFIED',
            storefrontAddress: {
              addressLines: ['Plot 42, Sector 18, Commercial Belt'],
              locality: 'Noida',
              administrativeArea: 'UP',
              postalCode: '201301',
            },
            phoneNumbers: { primaryPhone: '+91 98765 43210' },
            websiteUri: 'https://digilocal.ai/noida',
            regularHours: {
              periods: [
                { openDay: 'MONDAY', openTime: '09:00', closeDay: 'MONDAY', closeTime: '22:00' },
                { openDay: 'TUESDAY', openTime: '09:00', closeDay: 'TUESDAY', closeTime: '22:00' },
                { openDay: 'WEDNESDAY', openTime: '09:00', closeDay: 'WEDNESDAY', closeTime: '22:00' },
                { openDay: 'THURSDAY', openTime: '09:00', closeDay: 'THURSDAY', closeTime: '22:00' },
                { openDay: 'FRIDAY', openTime: '09:00', closeDay: 'FRIDAY', closeTime: '22:00' },
                { openDay: 'SATURDAY', openTime: '09:00', closeDay: 'SATURDAY', closeTime: '23:00' },
                { openDay: 'SUNDAY', openTime: '09:00', closeDay: 'SUNDAY', closeTime: '23:00' },
              ],
            },
            insights: {
              searchViews: 18240,
              mapsViews: 24510,
              callClicks: 940,
              websiteClicks: 1420,
              directionRequests: 620,
            },
          },
          {
            id: 'accounts/101/locations/202',
            googleName: 'accounts/101/locations/202',
            title: 'DigiLocal Flagship Store (Connaught Place, Delhi)',
            storeCode: 'DEL-CP-01',
            categories: { primaryCategory: { displayName: 'Retail Shopping Center' } },
            verificationStatus: 'VERIFIED',
            storefrontAddress: {
              addressLines: ['Block B, Inner Circle, Connaught Place'],
              locality: 'New Delhi',
              administrativeArea: 'Delhi',
              postalCode: '110001',
            },
            phoneNumbers: { primaryPhone: '+91 98111 22334' },
            websiteUri: 'https://digilocal.ai/cp-delhi',
            regularHours: {
              periods: [
                { openDay: 'MONDAY', openTime: '10:00', closeDay: 'MONDAY', closeTime: '22:00' },
                { openDay: 'TUESDAY', openTime: '10:00', closeDay: 'TUESDAY', closeTime: '22:00' },
                { openDay: 'WEDNESDAY', openTime: '10:00', closeDay: 'WEDNESDAY', closeTime: '22:00' },
                { openDay: 'THURSDAY', openTime: '10:00', closeDay: 'THURSDAY', closeTime: '22:00' },
                { openDay: 'FRIDAY', openTime: '10:00', closeDay: 'FRIDAY', closeTime: '22:00' },
                { openDay: 'SATURDAY', openTime: '10:00', closeDay: 'SATURDAY', closeTime: '23:00' },
                { openDay: 'SUNDAY', openTime: '10:00', closeDay: 'SUNDAY', closeTime: '23:00' },
              ],
            },
            insights: {
              searchViews: 29100,
              mapsViews: 38200,
              callClicks: 1820,
              websiteClicks: 2940,
              directionRequests: 1150,
            },
          },
          {
            id: 'accounts/101/locations/203',
            googleName: 'accounts/101/locations/203',
            title: 'DigiLocal Hub (Cyber City, Gurugram)',
            storeCode: 'GGN-CYBER-01',
            categories: { primaryCategory: { displayName: 'Convenience Store & Cafe' } },
            verificationStatus: 'ACTION_REQUIRED',
            storefrontAddress: {
              addressLines: ['DLF Phase 2, Cyber Hub, Building 8B'],
              locality: 'Gurugram',
              administrativeArea: 'Haryana',
              postalCode: '122002',
            },
            phoneNumbers: { primaryPhone: '+91 99990 88776' },
            websiteUri: 'https://digilocal.ai/cybercity',
            regularHours: {
              periods: [
                { openDay: 'MONDAY', openTime: '08:00', closeDay: 'MONDAY', closeTime: '23:00' },
                { openDay: 'TUESDAY', openTime: '08:00', closeDay: 'TUESDAY', closeTime: '23:00' },
                { openDay: 'WEDNESDAY', openTime: '08:00', closeDay: 'WEDNESDAY', closeTime: '23:00' },
              ],
            },
            insights: {
              searchViews: 8420,
              mapsViews: 12100,
              callClicks: 310,
              websiteClicks: 580,
              directionRequests: 210,
            },
          },
        ];
        setLocations(previewLocations);
        setSelectedLocation(previewLocations[0]);
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
