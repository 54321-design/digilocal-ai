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
  Globe,
  Share2,
  Sparkles,
  FileText,
  UploadCloud,
  Building2,
  X,
  Check,
  Calendar,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
} from 'lucide-react-native';
import Svg, { Path, Rect } from 'react-native-svg';
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
  const { user, signInWithGoogle } = useAuth();
  const {
    isConnected,
    locations,
    selectedLocation,
    isAllLocationsSelected,
    refreshGoogleData,
  } = useGoogle();
  const { reviews, refreshReviews, sentimentReport, totalReviewCount } = useReviews();
  const { connectedCount } = useSocial();
  const { audit, runWebAudit } = useSEO();
  const { locationPosts } = usePosts();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGoogleData(), refreshReviews()]);
    if (selectedLocation?.websiteUri) {
      await runWebAudit(selectedLocation.websiteUri);
    }
    setRefreshing(false);
  };

  // Real Reviews Metrics
  const totalReviews = Math.max(totalReviewCount || 0, reviews.length);
  const unansweredReviews = useMemo(
    () => reviews.filter((r) => !r.reviewReply?.comment),
    [reviews]
  );

  const averageRatingNum = useMemo(() => {
    if (sentimentReport?.averageRating) return Number(sentimentReport.averageRating);
    if (reviews.length === 0) return 0;
    return Number(
      (reviews.reduce((acc, r) => acc + r.numericRating, 0) / reviews.length).toFixed(1)
    );
  }, [sentimentReport, reviews]);

  // Real Scheduled Posts from PostsContext
  const scheduledPosts = useMemo(
    () => locationPosts.filter((p) => p.status === 'scheduled'),
    [locationPosts]
  );

  // Real Owner / Business Name (No fake names)
  const ownerName = useMemo(() => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    if (selectedLocation?.title) return selectedLocation.title;
    return 'Business Owner';
  }, [user, selectedLocation]);

  // Real Dynamic Alert Capsule (No fake claims)
  const alertConfig = useMemo(() => {
    if (!isConnected) {
      return {
        badge: '!',
        badgeBg: 'bg-amber-500',
        text: 'Connect Google Business Profile to sync storefronts',
        onPress: () => signInWithGoogle(),
      };
    }
    if (unansweredReviews.length > 0) {
      return {
        badge: String(unansweredReviews.length),
        badgeBg: 'bg-orange-500',
        text: `You have ${unansweredReviews.length} customer review${
          unansweredReviews.length === 1 ? '' : 's'
        } waiting for response`,
        onPress: () => navigation.navigate('Reviews'),
      };
    }
    if (scheduledPosts.length > 0) {
      return {
        badge: String(scheduledPosts.length),
        badgeBg: 'bg-blue-600',
        text: `${scheduledPosts.length} post${
          scheduledPosts.length === 1 ? '' : 's'
        } queued for multi-channel dispatch`,
        onPress: () => navigation.navigate('Posts'),
      };
    }
    return {
      badge: '✓',
      badgeBg: 'bg-emerald-600',
      text: `${locations.length} Storefront${
        locations.length === 1 ? '' : 's'
      } synced with Google Business Profile`,
      onPress: () => navigation.navigate('More', { screen: 'Locations' }),
    };
  }, [isConnected, unansweredReviews, scheduledPosts, locations, signInWithGoogle, navigation]);

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
        {/* 1. WARM SUNSET LIQUID GRADIENT HEADER MESH                          */}
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
                {ownerName}
              </Text>
            </View>

            {/* Location Pill Button */}
            <Pressable
              onPress={() => navigation.navigate('More', { screen: 'Locations' })}
              className="bg-white/20 px-3 py-1.5 rounded-full flex-row items-center border border-white/30 backdrop-blur-md"
            >
              <MapPin size={12} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold ml-1.5" numberOfLines={1}>
                {selectedLocation?.title || (isConnected ? `${locations.length} Storefronts` : 'Connect GMB')}
              </Text>
            </Pressable>
          </View>

          {/* ================================================================ */}
          {/* 2. TRANSLUCENT GLASS ALERT PILL (100% REAL GMB DATA)              */}
          {/* ================================================================ */}
          <Pressable
            onPress={alertConfig.onPress}
            className="bg-white/85 rounded-2xl p-3 flex-row items-center justify-between shadow-lg shadow-black/5 border border-white/60 active:bg-white"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View
                className={`w-8 h-8 rounded-xl ${alertConfig.badgeBg} items-center justify-center mr-3 shadow-sm`}
              >
                <Text className="text-white font-black text-sm">{alertConfig.badge}</Text>
              </View>
              <Text className="text-slate-900 font-semibold text-xs flex-1" numberOfLines={1}>
                {alertConfig.text}
              </Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </Pressable>
        </LinearGradient>

        {/* ==================================================================== */}
        {/* 3. SIGNATURE HERO METRIC CARD (100% REAL GOOGLE PROFILE DATA)        */}
        {/* ==================================================================== */}
        <View className="px-4 -mt-6">
          <View className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            {/* Watermark in top-right */}
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
                  {scheduledPosts.length > 0
                    ? `${scheduledPosts.length} Scheduled Posts`
                    : unansweredReviews.length > 0
                    ? `${unansweredReviews.length} Reviews Pending`
                    : 'Google Profile Status'}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Clock size={12} color="#94A3B8" />
                  <Text className="text-xs text-slate-400 font-medium ml-1.5">
                    {scheduledPosts.length > 0
                      ? 'Queue active for storefront'
                      : unansweredReviews.length > 0
                      ? 'Reply to boost local SEO'
                      : 'Live sync with Google API'}
                  </Text>
                </View>
              </View>

              {/* Dark Charcoal Pill Button */}
              <Pressable
                onPress={() => {
                  if (scheduledPosts.length > 0 || unansweredReviews.length > 0) {
                    setModalVisible(true);
                  } else {
                    navigation.navigate('Posts');
                  }
                }}
                className="bg-neutral-900 active:bg-black px-5 py-2.5 rounded-full shadow-md"
              >
                <Text className="text-xs font-semibold text-white">
                  {scheduledPosts.length > 0
                    ? 'View Queue'
                    : unansweredReviews.length > 0
                    ? 'View Reviews'
                    : 'Create Post'}
                </Text>
              </Pressable>
            </View>

            {/* Metric Value at bottom */}
            <View className="mt-6 flex-row items-baseline justify-between">
              <View>
                <Text className="text-2xl font-black text-slate-900 tracking-tight">
                  {totalReviews > 0 ? `${averageRatingNum.toFixed(1)} ★ Rating` : 'No Reviews Yet'}
                </Text>
                <Text className="text-xs font-semibold text-emerald-600 mt-0.5">
                  {totalReviews > 0 ? `${totalReviews} customer reviews on Google` : 'Awaiting first review'}
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-sm font-bold text-slate-900">
                  {isConnected ? `${locations.length} Storefront${locations.length === 1 ? '' : 's'}` : 'Not Connected'}
                </Text>
                <Text className="text-[11px] text-slate-400">
                  {isConnected ? 'Google Verified' : 'Tap to Connect'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ==================================================================== */}
        {/* 4. SERVICES SECTION (2X3 PILL CHIPS GRID - 100% GMB SERVICES)       */}
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

            {/* Service 3: Storefront Locations */}
            <Pressable
              onPress={() => navigation.navigate('More', { screen: 'Locations' })}
              style={{ width: '48%' }}
              className="bg-white rounded-2xl p-3.5 mb-3 border border-slate-100 shadow-sm flex-row items-center active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-xl bg-emerald-50 items-center justify-center mr-2.5">
                <Building2 size={16} color="#059669" />
              </View>
              <Text className="text-xs font-bold text-slate-800">Storefronts</Text>
            </Pressable>

            {/* Service 4: Customer Reviews */}
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

            {/* Service 5: AI Copilot */}
            <Pressable
              onPress={() => navigation.navigate('More', { screen: 'AI' })}
              style={{ width: '48%' }}
              className="bg-white rounded-2xl p-3.5 mb-3 border border-slate-100 shadow-sm flex-row items-center active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-xl bg-purple-50 items-center justify-center mr-2.5">
                <Sparkles size={16} color="#9333EA" />
              </View>
              <Text className="text-xs font-bold text-slate-800">AI Copilot</Text>
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
        {/* 5. RECENT ACTIVITY (100% REAL DYNAMIC EVENTS)                        */}
        {/* ==================================================================== */}
        <View className="px-5 mt-3">
          <Text className="text-lg font-bold text-slate-900 mb-3">Recent Activity</Text>

          {/* Event 1: GMB Connection Status */}
          <View className="bg-white rounded-2xl p-4 mb-2.5 border border-slate-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View
                className={`w-10 h-10 rounded-xl ${
                  isConnected ? 'bg-emerald-50' : 'bg-amber-50'
                } items-center justify-center mr-3`}
              >
                {isConnected ? (
                  <ShieldCheck size={20} color="#059669" />
                ) : (
                  <AlertCircle size={20} color="#D97706" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900">
                  {isConnected ? 'Google Business Profile Synced' : 'Google Business Not Linked'}
                </Text>
                <Text className="text-[11px] text-slate-400 mt-0.5">
                  {isConnected
                    ? `Live sync active with ${locations.length} storefront${locations.length === 1 ? '' : 's'}`
                    : 'Tap to connect your Google storefront'}
                </Text>
              </View>
            </View>
            <Text className="text-[10px] font-semibold text-slate-400">Live</Text>
          </View>

          {/* Event 2: Latest Customer Review */}
          <View className="bg-white rounded-2xl p-4 mb-2.5 border border-slate-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3">
                <Star size={20} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
                  {reviews.length > 0
                    ? `${reviews[0].reviewer.displayName || 'Customer'} (${reviews[0].numericRating}★)`
                    : 'No Customer Reviews Yet'}
                </Text>
                <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={1}>
                  {reviews.length > 0
                    ? reviews[0].comment || '5-star rating without written comment'
                    : 'Customer reviews will appear here in real-time'}
                </Text>
              </View>
            </View>
            <Text className="text-[10px] font-semibold text-slate-400">
              {reviews.length > 0 ? 'Recent' : '—'}
            </Text>
          </View>

          {/* Event 3: Latest Social Campaign */}
          <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center mr-3">
                <Calendar size={20} color="#9333EA" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
                  {locationPosts.length > 0
                    ? `Campaign: ${locationPosts[0].summary.slice(0, 28)}...`
                    : 'No Active Campaigns'}
                </Text>
                <Text className="text-[11px] text-slate-400 mt-0.5">
                  {locationPosts.length > 0
                    ? `Status: ${locationPosts[0].status} on GMB`
                    : 'Create or import posts to auto-schedule'}
                </Text>
              </View>
            </View>
            <Text className="text-[10px] font-semibold text-slate-400">
              {locationPosts.length > 0 ? 'Scheduled' : '—'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ==================================================================== */}
      {/* 6. EXPANDABLE IN-PLACE MODAL (100% REAL GMB POSTS / REVIEWS)          */}
      {/* ==================================================================== */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-4">
          <View className="bg-white rounded-3xl p-5 shadow-2xl relative">
            {/* Top Close Button */}
            <Pressable
              onPress={() => setModalVisible(false)}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center self-end mb-1 active:bg-slate-200"
            >
              <X size={16} color="#0F172A" />
            </Pressable>

            {/* Header info */}
            <Text className="text-xl font-bold text-slate-900">
              {scheduledPosts.length > 0
                ? 'Scheduled Campaigns'
                : 'Pending Reviews'}
            </Text>
            <View className="flex-row items-center mt-1 mb-4">
              <Clock size={12} color="#94A3B8" />
              <Text className="text-xs text-slate-400 font-medium ml-1.5">
                {scheduledPosts.length > 0
                  ? `${scheduledPosts.length} posts queued for multi-channel dispatch`
                  : `${unansweredReviews.length} reviews awaiting your reply`}
              </Text>
            </View>

            {/* Dark Charcoal Container with Real Items */}
            <View className="bg-[#1C1D21] rounded-2xl p-3.5">
              {scheduledPosts.length > 0 ? (
                // Real Scheduled Posts
                scheduledPosts.slice(0, 3).map((post, idx) => (
                  <View
                    key={post.id || idx}
                    className={`flex-row items-center justify-between py-2.5 ${
                      idx < Math.min(scheduledPosts.length, 3) - 1 ? 'border-b border-neutral-800' : ''
                    }`}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-5 h-5 rounded-full bg-orange-500 items-center justify-center mr-3">
                        <Check size={12} color="#FFFFFF" />
                      </View>
                      <View className="w-8 h-8 rounded-full bg-neutral-700 items-center justify-center mr-2.5">
                        <FileText size={14} color="#FFFFFF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-white" numberOfLines={1}>
                          {post.summary || 'Scheduled Post'}
                        </Text>
                        <Text className="text-[10px] text-slate-400">
                          {post.locationName || 'Google Storefront'}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs font-bold text-emerald-400">Queued</Text>
                  </View>
                ))
              ) : unansweredReviews.length > 0 ? (
                // Real Unanswered Reviews
                unansweredReviews.slice(0, 3).map((rev, idx) => (
                  <View
                    key={rev.id || idx}
                    className={`flex-row items-center justify-between py-2.5 ${
                      idx < Math.min(unansweredReviews.length, 3) - 1 ? 'border-b border-neutral-800' : ''
                    }`}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-5 h-5 rounded-full bg-orange-500 items-center justify-center mr-3">
                        <Check size={12} color="#FFFFFF" />
                      </View>
                      <View className="w-8 h-8 rounded-full bg-neutral-700 items-center justify-center mr-2.5">
                        <Text className="text-white text-xs font-bold">
                          {(rev.reviewer.displayName || 'C')[0]}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-white" numberOfLines={1}>
                          {rev.reviewer.displayName || 'Customer'}
                        </Text>
                        <Text className="text-[10px] text-slate-400" numberOfLines={1}>
                          {rev.comment || 'Star rating only'}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs font-bold text-amber-400">{rev.numericRating}★</Text>
                  </View>
                ))
              ) : (
                <View className="py-4 items-center">
                  <Text className="text-xs text-slate-400">All campaigns & reviews up to date.</Text>
                </View>
              )}

              {/* Action Row */}
              <View className="mt-4 pt-3 border-t border-neutral-800 flex-row items-center justify-between">
                <Pressable
                  onPress={() => {
                    setModalVisible(false);
                    if (scheduledPosts.length > 0) {
                      navigation.navigate('Posts');
                    } else {
                      navigation.navigate('Reviews');
                    }
                  }}
                  className="bg-white active:bg-slate-200 px-5 py-2.5 rounded-full"
                >
                  <Text className="text-xs font-bold text-black">
                    {scheduledPosts.length > 0 ? 'Manage Posts' : 'Open Reviews'}
                  </Text>
                </Pressable>
                <Text className="text-[11px] text-slate-400 font-medium">
                  {scheduledPosts.length > 0 ? 'Multi-Channel Dispatch ➔' : 'Reply with AI Studio ➔'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
