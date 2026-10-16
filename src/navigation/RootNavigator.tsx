import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  MessageCircle,
  Sparkles,
  Share2,
  FileText,
  Menu,
  ChevronDown,
  MapPin,
  Search,
  Check,
  Layers,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { PostsScreen } from '../screens/PostsScreen';
import { ReviewsScreen } from '../screens/ReviewsScreen';
import { WebAuditScreen } from '../screens/WebAuditScreen';
import { MoreStackNavigator } from './MoreStackNavigator';
import { useGoogle } from '../context/GoogleContext';
import { useAuth } from '../context/AuthContext';

export type RootTabParamList = {
  Home: undefined;
  Reviews: undefined;
  Posts: undefined;
  Audit: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const AppTopHeader: React.FC<{ onPressMenu?: () => void }> = ({ onPressMenu }) => {
  const {
    locations,
    selectedLocation,
    isAllLocationsSelected,
    selectLocation,
    refreshGoogleData,
    isSyncingLocation,
    isConnected,
  } = useGoogle();
  const { user } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const primaryTitle = !isConnected
    ? 'DigiBirds 360°'
    : isAllLocationsSelected
    ? 'All Locations'
    : selectedLocation?.title || user?.displayName || 'Select Business Location';

  const subtitleLocation = !isConnected
    ? 'Local Growth & GMB Suite'
    : isAllLocationsSelected
    ? `${locations.length} locations aggregated`
    : selectedLocation?.storefrontAddress?.locality ||
      selectedLocation?.categories?.primaryCategory?.displayName ||
      user?.email ||
      'Connected';

  const filteredLocations = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((loc) => {
      const title = (loc.title || '').toLowerCase();
      const city = (loc.storefrontAddress?.locality || '').toLowerCase();
      const addr = (loc.storefrontAddress?.addressLines || []).join(' ').toLowerCase();
      return title.includes(q) || city.includes(q) || addr.includes(q);
    });
  }, [locations, searchText]);

  return (
    <>
      <View
        style={{ backgroundColor: '#131A38' }}
        className="px-4 pt-11 pb-3.5 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <Pressable onPress={onPressMenu} className="mr-3 p-1.5 rounded-lg">
            <Menu size={22} color="#ffffff" />
          </Pressable>

          {/* Top-Level Location Dropdown Trigger */}
          <Pressable
            onPress={() => {
              if (isConnected && locations.length > 0) {
                setSearchText('');
                setDropdownOpen(true);
              }
            }}
            className="flex-1 flex-row items-center py-1 pr-2"
          >
            <View className="flex-1">
              <Text
                className="text-white font-bold text-[15px] leading-tight"
                numberOfLines={1}
              >
                {primaryTitle}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Text
                  className="text-slate-300 text-xs leading-tight flex-shrink"
                  numberOfLines={1}
                >
                  {subtitleLocation}
                </Text>
                {isConnected && locations.length > 0 && (
                  <ChevronDown size={14} color="#FACC15" style={{ marginLeft: 4 }} />
                )}
              </View>
            </View>
          </Pressable>
        </View>

        {/* Right Sync / Status Pill */}
        {isConnected && (
          <Pressable
            onPress={refreshGoogleData}
            disabled={isSyncingLocation}
            style={{ backgroundColor: '#232D54' }}
            className="flex-row items-center px-3 py-1.5 rounded-full"
          >
            {isSyncingLocation ? (
              <ActivityIndicator size="small" color="#FACC15" />
            ) : (
              <RefreshCw size={12} color="#ffffff" />
            )}
            <Text className="text-white text-xs font-medium ml-1.5">
              {isSyncingLocation ? 'Syncing' : 'Sync'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Top-Level Select Location Dropdown Modal */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl pt-5 pb-8 px-5 max-h-[82%]">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-bold text-slate-900">Select Location</Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  {locations.length} verified Google Business Profile{' '}
                  {locations.length === 1 ? 'listing' : 'listings'}
                </Text>
              </View>
              <Pressable
                onPress={() => setDropdownOpen(false)}
                className="p-2 rounded-full bg-slate-100"
              >
                <X size={18} color="#475569" />
              </Pressable>
            </View>

            {/* Search Locations Input */}
            <View className="flex-row items-center bg-slate-100 rounded-xl px-3.5 py-2.5 mb-4">
              <Search size={16} color="#64748b" />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search locations..."
                placeholderTextColor="#94a3b8"
                className="flex-1 text-sm text-slate-900 ml-2.5 py-0"
                autoCapitalize="none"
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* All Locations Option (when > 1 location exists) */}
              {locations.length > 1 && !searchText.trim() && (
                <Pressable
                  onPress={() => {
                    selectLocation('ALL');
                    setDropdownOpen(false);
                  }}
                  style={{
                    backgroundColor: isAllLocationsSelected ? '#EEF2FF' : '#F8FAFC',
                    borderColor: isAllLocationsSelected ? '#3B82F6' : '#E2E8F0',
                    borderWidth: 1,
                  }}
                  className="p-3.5 rounded-2xl mb-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View
                      style={{
                        backgroundColor: isAllLocationsSelected ? '#2563EB' : '#E2E8F0',
                      }}
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    >
                      <Layers
                        size={18}
                        color={isAllLocationsSelected ? '#FFFFFF' : '#475569'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900">All Locations</Text>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        Aggregated data across all {locations.length} locations
                      </Text>
                    </View>
                  </View>
                  {isAllLocationsSelected && <Check size={18} color="#2563EB" />}
                </Pressable>
              )}

              {/* Individual Locations List */}
              {filteredLocations.map((loc) => {
                const isSelected =
                  !isAllLocationsSelected && selectedLocation?.id === loc.id;
                const city =
                  loc.storefrontAddress?.locality ||
                  loc.storefrontAddress?.administrativeArea ||
                  'Google Business Listing';
                const addressLine = (loc.storefrontAddress?.addressLines || []).join(', ');

                return (
                  <Pressable
                    key={loc.id}
                    onPress={() => {
                      selectLocation(loc.id);
                      setDropdownOpen(false);
                    }}
                    style={{
                      backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                      borderColor: isSelected ? '#3B82F6' : '#E2E8F0',
                      borderWidth: 1,
                    }}
                    className="p-3.5 rounded-2xl mb-2.5 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-start flex-1 mr-3">
                      <View
                        style={{
                          backgroundColor: isSelected ? '#131A38' : '#F1F5F9',
                        }}
                        className="w-9 h-9 rounded-xl items-center justify-center mr-3 mt-0.5"
                      >
                        <MapPin size={16} color={isSelected ? '#FACC15' : '#475569'} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-blue-700">
                          {city}
                        </Text>
                        <Text className="text-sm font-bold text-slate-900 mt-0.5">
                          {loc.title}
                        </Text>
                        {addressLine ? (
                          <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                            {addressLine}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {isSelected && <Check size={18} color="#2563EB" />}
                  </Pressable>
                );
              })}

              {filteredLocations.length === 0 && (
                <View className="py-8 items-center">
                  <Text className="text-sm text-slate-500">
                    No locations matched "{searchText}"
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export const RootNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isLoading: authLoading } = useAuth();

  // Fast, minimal Splash Screen with DigiBirds 360° Logo while SecureStore restores session
  if (authLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Image
          source={require('../../assets/digibirds-logo.png')}
          style={{ width: 240, height: 80 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  const bottomInset = Platform.OS === 'ios' ? Math.max(insets.bottom, 28) : 8;

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ navigation }) => ({
          header: () => <AppTopHeader onPressMenu={() => navigation.navigate('More')} />,
          tabBarActiveTintColor: '#0F172A',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#F1F5F9',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 64,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            paddingTop: 8,
            elevation: 12,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
          },
          tabBarItemStyle: {
            borderRadius: 12,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 2,
            marginBottom: Platform.OS === 'ios' ? 2 : 0,
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Home size={22} color={color} strokeWidth={focused ? 2.5 : 1.75} />
            ),
          }}
        />
        <Tab.Screen
          name="Reviews"
          component={ReviewsScreen}
          options={{
            title: 'Reviews',
            tabBarIcon: ({ color }) => <MessageCircle size={20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Posts"
          component={PostsScreen}
          options={{
            title: 'Posts',
            tabBarIcon: ({ color }) => <Share2 size={20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Audit"
          component={WebAuditScreen}
          options={{
            title: 'SEO Audit',
            tabBarIcon: ({ color }) => <FileText size={20} color={color} />,
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreStackNavigator}
          options={{
            title: 'More',
            headerShown: false,
            tabBarIcon: ({ color }) => <Menu size={20} color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
