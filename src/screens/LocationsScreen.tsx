import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  LayoutGrid,
  List,
  MapPin,
  Clock,
  ArrowUpRight,
  Phone,
  Globe,
  Building2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { useGoogle } from '../context/GoogleContext';
import { useAuth } from '../context/AuthContext';

interface LocationsScreenProps {
  navigation: any;
}

export const LocationsScreen: React.FC<LocationsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    locations,
    selectedLocation,
    selectLocation,
    isLoading,
    refreshGoogleData,
    isConnected,
  } = useGoogle();
  const { signInWithGoogle } = useAuth();

  // Mode: 'card' (single prominent hero card) vs 'list' (stacked cards)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Fallback storefront photos for real locations
  const storefrontImages = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
  ];

  const currentLoc = locations[selectedIdx] || selectedLocation || locations[0];

  const openDirections = (loc: typeof currentLoc) => {
    if (!loc) return;
    const addressStr = loc.storefrontAddress?.addressLines?.join(' ') || loc.storefrontAddress?.locality || '';
    const q = encodeURIComponent(`${loc.title || 'Storefront'} ${addressStr}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const makeCall = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const openWebsite = (url?: string) => {
    if (!url) return;
    Linking.openURL(url);
  };

  return (
    <View className="flex-1 bg-[#EEF2F6]">
      {/* ==================================================================== */}
      {/* 1. MAP BACKGROUND LAYER                                              */}
      {/* ==================================================================== */}
      <View className="absolute inset-0">
        <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="none">
          {/* Map Land Background */}
          <Rect width="400" height="800" fill="#E8ECEF" />

          {/* Faint Park Area */}
          <Path
            d="M -20,120 Q 80,140 120,240 T 140,400 T 80,550 L -20,550 Z"
            fill="#D5E3D8"
            opacity="0.8"
          />
          <SvgText x="30" y="220" fill="#8FA694" fontSize="10" fontWeight="bold">
            Central District
          </SvgText>
          <SvgText x="20" y="360" fill="#8FA694" fontSize="10" fontWeight="bold">
            Business Commercial Zone
          </SvgText>

          {/* Roads Network */}
          <Path d="M 120,0 L 160,800" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" />
          <Path d="M 180,0 L 220,800" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
          <Path d="M 0,160 L 400,210" stroke="#FFFFFF" strokeWidth="8" />
          <Path d="M 0,270 L 400,240" stroke="#FFFFFF" strokeWidth="10" />
          <Path d="M 0,380 L 400,320" stroke="#FFFFFF" strokeWidth="8" />
          <Path d="M 0,500 L 400,460" stroke="#FFFFFF" strokeWidth="8" />

          {/* Street Name Labels */}
          <SvgText x="230" y="160" fill="#94A3B8" fontSize="9" fontWeight="600">
            Main Avenue
          </SvgText>
          <SvgText x="230" y="210" fill="#94A3B8" fontSize="9" fontWeight="600">
            Commercial St
          </SvgText>
          <SvgText x="230" y="270" fill="#94A3B8" fontSize="9" fontWeight="600">
            Transit Hub
          </SvgText>
          <SvgText x="230" y="340" fill="#94A3B8" fontSize="9" fontWeight="600">
            Market Boulevard
          </SvgText>

          {/* Subway / Transit marker */}
          <Circle cx="215" cy="266" r="6" fill="#18181B" />
          <SvgText x="213" y="269" fill="#FFFFFF" fontSize="7" fontWeight="bold">M</SvgText>

          {/* Glowing Orange Location Pins for Real Storefronts */}
          {locations.map((loc, idx) => {
            const isSelected = selectedLocation?.id === loc.id || selectedIdx === idx;
            const pinX = 180 + (idx * 55) % 180;
            const pinY = 220 + (idx * 75) % 280;

            return (
              <G key={loc.id || idx}>
                {isSelected && (
                  <Circle cx={pinX} cy={pinY} r="16" fill="#FF5722" fillOpacity="0.25" />
                )}
                <Circle cx={pinX} cy={pinY} r={isSelected ? '8' : '6'} fill={isSelected ? '#FF5722' : '#FF7043'} />
                <Circle cx={pinX} cy={pinY} r={isSelected ? '3' : '2'} fill="#FFFFFF" />
              </G>
            );
          })}
        </Svg>
      </View>

      {/* ==================================================================== */}
      {/* 2. TOP FLOATING APP BAR                                              */}
      {/* ==================================================================== */}
      <View
        style={{ paddingTop: Math.max(insets.top, 24) + 8 }}
        className="px-5 pb-3 flex-row items-center justify-between"
      >
        {/* Circular Back Button */}
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 items-center justify-center active:bg-slate-50"
        >
          <ChevronLeft size={20} color="#0F172A" />
        </Pressable>

        {/* Title */}
        <Text className="text-lg font-bold text-slate-900">Storefront Locations</Text>

        {/* Top Right Controls */}
        {isConnected && locations.length > 0 ? (
          <View className="bg-slate-100/90 rounded-full p-1 flex-row border border-slate-200/60 shadow-xs">
            {/* Card View Button */}
            <Pressable
              onPress={() => setViewMode('card')}
              className={`p-1.5 rounded-full ${viewMode === 'card' ? 'bg-white shadow-xs' : ''}`}
            >
              <LayoutGrid size={16} color={viewMode === 'card' ? '#0F172A' : '#94A3B8'} />
            </Pressable>

            {/* List View Button */}
            <Pressable
              onPress={() => setViewMode('list')}
              className={`p-1.5 rounded-full ${viewMode === 'list' ? 'bg-white shadow-xs' : ''}`}
            >
              <List size={16} color={viewMode === 'list' ? '#0F172A' : '#94A3B8'} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={refreshGoogleData}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 items-center justify-center active:bg-slate-50"
          >
            <RefreshCw size={16} color="#0F172A" />
          </Pressable>
        )}
      </View>

      <View className="flex-1" />

      {/* ==================================================================== */}
      {/* 3. BOTTOM FLOATING CARD DECK (100% REAL GMB LOCATIONS)               */}
      {/* ==================================================================== */}
      {!isConnected ? (
        // NOT CONNECTED STATE
        <View className="px-4 pb-6">
          <View className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 items-center text-center">
            <View className="w-12 h-12 rounded-2xl bg-orange-50 items-center justify-center mb-3">
              <Building2 size={24} color="#EA580C" />
            </View>
            <Text className="text-lg font-bold text-slate-900 text-center">
              Connect Google Business Profile
            </Text>
            <Text className="text-xs text-slate-500 text-center mt-1.5 px-3 leading-relaxed">
              Sign in with your Google account to automatically load and manage all your verified physical storefronts on the map.
            </Text>
            <Pressable
              onPress={signInWithGoogle}
              className="bg-neutral-900 active:bg-black rounded-full py-3 px-6 mt-4 flex-row items-center justify-center shadow-md w-full"
            >
              <Text className="text-xs font-bold text-white">Sign in with Google</Text>
            </Pressable>
          </View>
        </View>
      ) : locations.length === 0 ? (
        // NO LOCATIONS FOUND IN CONNECTED ACCOUNT
        <View className="px-4 pb-6">
          <View className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 items-center text-center">
            <View className="w-12 h-12 rounded-2xl bg-amber-50 items-center justify-center mb-3">
              <MapPin size={24} color="#D97706" />
            </View>
            <Text className="text-lg font-bold text-slate-900 text-center">
              No Business Locations Found
            </Text>
            <Text className="text-xs text-slate-500 text-center mt-1.5 px-3 leading-relaxed">
              Your Google account is connected, but no verified Business Profile locations were returned.
            </Text>
            <Pressable
              onPress={refreshGoogleData}
              className="bg-neutral-900 active:bg-black rounded-full py-3 px-6 mt-4 flex-row items-center justify-center shadow-md w-full"
            >
              <RefreshCw size={14} color="#FFFFFF" className="mr-2" />
              <Text className="text-xs font-bold text-white ml-2">Refresh from Google</Text>
            </Pressable>
          </View>
        </View>
      ) : viewMode === 'card' && currentLoc ? (
        // SINGLE PROMINENT HERO CARD (VIDEO FRAMES 16 & 20)
        <View className="px-4 pb-6">
          <View className="bg-white rounded-3xl p-4 shadow-2xl shadow-slate-900/10 border border-slate-100">
            {/* Storefront Image */}
            <Image
              source={{ uri: storefrontImages[selectedIdx % storefrontImages.length] }}
              className="w-full h-44 rounded-2xl"
              resizeMode="cover"
            />

            {/* Category Badge Pill */}
            <View className="mt-3.5 flex-row items-center justify-between">
              <View className="bg-orange-100 px-3 py-1 rounded-full">
                <Text className="text-orange-600 text-[11px] font-bold">
                  {currentLoc.categories?.primaryCategory?.displayName || 'Verified Storefront'}
                </Text>
              </View>

              {selectedLocation?.id === currentLoc.id && (
                <View className="flex-row items-center bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 size={12} color="#059669" />
                  <Text className="text-emerald-700 text-[10px] font-bold ml-1">Active</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text className="text-xl font-black text-slate-900 mt-2">
              {currentLoc.title}
            </Text>

            {/* Address */}
            <View className="flex-row items-center mt-1.5">
              <MapPin size={12} color="#94A3B8" />
              <Text className="text-xs text-slate-500 font-medium ml-1" numberOfLines={1}>
                {currentLoc.storefrontAddress?.addressLines?.join(', ') ||
                  currentLoc.storefrontAddress?.locality ||
                  'Google Verified Storefront'}
              </Text>
            </View>

            {/* Hours */}
            <View className="flex-row items-center mt-1">
              <Clock size={12} color="#94A3B8" />
              <Text className="text-xs text-slate-400 font-medium ml-1">
                {currentLoc.regularHours?.periods?.length
                  ? 'Open · Business hours configured'
                  : 'Regular business hours'}
              </Text>
            </View>

            {/* Action Buttons Row */}
            <View className="flex-row items-center gap-2 mt-4 pt-2">
              {/* Direction Dark Charcoal Pill */}
              <Pressable
                onPress={() => openDirections(currentLoc)}
                className="flex-1 bg-neutral-900 active:bg-black rounded-full py-3 px-5 flex-row items-center justify-center shadow-md"
              >
                <ArrowUpRight size={16} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white ml-1.5">
                  Direction
                </Text>
              </Pressable>

              {/* Call Circular Button */}
              {currentLoc.phoneNumbers?.primaryPhone ? (
                <Pressable
                  onPress={() => makeCall(currentLoc.phoneNumbers?.primaryPhone)}
                  className="w-12 h-12 rounded-full bg-slate-100 active:bg-slate-200 items-center justify-center border border-slate-200/50"
                >
                  <Phone size={16} color="#0F172A" />
                </Pressable>
              ) : null}

              {/* Website Circular Button */}
              {currentLoc.websiteUri ? (
                <Pressable
                  onPress={() => openWebsite(currentLoc.websiteUri)}
                  className="w-12 h-12 rounded-full bg-slate-100 active:bg-slate-200 items-center justify-center border border-slate-200/50"
                >
                  <Globe size={16} color="#0F172A" />
                </Pressable>
              ) : null}
            </View>

            {/* Make Active Storefront Button */}
            {selectedLocation?.id !== currentLoc.id && (
              <Pressable
                onPress={() => {
                  selectLocation(currentLoc.id);
                }}
                className="mt-2.5 py-2 items-center"
              >
                <Text className="text-xs font-semibold text-blue-600">
                  Set as Active Storefront
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        // STACKED LIST FLOATING CARDS (VIDEO FRAME 12)
        <ScrollView
          style={{ maxHeight: 380 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {locations.map((loc, idx) => (
            <Pressable
              key={loc.id || idx}
              onPress={() => {
                setSelectedIdx(idx);
                selectLocation(loc.id);
                setViewMode('card');
              }}
              className={`bg-white rounded-3xl p-3 shadow-lg shadow-black/5 border flex-row items-center active:bg-slate-50 ${
                selectedLocation?.id === loc.id ? 'border-orange-500' : 'border-slate-100'
              }`}
            >
              <Image
                source={{ uri: storefrontImages[idx % storefrontImages.length] }}
                className="w-20 h-20 rounded-2xl mr-3"
                resizeMode="cover"
              />
              <View className="flex-1">
                <View className="self-start mb-1">
                  <View className="bg-orange-100 px-2.5 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-orange-600">
                      {loc.categories?.primaryCategory?.displayName || 'Storefront'}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                  {loc.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <MapPin size={11} color="#94A3B8" />
                  <Text className="text-[11px] text-slate-400 font-medium ml-1" numberOfLines={1}>
                    {loc.storefrontAddress?.addressLines?.join(', ') ||
                      loc.storefrontAddress?.locality ||
                      'Google Storefront'}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};
