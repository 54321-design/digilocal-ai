import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { MapPin, RefreshCw, Building2, Plus, CheckCircle2 } from 'lucide-react-native';
import { useGoogle } from '../context/GoogleContext';
import { useAuth } from '../context/AuthContext';
import {
  LocationCard,
  Button,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../components';

interface LocationsScreenProps {
  navigation: any;
}

export const LocationsScreen: React.FC<LocationsScreenProps> = ({ navigation }) => {
  const {
    locations,
    selectedLocation,
    selectLocation,
    isLoading,
    isSyncingLocation,
    error,
    refreshGoogleData,
    isConnected,
  } = useGoogle();
  const { signInWithGoogle } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshGoogleData();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header bar */}
      <View className="bg-white px-5 py-3 border-b border-slate-100 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-slate-900">Google Locations</Text>
          <Text className="text-xs text-slate-500">
            {isSyncingLocation
              ? `Syncing live data for ${selectedLocation?.title || 'selected location'}...`
              : `${locations.length} ${locations.length === 1 ? 'location' : 'locations'} managed`}
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          className="p-2 rounded-xl bg-slate-100 active:bg-slate-200"
        >
          <RefreshCw size={16} color="#64748b" />
        </Pressable>
      </View>

      {isLoading && !refreshing ? (
        <LoadingState message="Fetching locations from Google Business Profile..." />
      ) : error ? (
        <View className="p-4">
          <ErrorState message={error} onRetry={refreshGoogleData} />
        </View>
      ) : !isConnected ? (
        <EmptyState
          icon={<Building2 size={32} color="#2563eb" />}
          title="Connect Google Business Profile"
          description="Sign in to link and manage your verified Google storefronts and locations."
          actionTitle="Sign in with Google"
          onAction={signInWithGoogle}
        />
      ) : locations.length === 0 ? (
        <EmptyState
          icon={<MapPin size={32} color="#94a3b8" />}
          title="No Locations Found"
          description="Your connected Google account does not currently own or manage any Business Profile locations."
          actionTitle="Refresh"
          onAction={refreshGoogleData}
        />
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id || item.googleName}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <LocationCard
              location={item}
              isSelected={selectedLocation?.id === item.id}
              onPress={() => {
                selectLocation(item.id);
                navigation.navigate('Home');
              }}
            />
          )}
        />
      )}
    </View>
  );
};
