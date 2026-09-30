import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GMBService } from '../services/google/gmb';
import { GoogleLocation } from '../types';
import { useAuth } from './AuthContext';
import { LocalCache } from '../offline/storage';

const SELECTED_LOC_STORAGE_KEY = '@digilocal_selected_gmb_location_v2';

export interface PerformanceInsights {
  searchViews: number;
  mapsViews: number;
  callClicks: number;
  websiteClicks: number;
  directionRequests: number;
}

interface GoogleContextType {
  isConnected: boolean;
  accounts: Array<{ name: string; accountName: string }>;
  locations: GoogleLocation[];
  selectedLocation: GoogleLocation | null;
  isAllLocationsSelected: boolean;
  aggregatedInsights: PerformanceInsights;
  activeInsights: PerformanceInsights;
  isLoading: boolean;
  isSyncingLocation: boolean;
  error: string | null;
  refreshGoogleData: () => Promise<void>;
  selectLocation: (locationId: string) => Promise<void>;
}

const EMPTY_INSIGHTS: PerformanceInsights = {
  searchViews: 0,
  mapsViews: 0,
  callClicks: 0,
  websiteClicks: 0,
  directionRequests: 0,
};

const GoogleContext = createContext<GoogleContextType | undefined>(undefined);

export const GoogleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Array<{ name: string; accountName: string }>>([]);
  const [locations, setLocations] = useState<GoogleLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GoogleLocation | null>(null);
  const [isAllLocationsSelected, setIsAllLocationsSelected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncingLocation, setIsSyncingLocation] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken && user) {
      setIsConnected(true);
      hydrateAndLoadGoogleData(accessToken, user.email);
    } else {
      setIsConnected(false);
      setAccounts([]);
      setLocations([]);
      setSelectedLocation(null);
      setIsAllLocationsSelected(false);
      setError(null);
    }
  }, [accessToken, user?.email]);

  const parsePerformanceMetrics = (perfData: any): PerformanceInsights => {
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

    const [detailsRes, perfRes] = await Promise.allSettled([
      GMBService.fetchLocationDetails(token, loc.googleName),
      GMBService.fetchPerformanceTimeSeries(token, loc.googleName),
    ]);

    if (detailsRes.status === 'fulfilled') {
      const freshDetails = detailsRes.value;
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
    }

    if (perfRes.status === 'fulfilled') {
      updated.insights = parsePerformanceMetrics(perfRes.value);
    } else if (!updated.insights) {
      updated.insights = { ...EMPTY_INSIGHTS };
    }

    return updated;
  };

  const hydrateAndLoadGoogleData = async (token: string, email?: string) => {
    // 1. Fast local cache hydration so UI renders immediately without waiting
    if (email) {
      try {
        const cached = await LocalCache.getCachedLocations(email);
        if (cached && cached.length > 0) {
          setLocations(cached);
          const savedLocId = await AsyncStorage.getItem(SELECTED_LOC_STORAGE_KEY);
          if (savedLocId === 'ALL' && cached.length > 1) {
            setIsAllLocationsSelected(true);
            setSelectedLocation(cached[0]);
          } else {
            const target =
              cached.find((l) => l.id === savedLocId || l.googleName === savedLocId) || cached[0];
            setSelectedLocation(target);
          }
        }
      } catch {
        // ignore cache read error
      }
    }

    // 2. Background sync with live Google APIs
    await loadGoogleData(token);
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
        }
      }

      if (allLocations.length === 0) {
        setLocations([]);
        setSelectedLocation(null);
        setError(
          lastLocationError ||
            `Google Account (${user?.email}) connected, but no business locations were returned.`
        );
        setIsLoading(false);
        return;
      }

      let savedLocId: string | null = null;
      try {
        savedLocId = await AsyncStorage.getItem(SELECTED_LOC_STORAGE_KEY);
      } catch {
        // ignore
      }

      const isAll = savedLocId === 'ALL' && allLocations.length > 1;
      setIsAllLocationsSelected(isAll);

      const initialTarget =
        allLocations.find((l) => l.id === savedLocId || l.googleName === savedLocId) ||
        allLocations[0];

      setLocations(allLocations);
      setSelectedLocation(initialTarget);
      setIsLoading(false);

      // Enrich active location (or all locations if All Locations is selected) in background
      setIsSyncingLocation(true);
      if (isAll) {
        const enrichedAll = await Promise.all(
          allLocations.map((loc) => enrichLocationLiveMetrics(token, loc))
        );
        setLocations(enrichedAll);
        setSelectedLocation(enrichedAll[0]);
        if (user?.email) {
          await LocalCache.cacheLocations(user.email, enrichedAll);
        }
      } else {
        const enrichedTarget = await enrichLocationLiveMetrics(token, initialTarget);
        const updatedList = allLocations.map((l) =>
          l.id === enrichedTarget.id ? enrichedTarget : l
        );
        setLocations(updatedList);
        setSelectedLocation(enrichedTarget);
        if (user?.email) {
          await LocalCache.cacheLocations(user.email, updatedList);
        }
      }
    } catch (err: any) {
      const apiMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to fetch Google Business Profile data';
      if (locations.length === 0) {
        setError(apiMsg);
      }
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
    setError(null);

    if (locationId === 'ALL') {
      setIsAllLocationsSelected(true);
      if (locations.length > 0 && !selectedLocation) {
        setSelectedLocation(locations[0]);
      }
      try {
        await AsyncStorage.setItem(SELECTED_LOC_STORAGE_KEY, 'ALL');
      } catch {
        // ignore
      }

      if (accessToken && locations.length > 0) {
        setIsSyncingLocation(true);
        try {
          const enrichedAll = await Promise.all(
            locations.map((loc) =>
              loc.insights ? Promise.resolve(loc) : enrichLocationLiveMetrics(accessToken, loc)
            )
          );
          setLocations(enrichedAll);
          if (user?.email) {
            await LocalCache.cacheLocations(user.email, enrichedAll);
          }
        } finally {
          setIsSyncingLocation(false);
        }
      }
      return;
    }

    const loc = locations.find(
      (l) =>
        l.id === locationId ||
        l.googleName === locationId ||
        l.googleName.endsWith(`/${locationId}`)
    );
    if (!loc) return;

    setIsAllLocationsSelected(false);
    setSelectedLocation(loc);
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
        setLocations((prev) => {
          const next = prev.map((item) => (item.id === enriched.id ? enriched : item));
          if (user?.email) {
            LocalCache.cacheLocations(user.email, next).catch(() => {});
          }
          return next;
        });
      } finally {
        setIsSyncingLocation(false);
      }
    }
  };

  const aggregatedInsights = useMemo<PerformanceInsights>(() => {
    return locations.reduce(
      (acc, loc) => {
        const ins = loc.insights || EMPTY_INSIGHTS;
        return {
          searchViews: acc.searchViews + ins.searchViews,
          mapsViews: acc.mapsViews + ins.mapsViews,
          callClicks: acc.callClicks + ins.callClicks,
          websiteClicks: acc.websiteClicks + ins.websiteClicks,
          directionRequests: acc.directionRequests + ins.directionRequests,
        };
      },
      { ...EMPTY_INSIGHTS }
    );
  }, [locations]);

  const activeInsights = useMemo<PerformanceInsights>(() => {
    if (isAllLocationsSelected) {
      return aggregatedInsights;
    }
    return selectedLocation?.insights || EMPTY_INSIGHTS;
  }, [isAllLocationsSelected, aggregatedInsights, selectedLocation]);

  return (
    <GoogleContext.Provider
      value={{
        isConnected,
        accounts,
        locations,
        selectedLocation,
        isAllLocationsSelected,
        aggregatedInsights,
        activeInsights,
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
