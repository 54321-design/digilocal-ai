import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Linking,
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
  MoreHorizontal,
  Navigation,
} from 'lucide-react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Text as SvgText,
  G,
  Line,
} from 'react-native-svg';
import { useGoogle } from '../context/GoogleContext';

interface LocationsScreenProps {
  navigation: any;
}

export const LocationsScreen: React.FC<LocationsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { locations, selectedLocation, selectLocation } = useGoogle();

  // Mode: 'card' (single big floating card) vs 'list' (stacked compact cards)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Default fallback items if none in Google account
  const defaultItems = [
    {
      id: 'loc-1',
      title: 'Harmony General Hospital',
      category: 'General & Primary Care',
      categoryColor: 'bg-orange-100 text-orange-600',
      address: 'Fenimore St 22A (2.3km)',
      hours: 'Open · Close at 23:30',
      phone: '+1 718-555-0199',
      image:
        'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'loc-2',
      title: 'VitalSpring Medical',
      category: 'Dental & Oral Health',
      categoryColor: 'bg-rose-100 text-rose-600',
      address: 'Fenimore St 22A (2.3km)',
      hours: 'Open · Close at 20:00',
      phone: '+1 718-555-0244',
      image:
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'loc-3',
      title: 'Zenith Wellness Care',
      category: 'Mental & Behavioral Health',
      categoryColor: 'bg-blue-100 text-blue-600',
      address: 'Fenimore St 22A (2.3km)',
      hours: 'Open · Close at 19:00',
      phone: '+1 718-555-0377',
      image:
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    },
  ];

  // Merge with real Google locations if available
  const displayItems =
    locations.length > 0
      ? locations.map((loc, idx) => ({
          id: loc.id || `loc-${idx}`,
          title: loc.title || 'Storefront Location',
          category:
            loc.categories?.primaryCategory?.displayName ||
            'General & Primary Care',
          categoryColor:
            idx % 3 === 0
              ? 'bg-orange-100 text-orange-600'
              : idx % 3 === 1
              ? 'bg-rose-100 text-rose-600'
              : 'bg-blue-100 text-blue-600',
          address: `${loc.storefrontAddress?.locality || 'Fenimore St 22A'} (2.3km)`,
          hours: 'Open · Close at 23:30',
          phone: loc.phoneNumbers?.primaryPhone || '+1 718-555-0199',
          image:
            defaultItems[idx % defaultItems.length].image,
        }))
      : defaultItems;

  const currentItem = displayItems[selectedIdx] || displayItems[0];

  const openDirections = () => {
    const q = encodeURIComponent(currentItem.title + ' ' + currentItem.address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const makeCall = () => {
    Linking.openURL(`tel:${currentItem.phone}`);
  };

  return (
    <View className="flex-1 bg-[#EEF2F6]">
      {/* ==================================================================== */}
      {/* 1. MAP BACKGROUND LAYER (EXACT VIDEO MATCH)                          */}
      {/* ==================================================================== */}
      <View className="absolute inset-0">
        <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="none">
          {/* Map Land Background */}
          <Rect width="400" height="800" fill="#E8ECEF" />

          {/* Faint Park Area (Prospect Park in video) */}
          <Path
            d="M -20,120 Q 80,140 120,240 T 140,400 T 80,550 L -20,550 Z"
            fill="#D5E3D8"
            opacity="0.8"
          />
          <SvgText x="30" y="220" fill="#8FA694" fontSize="10" fontWeight="bold">
            Prospect Park Zoo
          </SvgText>
          <SvgText x="20" y="360" fill="#8FA694" fontSize="10" fontWeight="bold">
            Prospect Park Boathouse
          </SvgText>

          {/* Roads Network (Grayscale vector roads like video) */}
          <Path
            d="M 120,0 L 160,800"
            stroke="#FFFFFF"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <Path
            d="M 180,0 L 220,800"
            stroke="#FFFFFF"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <Path
            d="M 0,160 L 400,210"
            stroke="#FFFFFF"
            strokeWidth="8"
          />
          <Path
            d="M 0,270 L 400,240"
            stroke="#FFFFFF"
            strokeWidth="10"
          />
          <Path
            d="M 0,380 L 400,320"
            stroke="#FFFFFF"
            strokeWidth="8"
          />
          <Path
            d="M 0,500 L 400,460"
            stroke="#FFFFFF"
            strokeWidth="8"
          />

          {/* Street Name Labels */}
          <SvgText x="230" y="160" fill="#94A3B8" fontSize="9" fontWeight="600">
            Empire Blvd
          </SvgText>
          <SvgText x="230" y="210" fill="#94A3B8" fontSize="9" fontWeight="600">
            Sterling St
          </SvgText>
          <SvgText x="230" y="270" fill="#94A3B8" fontSize="9" fontWeight="600">
            Prospect Pk
          </SvgText>
          <SvgText x="230" y="340" fill="#94A3B8" fontSize="9" fontWeight="600">
            Fenimore St
          </SvgText>
          <SvgText x="260" y="440" fill="#94A3B8" fontSize="9" fontWeight="600">
            Bedford Ave
          </SvgText>

          {/* Map subway marker */}
          <Circle cx="215" cy="266" r="6" fill="#18181B" />
          <SvgText x="213" y="269" fill="#FFFFFF" fontSize="7" fontWeight="bold">M</SvgText>

          {/* Glowing Orange Location Pins */}
          {/* Pin 1 (Active) */}
          <G>
            <Circle cx="240" cy="360" r="16" fill="#FF5722" fillOpacity="0.25" />
            <Circle cx="240" cy="360" r="8" fill="#FF5722" />
            <Circle cx="240" cy="360" r="3" fill="#FFFFFF" />
          </G>

          {/* Pin 2 */}
          <G>
            <Circle cx="200" cy="180" r="6" fill="#FF7043" />
            <Circle cx="200" cy="180" r="2.5" fill="#FFFFFF" />
          </G>

          {/* Pin 3 */}
          <G>
            <Circle cx="280" cy="420" r="6" fill="#FF7043" />
            <Circle cx="280" cy="420" r="2.5" fill="#FFFFFF" />
          </G>
        </Svg>
      </View>

      {/* ==================================================================== */}
      {/* 2. TOP FLOATING APP BAR (EXACT VIDEO MATCH)                          */}
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
        <Text className="text-lg font-bold text-slate-900">Hospitals</Text>

        {/* Top Right Segmented Toggle Pill (Card vs List View) */}
        <View className="bg-slate-100/90 rounded-full p-1 flex-row border border-slate-200/60 shadow-xs">
          {/* Card View Button */}
          <Pressable
            onPress={() => setViewMode('card')}
            className={`p-1.5 rounded-full ${
              viewMode === 'card' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <LayoutGrid
              size={16}
              color={viewMode === 'card' ? '#0F172A' : '#94A3B8'}
            />
          </Pressable>

          {/* List View Button */}
          <Pressable
            onPress={() => setViewMode('list')}
            className={`p-1.5 rounded-full ${
              viewMode === 'list' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <List
              size={16}
              color={viewMode === 'list' ? '#0F172A' : '#94A3B8'}
            />
          </Pressable>
        </View>
      </View>

      <View className="flex-1" />

      {/* ==================================================================== */}
      {/* 3. BOTTOM FLOATING CARD DECK (EXACT VIDEO MATCH)                     */}
      {/* ==================================================================== */}
      {viewMode === 'card' ? (
        /* SINGLE BIG FLOATING HERO CARD (VIDEO FRAMES 16 & 20) */
        <View className="px-4 pb-6">
          <View className="bg-white rounded-3xl p-4 shadow-2xl shadow-slate-900/10 border border-slate-100">
            {/* Architectural Hero Image */}
            <Image
              source={{ uri: currentItem.image }}
              className="w-full h-44 rounded-2xl"
              resizeMode="cover"
            />

            {/* Category Badge Pill */}
            <View className="mt-3.5 self-start">
              <View className="bg-orange-100 px-3 py-1 rounded-full">
                <Text className="text-orange-600 text-[11px] font-bold">
                  {currentItem.category}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text className="text-xl font-black text-slate-900 mt-2">
              {currentItem.title}
            </Text>

            {/* Address */}
            <View className="flex-row items-center mt-1.5">
              <MapPin size={12} color="#94A3B8" />
              <Text className="text-xs text-slate-500 font-medium ml-1">
                {currentItem.address}
              </Text>
            </View>

            {/* Hours */}
            <View className="flex-row items-center mt-1">
              <Clock size={12} color="#94A3B8" />
              <Text className="text-xs text-slate-400 font-medium ml-1">
                {currentItem.hours}
              </Text>
            </View>

            {/* Action Buttons Row */}
            <View className="flex-row items-center gap-2 mt-4 pt-2">
              {/* Direction Dark Charcoal Pill */}
              <Pressable
                onPress={openDirections}
                className="flex-1 bg-neutral-900 active:bg-black rounded-full py-3 px-5 flex-row items-center justify-center shadow-md"
              >
                <ArrowUpRight size={16} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white ml-1.5">
                  Direction
                </Text>
              </Pressable>

              {/* Call Circular Button */}
              <Pressable
                onPress={makeCall}
                className="w-12 h-12 rounded-full bg-slate-100 active:bg-slate-200 items-center justify-center border border-slate-200/50"
              >
                <Phone size={16} color="#0F172A" />
              </Pressable>

              {/* More Circular Button */}
              <Pressable
                onPress={() => setViewMode('list')}
                className="w-12 h-12 rounded-full bg-slate-100 active:bg-slate-200 items-center justify-center border border-slate-200/50"
              >
                <MoreHorizontal size={18} color="#0F172A" />
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        /* STACKED LIST FLOATING CARDS (VIDEO FRAME 12) */
        <ScrollView
          style={{ maxHeight: 380 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {displayItems.map((item, idx) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setSelectedIdx(idx);
                setViewMode('card');
              }}
              className="bg-white rounded-3xl p-3 shadow-lg shadow-black/5 border border-slate-100 flex-row items-center active:bg-slate-50"
            >
              <Image
                source={{ uri: item.image }}
                className="w-20 h-20 rounded-2xl mr-3"
                resizeMode="cover"
              />
              <View className="flex-1">
                <View className="self-start mb-1">
                  <View
                    className={`px-2.5 py-0.5 rounded-full ${
                      idx === 0
                        ? 'bg-orange-100'
                        : idx === 1
                        ? 'bg-rose-100'
                        : 'bg-blue-100'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        idx === 0
                          ? 'text-orange-600'
                          : idx === 1
                          ? 'text-rose-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {item.category}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                  {item.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <MapPin size={11} color="#94A3B8" />
                  <Text className="text-[11px] text-slate-400 font-medium ml-1" numberOfLines={1}>
                    {item.address}
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
