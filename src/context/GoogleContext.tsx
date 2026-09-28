import React, { createContext, useContext, useState, useEffect } from 'react';
import { GMBService } from '../services/google/gmb';
import { GoogleLocation } from '../types';
import { useAuth } from './AuthContext';
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
  const { user, accessToken } = useAuth();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Array<{ name: string; accountName: string }>>([]);
  const [locations, setLocations] = useState<GoogleLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GoogleLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken && user) {
      setIsConnected(true);
      loadGoogleData(accessToken);
    } else {
      setIsConnected(false);
      setAccounts([]);
      setLocations([]);
      setSelectedLocation(null);
      setError(null);
    }
  }, [accessToken, user?.email]);

  const parsePerformanceMetrics = (perfData: any) => {
    const seriesList = perfData?.multiDailyMetricTimeSeries || [];
    let searchViews = 0;
    let mapsViews = 0;
    let callClicks = 0;
    let websiteClicks = 0;
    let directionRequests = 0;

    for (const group of seriesList) {
      const dailySeries = group?.dailyMetricTimeSeries || [];
      for (const item of dailySeries) {
        const metric = item?.dailyMetric;
        const datedValues = item?.timeSeries?.datedValues || [];
        const sum = datedValues.reduce(
          (acc: number, dv: any) => acc + (Number(dv?.value) || 0),
          0
        );
        if (
          metric === 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH' ||
          metric === 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH'
        ) {
          searchViews += sum;
        } else if (
          metric === 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS' ||
          metric === 'BUSINESS_IMPRESSIONS_MOBILE_MAPS'
        ) {
          mapsViews += sum;
        } else if (metric === 'CALL_CLICKS') {
          callClicks += sum;
        } else if (metric === 'WEBSITE_CLICKS') {
          websiteClicks += sum;
        } else if (metric === 'BUSINESS_DIRECTION_REQUESTS') {
          directionRequests += sum;
        }
      }
    }

    return {
      searchViews,
      mapsViews,
      callClicks,
      websiteClicks,
      directionRequests,
    };
  };

  const loadGoogleData = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedAccounts = await GMBService.fetchAccounts(token);
      setAccounts(fetchedAccounts);

      if (fetchedAccounts.length === 0) {
        setLocations([]);
        setSelectedLocation(null);
        setError(
          `No Google Business Profile accounts found under ${user?.email || 'this Google account'}.`
        );
        setIsLoading(false);
        return;
      }

      const allLocations: GoogleLocation[] = [];
      for (const acc of fetchedAccounts) {
        try {
          const locs = await GMBService.fetchLocations(token, acc.name);
          for (const loc of locs) {
            try {
              const perf = await GMBService.fetchPerformanceTimeSeries(token, loc.googleName);
              loc.insights = parsePerformanceMetrics(perf);
            } catch {
              loc.insights = {
                searchViews: 0,
                mapsViews: 0,
                callClicks: 0,
                websiteClicks: 0,
                directionRequests: 0,
              };
            }
          }
          allLocations.push(...locs);
        } catch (locErr: any) {
          console.warn('Location fetch error for account', acc.name, locErr?.message);
        }
      }

      setLocations(allLocations);
      if (allLocations.length > 0) {
        setSelectedLocation(allLocations[0]);
        if (user?.email) {
          await LocalCache.cacheLocations(user.email, allLocations);
        }
      } else {
        setSelectedLocation(null);
        setError(
          `Google Account (${user?.email}) connected (${fetchedAccounts.length} GMB account found), but no business locations/listings are registered under it yet.`
        );
      }
    } catch (err: any) {
      const apiMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to fetch Google Business Profile data';
      setLocations([]);
      setSelectedLocation(null);
      setError(apiMsg);
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
