import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GMBService } from '../services/google/gmb';
import { GoogleLocation } from '../types';
import { useAuth } from './AuthContext';
import { LocalCache } from '../offline/storage';

const SELECTED_LOC_STORAGE_KEY = '@digilocal_selected_gmb_location_v2';

interface GoogleContextType {
  isConnected: boolean;
  accounts: Array<{ name: string; accountName: string }>;
  locations: GoogleLocation[];
  selectedLocation: GoogleLocation | null;
  isLoading: boolean;
  isSyncingLocation: boolean;
  error: string | null;
  refreshGoogleData: () => Promise<void>;
  selectLocation: (locationId: string) => Promise<void>;
}

const GoogleContext = createContext<GoogleContextType | undefined>(undefined);

export const GoogleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Array<{ name: string; accountName: string }>>([]);
  const [locations, setLocations] = useState<GoogleLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GoogleLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncingLocation, setIsSyncingLocation] = useState<boolean>(false);
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

  const enrichLocationLiveMetrics = async (
    token: string,
    loc: GoogleLocation
  ): Promise<GoogleLocation> => {
    const updated: GoogleLocation = { ...loc };

    // 1. Refresh full location metadata/details from v1 Business Information API
    try {
      const freshDetails = await GMBService.fetchLocationDetails(token, loc.googleName);
      Object.assign(updated, {
        title: freshDetails.title || updated.title,
        storeCode: freshDetails.storeCode ?? updated.storeCode,
        phoneNumbers: freshDetails.phoneNumbers ?? updated.phoneNumbers,
        websiteUri: freshDetails.websiteUri ?? updated.websiteUri,
        regularHours: freshDetails.regularHours ?? updated.regularHours,
        categories: freshDetails.categories ?? updated.categories,
        storefrontAddress: freshDetails.storefrontAddress ?? updated.storefrontAddress,
        latlng: freshDetails.latlng ?? updated.latlng,
        verificationStatus: freshDetails.verificationStatus ?? updated.verificationStatus,
      });
    } catch (detailErr: any) {
      console.warn('Location detail refresh note:', detailErr?.message);
    }

    // 2. Fetch live 30-day performance metrics from v1 Business Profile Performance API
    try {
      const perf = await GMBService.fetchPerformanceTimeSeries(token, loc.googleName);
      updated.insights = parsePerformanceMetrics(perf);
    } catch (perfErr: any) {
      console.warn('Location performance fetch note:', perfErr?.message);
      if (!updated.insights) {
        updated.insights = {
          searchViews: 0,
          mapsViews: 0,
          callClicks: 0,
          websiteClicks: 0,
          directionRequests: 0,
        };
      }
    }

    return updated;
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
      let lastLocationError: string | null = null;

      for (const acc of fetchedAccounts) {
        try {
          const locs = await GMBService.fetchLocations(token, acc.name);
          allLocations.push(...locs);
        } catch (locErr: any) {
          const msg =
            locErr?.response?.data?.error?.message ||
            locErr?.message ||
            `Failed to fetch locations for ${acc.accountName || acc.name}`;
          lastLocationError = msg;
          console.warn('Location fetch error for account', acc.name, msg);
        }
      }

      if (allLocations.length === 0) {
        setLocations([]);
        setSelectedLocation(null);
        setError(
          lastLocationError ||
            `Google Account (${user?.email}) connected (${fetchedAccounts.length} GMB account found), but no business locations/listings were returned.`
        );
        setIsLoading(false);
        return;
      }

      // Restore previously selected location if available, otherwise pick first location
      let savedLocId: string | null = null;
      try {
        savedLocId = await AsyncStorage.getItem(SELECTED_LOC_STORAGE_KEY);
      } catch {
        // ignore
      }

      const initialTarget =
        allLocations.find((l) => l.id === savedLocId || l.googleName === savedLocId) ||
        allLocations[0];

      // Immediately show locations & initial selection, then enrich live metrics for active location
      setLocations(allLocations);
      setSelectedLocation(initialTarget);

      setIsSyncingLocation(true);
      const enrichedTarget = await enrichLocationLiveMetrics(token, initialTarget);
      const updatedList = allLocations.map((l) =>
        l.id === enrichedTarget.id ? enrichedTarget : l
      );

      setLocations(updatedList);
      setSelectedLocation(enrichedTarget);
      setIsSyncingLocation(false);

      if (user?.email) {
        await LocalCache.cacheLocations(user.email, updatedList);
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
      setIsSyncingLocation(false);
    }
  };

  const refreshGoogleData = async () => {
    if (accessToken) {
      await loadGoogleData(accessToken);
    }
  };

  const selectLocation = async (locationId: string) => {
    const loc = locations.find(
      (l) =>
        l.id === locationId ||
        l.googleName === locationId ||
        l.googleName.endsWith(`/${locationId}`)
    );
    if (!loc) return;

    setSelectedLocation(loc);
    setError(null);
    try {
      await AsyncStorage.setItem(SELECTED_LOC_STORAGE_KEY, loc.id);
    } catch {
      // ignore
    }

    if (accessToken) {
      setIsSyncingLocation(true);
      try {
        const enriched = await enrichLocationLiveMetrics(accessToken, loc);
        setSelectedLocation(enriched);
        setLocations((prev) => prev.map((item) => (item.id === enriched.id ? enriched : item)));
      } finally {
        setIsSyncingLocation(false);
      }
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
        isSyncingLocation,
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
