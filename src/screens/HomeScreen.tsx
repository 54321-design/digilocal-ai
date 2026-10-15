import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Star,
  Clock,
  ChevronRight,
  CheckCircle,
  PhoneCall,
  Navigation,
  Globe,
  Share2,
  TrendingUp,
  Sparkles,
  FileText,
  UploadCloud,
  Building2,
  X,
  Check,
  Calendar,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useGoogle } from '../context/GoogleContext';
import { useReviews } from '../context/ReviewsContext';
import { useSocial } from '../context/SocialContext';
import { useSEO } from '../context/SEOContext';
import { usePosts } from '../context/PostsContext';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    isConnected,
    locations,
    selectedLocation,
    isAllLocationsSelected,
    activeInsights,
    refreshGoogleData,
  } = useGoogle();
  const { reviews, refreshReviews, sentimentReport, totalReviewCount } = useReviews();
  const { connectedCount } = useSocial();
  const { audit, runWebAudit } = useSEO();
  const { locationPosts } = usePosts();

  const [refreshing, setRefreshing] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGoogleData(), refreshReviews()]);
    if (selectedLocation?.websiteUri) {
      await runWebAudit(selectedLocation.websiteUri);
    }
    setRefreshing(false);
  };

  // Stats calculation
  const totalReviews = Math.max(totalReviewCount || 0, reviews.length);
  const averageRatingNum = useMemo(() => {
    if (sentimentReport?.averageRating) return Number(sentimentReport.averageRating);
    if (reviews.length === 0) return 4.9;
    return Number(
      (reviews.reduce((acc, r) => acc + r.numericRating, 0) / reviews.length).toFixed(1)
    );
  }, [sentimentReport, reviews]);

  const scheduledPosts = useMemo(
    () => locationPosts.filter((p) => p.status === 'scheduled'),
    [locationPosts]
  );

  const scheduledCount = scheduledPosts.length > 0 ? scheduledPosts.length : 3;
  const userName =
    user?.displayName?.split(' ')[0] ||
    selectedLocation?.title?.split(' ')[0] ||
    'Willie';

  return (
    <View className="flex-1 bg-[#F8F9FA]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF5722"
            colors={['#FF5722']}
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ==================================================================== */}
        {/* 1. TOP LIQUID SUNSET GRADIENT HEADER MESH (EXACT VIDEO MATCH)        */}
        {/* ==================================================================== */}
        <LinearGradient
          colors={['#FF4E20', '#FF6B4A', '#FF8A65', '#FFF1ED']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: 44,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
          }}
        >
          {/* Greeting Row */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                Welcome Back
              </Text>
              <Text className="text-white text-3xl font-black tracking-tight mt-0.5">
                {userName}
              </Text>
            </View>

            {/* Profile Avatar / Location Pill */}
            <Pressable
              onPress={() => navigation.navigate('More', { screen: 'Locations' })}
              className="bg-white/20 px-3 py-1.5 rounded-full flex-row items-center border border-white/30 backdrop-blur-md"
            >
              <MapPin size={12} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold ml-1.5" numberOfLines={1}>
                {selectedLocation?.storefrontAddress?.locality || 'All Storefronts'}
              </Text>
            </Pressable>
          </View>

          {/* ================================================================ */}
          {/* 2. TRANSLUCENT GLASS ALERT PILL (EXACT VIDEO MATCH)             */}
          {/* ================================================================ */}
          <Pressable
            onPress={() => navigation.navigate('Reviews')}
            className="bg-white/85 rounded-2xl p-3 flex-row items-center justify-between shadow-lg shadow-black/5 border border-white/60 active:bg-white"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-8 h-8 rounded-xl bg-orange-500 items-center justify-center mr-3 shadow-sm">
                <Text className="text-white font-black text-sm">2</Text>
              </View>
              <Text className="text-slate-900 font-semibold text-xs flex-1" numberOfLines={1}>
                You have 2 sync tasks in progress
              </Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </Pressable>
        </LinearGradient>

        {/* ==================================================================== */}
        {/* 3. SIGNATURE HERO METRIC CARD (EXACT VIDEO MATCH)                   */}
        {/* ==================================================================== */}
        <View className="px-4 -mt-6">
          <View className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            {/* Watermark Illustration in top-right */}
            <View className="absolute right-4 top-4 opacity-10 pointer-events-none">
              <Svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1">
                <Rect x="3" y="3" width="18" height="18" rx="4" />
                <Path d="M7 8h10M7 12h7M7 16h5" />
              </Svg>
            </View>

            {/* Header row */}
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-lg font-bold text-slate-900">
                  {scheduledCount} Upcoming Campaigns
                </Text>
                <View className="flex-row items-center mt-1">
                  <Clock size={12} color="#94A3B8" />
                  <Text className="text-xs text-slate-400 font-medium ml-1.5">
                    Due in 2 days
                  </Text>
                </View>
              </View>

              {/* Dark Charcoal Pill Button */}
              <Pressable
                onPress={() => setScheduleModalVisible(true)}
                className="bg-neutral-900 active:bg-black px-5 py-2.5 rounded-full shadow-md"
              >
                <Text className="text-xs font-semibold text-white">View Schedule</Text>
              </Pressable>
            </View>

            {/* Metric Value at bottom */}
            <View className="mt-6 flex-row items-baseline justify-between">
              <View>
                <Text className="text-2xl font-black text-slate-900 tracking-tight">
                  {totalReviews > 0 ? `${averageRatingNum.toFixed(1)} ★ Rating` : '4.9 ★ Active'}
                </Text>
                <Text className="text-xs font-semibold text-emerald-600 mt-0.5">
                  +18.4% reach this month
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-sm font-bold text-slate-900">
                  {locations.length > 0 ? `${locations.length} Locations` : '1 Storefront'}
                </Text>
                <Text className="text-[11px] text-slate-400">Google Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ==================================================================== */}
        {/* 4. SERVICES SECTION (2X3 PILL CHIPS GRID - EXACT VIDEO MATCH)       */}
        {/* ==================================================================== */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-bold text-slate-900 mb-3">Services</Text>

          <View className="flex-row flex-wrap justify-between">
            {/* Service 1: Create Post */}
            <Pressable
              onPress={() => navigation.navigate('Posts')}
              style={{ width: '48%' }}
              className="bg-white rounded-2xl p-3.5 mb-3 border border-slate-100 shadow-sm flex-row items-center active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-xl bg-orange-50 items-center justify-center mr-2.5">
                <FileText size={16} color="#EA580C" />
              </View>
              <Text className="text-xs font-bold text-slate-800">Create Post</Text>
            </Pressable>

            {/* Service 2: Bulk Upload */}
            <Pressable
              onPress={() => navigation.navigate('Posts')}
              style={{ width: '48%' }}
              className="bg-white rounded-2xl p-3.5 mb-3 border border-slate-100 shadow-sm flex-row items-center active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-xl bg-blue-50 items-center justify-center mr-2.5">
                <UploadCloud size={16} color="#2563EB" />
              </View>
              <Text className="text-xs font-bold text-slate-800">Bulk Import</Text>
            </Pressable>

            {/* Service 3: Locations (Hospitals screen match in video) */}
            <Pressable
              onPress={() => navigation.navigate('More', { screen: 'Locations' })}
              style={{ width: '48%' }}
              className="bg-white rounded-2xl p-3.5 mb-3 border border-slate-100 shadow-sm flex-row items-center active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-xl bg-emerald-50 items-center justify-center mr-2.5">
                <Building2 size={16} color="#059669" />
              </View>
              <Text className="text-xs font-bold text-slate-800">Locations</Text>
            </Pressable>

            {/* Service 4: Reviews */}
            <Pressable
              onPress={() => navigation.navigate('Reviews')}
              style={{ width: '48%' }}
              className="bg-white rounded-2xl p-3.5 mb-3 border border-slate-100 shadow-sm flex-row items-center active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-xl bg-amber-50 items-center justify-center mr-2.5">
                <Star size={16} color="#D97706" />
              </View>
              <Text className="text-xs font-bold text-slate-800">Reviews & AI</Text>
            </Pressable>

            {/* Service 5: AI Studio */}
            <Pressable
              onPress={() => navigation.navigate('More', { screen: 'AI' })}
              style={{ width: '48%' }}
              className="bg-white rounded-2xl p-3.5 mb-3 border border-slate-100 shadow-sm flex-row items-center active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-xl bg-purple-50 items-center justify-center mr-2.5">
                <Sparkles size={16} color="#9333EA" />
              </View>
              <Text className="text-xs font-bold text-slate-800">AI Studio</Text>
            </Pressable>

            {/* Service 6: Social Connectors */}
            <Pressable
              onPress={() => navigation.navigate('More', { screen: 'Social' })}
              style={{ width: '48%' }}
              className="bg-white rounded-2xl p-3.5 mb-3 border border-slate-100 shadow-sm flex-row items-center active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-xl bg-cyan-50 items-center justify-center mr-2.5">
                <Share2 size={16} color="#0891B2" />
              </View>
              <Text className="text-xs font-bold text-slate-800">Connectors</Text>
            </Pressable>
          </View>
        </View>

        {/* ==================================================================== */}
        {/* 5. EVENTS / RECENT ACTIVITY SECTION (EXACT VIDEO MATCH)             */}
        {/* ==================================================================== */}
        <View className="px-5 mt-3">
          <Text className="text-lg font-bold text-slate-900 mb-3">Events</Text>

          {/* Event 1 */}
          <View className="bg-white rounded-2xl p-4 mb-2.5 border border-slate-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mr-3">
                <ShieldCheck size={20} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900">
                  Google Business Profile Synced
                </Text>
                <Text className="text-[11px] text-slate-400 mt-0.5">
                  100% verified credentials in Firestore DB
                </Text>
              </View>
            </View>
            <Text className="text-[10px] font-semibold text-slate-400">Just now</Text>
          </View>

          {/* Event 2 */}
          <View className="bg-white rounded-2xl p-4 mb-2.5 border border-slate-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3">
                <Star size={20} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900">
                  {totalReviews} Customer Reviews Loaded
                </Text>
                <Text className="text-[11px] text-slate-400 mt-0.5">
                  Real-time sentiment score at {averageRatingNum.toFixed(1)}/5
                </Text>
              </View>
            </View>
            <Text className="text-[10px] font-semibold text-slate-400">2h ago</Text>
          </View>

          {/* Event 3 */}
          <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center mr-3">
                <Calendar size={20} color="#9333EA" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900">
                  Monthly Campaign Queue Active
                </Text>
                <Text className="text-[11px] text-slate-400 mt-0.5">
                  3 posts ready for multi-channel dispatch
                </Text>
              </View>
            </View>
            <Text className="text-[10px] font-semibold text-slate-400">Today</Text>
          </View>
        </View>
      </ScrollView>

      {/* ==================================================================== */}
      {/* 6. EXPANDABLE IN-PLACE MODAL (EXACT VIDEO MATCH - FRAME 04)           */}
      {/* ==================================================================== */}
      <Modal
        visible={scheduleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-4">
          <View className="bg-white rounded-3xl p-5 shadow-2xl relative">
            {/* Top Close Button */}
            <Pressable
              onPress={() => setScheduleModalVisible(false)}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center self-end mb-1 active:bg-slate-200"
            >
              <X size={16} color="#0F172A" />
            </Pressable>

            {/* Header info */}
            <Text className="text-xl font-bold text-slate-900">
              3 Upcoming Premiums
            </Text>
            <View className="flex-row items-center mt-1 mb-4">
              <Clock size={12} color="#94A3B8" />
              <Text className="text-xs text-slate-400 font-medium ml-1.5">
                Due in 27 days
              </Text>
            </View>

            {/* Dark Charcoal Container with Campaign Items (Exact Video Frame 04) */}
            <View className="bg-[#1C1D21] rounded-2xl p-3.5">
              {/* Item 1 */}
              <View className="flex-row items-center justify-between py-2.5 border-b border-neutral-800">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-5 h-5 rounded-full bg-orange-500 items-center justify-center mr-3">
                    <Check size={12} color="#FFFFFF" />
                  </View>
                  <View className="w-8 h-8 rounded-full bg-neutral-700 items-center justify-center mr-2.5">
                    <Text className="text-white text-xs font-bold">W</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-white">Willie Schulist</Text>
                    <Text className="text-[10px] text-slate-400">HI1418872904-BB</Text>
                  </View>
                </View>
                <Text className="text-xs font-bold text-white">$1,232.98</Text>
              </View>

              {/* Item 2 */}
              <View className="flex-row items-center justify-between py-2.5 border-b border-neutral-800">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-5 h-5 rounded-full bg-orange-500 items-center justify-center mr-3">
                    <Check size={12} color="#FFFFFF" />
                  </View>
                  <View className="w-8 h-8 rounded-full bg-neutral-700 items-center justify-center mr-2.5">
                    <Text className="text-white text-xs font-bold">A</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-white">Anne Marquardt</Text>
                    <Text className="text-[10px] text-slate-400">HI1418872904-BB</Text>
                  </View>
                </View>
                <Text className="text-xs font-bold text-white">$1,232.98</Text>
              </View>

              {/* Item 3 */}
              <View className="flex-row items-center justify-between py-2.5">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-5 h-5 rounded-full bg-orange-500 items-center justify-center mr-3">
                    <Check size={12} color="#FFFFFF" />
                  </View>
                  <View className="w-8 h-8 rounded-full bg-neutral-700 items-center justify-center mr-2.5">
                    <Text className="text-white text-xs font-bold">K</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-white">Kristine Gibson</Text>
                    <Text className="text-[10px] text-slate-400">HI1418872904-BB</Text>
                  </View>
                </View>
                <Text className="text-xs font-bold text-white">$1,232.98</Text>
              </View>

              {/* Action Slider Pill */}
              <View className="mt-4 pt-3 border-t border-neutral-800 flex-row items-center justify-between">
                <Pressable
                  onPress={() => setScheduleModalVisible(false)}
                  className="bg-white active:bg-slate-200 px-5 py-2.5 rounded-full"
                >
                  <Text className="text-xs font-bold text-black">Pay Now</Text>
                </Pressable>
                <Text className="text-[11px] text-slate-400 font-medium">
                  Slide to Confirm Payment ➔
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
